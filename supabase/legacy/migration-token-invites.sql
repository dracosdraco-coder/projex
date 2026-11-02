-- =============================================
-- PROJEX — Token invites & one membership model (review §2)
--
-- 1. Backfill missing owner memberships; lowercase member emails
-- 2. org_invites table (token, expiry, revoke, accept)
-- 3. team_members linked to the invite / org membership it came from
-- 4. accept_org_invite(token) + accept_pending_invites() (email fallback)
-- 5. handle_new_user(): no stray org for people signing up from an invite
-- 6. Convert any legacy pending org_members rows into invites
--
-- Requires migration-security-storage-rls.sql (user_admin_org_ids).
-- Safe to run more than once.
-- =============================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- =============================================
-- 1. MEMBERSHIP CLEANUP
-- =============================================

-- Every org owner needs an active owner row, or RLS locks them out of their own org
INSERT INTO public.org_members (org_id, user_id, email, name, role, status, joined_at)
SELECT o.id, o.owner_id, lower(u.email), COALESCE(p.full_name, ''), 'owner', 'active', now()
FROM public.organizations o
JOIN auth.users u ON u.id = o.owner_id
LEFT JOIN public.profiles p ON p.id = o.owner_id
WHERE NOT EXISTS (
  SELECT 1 FROM public.org_members m WHERE m.org_id = o.id AND m.user_id = o.owner_id
)
ON CONFLICT (org_id, email) DO UPDATE
  SET user_id = EXCLUDED.user_id, role = 'owner', status = 'active';

-- Case-insensitive emails (skip rows that would collide with an existing lowercase twin)
UPDATE public.org_members m SET email = lower(trim(m.email))
WHERE m.email <> lower(trim(m.email))
  AND NOT EXISTS (
    SELECT 1 FROM public.org_members x
    WHERE x.org_id = m.org_id AND x.email = lower(trim(m.email)) AND x.id <> m.id
  );


-- =============================================
-- 2. INVITES
-- =============================================

CREATE TABLE IF NOT EXISTS public.org_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL CHECK (email = lower(email)),
  name TEXT,
  role TEXT NOT NULL DEFAULT 'worker'
    CHECK (role IN ('admin','manager','supervisor','worker','viewer')),
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT now() + interval '7 days',
  accepted_at TIMESTAMPTZ,
  accepted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_org_invites_org ON public.org_invites(org_id);
CREATE INDEX IF NOT EXISTS idx_org_invites_email ON public.org_invites(email);
-- At most one open invite per email per org
CREATE UNIQUE INDEX IF NOT EXISTS idx_org_invites_open
  ON public.org_invites(org_id, email) WHERE accepted_at IS NULL AND revoked_at IS NULL;

ALTER TABLE public.org_invites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "invites_admin_select" ON public.org_invites;
-- Admins can see their org's invites (writes go through /api/invite with the service role)
CREATE POLICY "invites_admin_select" ON public.org_invites FOR SELECT
  USING (org_id IN (SELECT public.user_admin_org_ids(auth.uid())));


-- =============================================
-- 3. LINK THE CONTACT LIST TO REAL MEMBERS
-- =============================================

ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS invite_id UUID
  REFERENCES public.org_invites(id) ON DELETE SET NULL;
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS org_member_id UUID
  REFERENCES public.org_members(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_team_members_org_member ON public.team_members(org_member_id);

-- Link existing contacts to memberships with the same email
UPDATE public.team_members t SET org_member_id = m.id
FROM public.org_members m
WHERE t.org_member_id IS NULL AND t.org_id = m.org_id
  AND lower(t.email) = m.email AND m.status = 'active';


-- =============================================
-- 4. ACCEPTING INVITES
-- =============================================

-- Internal: turn one invite into an active membership for `uid`. No auth checks.
CREATE OR REPLACE FUNCTION public._apply_invite(inv public.org_invites, uid uuid, uid_email text)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  member_id uuid;
  display_name text;
BEGIN
  SELECT COALESCE(NULLIF(full_name, ''), inv.name, split_part(uid_email, '@', 1))
  INTO display_name FROM public.profiles WHERE id = uid;

  -- Existing membership (any email) for this user in this org?
  SELECT id INTO member_id FROM public.org_members WHERE org_id = inv.org_id AND user_id = uid;

  IF member_id IS NULL THEN
    INSERT INTO public.org_members (org_id, user_id, email, name, role, status, invited_by, joined_at)
    VALUES (inv.org_id, uid, lower(uid_email), display_name, inv.role, 'active', inv.invited_by, now())
    ON CONFLICT (org_id, email) DO UPDATE
      SET user_id = EXCLUDED.user_id, status = 'active', joined_at = now(),
          role = CASE WHEN org_members.role = 'owner' THEN 'owner' ELSE EXCLUDED.role END
    RETURNING id INTO member_id;
  ELSE
    UPDATE public.org_members
    SET status = 'active', joined_at = COALESCE(joined_at, now()),
        role = CASE WHEN role = 'owner' THEN 'owner' ELSE inv.role END
    WHERE id = member_id;
  END IF;

  UPDATE public.org_invites SET accepted_at = now(), accepted_by = uid WHERE id = inv.id;

  -- Link (or create) the contact-list entry
  UPDATE public.team_members SET org_member_id = member_id
  WHERE org_id = inv.org_id AND (invite_id = inv.id OR lower(email) IN (inv.email, lower(uid_email)));
  IF NOT FOUND THEN
    INSERT INTO public.team_members (user_id, org_id, name, email, role, invite_id, org_member_id)
    VALUES (COALESCE(inv.invited_by, uid), inv.org_id, display_name, lower(uid_email), inv.role, inv.id, member_id);
  END IF;

  UPDATE public.profiles SET org_id = inv.org_id WHERE id = uid;
  RETURN inv.org_id;
END;
$$;
REVOKE ALL ON FUNCTION public._apply_invite(public.org_invites, uuid, text) FROM public, anon, authenticated;

-- Accept by token. The token is the proof, so any signed-in email may accept it.
CREATE OR REPLACE FUNCTION public.accept_org_invite(invite_token text)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  inv public.org_invites;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  SELECT * INTO inv FROM public.org_invites WHERE token = invite_token FOR UPDATE;
  IF inv.id IS NULL THEN RAISE EXCEPTION 'invite_not_found'; END IF;
  IF inv.revoked_at IS NOT NULL THEN RAISE EXCEPTION 'invite_revoked'; END IF;
  IF inv.accepted_at IS NOT NULL THEN
    IF inv.accepted_by = auth.uid() THEN RETURN inv.org_id; END IF;
    RAISE EXCEPTION 'invite_used';
  END IF;
  IF inv.expires_at < now() THEN RAISE EXCEPTION 'invite_expired'; END IF;

  RETURN public._apply_invite(inv, auth.uid(), auth.jwt() ->> 'email');
END;
$$;
REVOKE ALL ON FUNCTION public.accept_org_invite(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.accept_org_invite(text) TO authenticated;

-- Fallback for onboarding: accept open invites sent to the caller's verified email.
CREATE OR REPLACE FUNCTION public.accept_pending_invites(display_name text DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  my_email text := lower(auth.jwt() ->> 'email');
  inv public.org_invites;
  joined uuid;
BEGIN
  IF auth.uid() IS NULL OR my_email IS NULL THEN RETURN NULL; END IF;

  IF NULLIF(display_name, '') IS NOT NULL THEN
    UPDATE public.profiles SET full_name = display_name WHERE id = auth.uid() AND COALESCE(full_name, '') = '';
  END IF;

  FOR inv IN
    SELECT * FROM public.org_invites
    WHERE email = my_email AND accepted_at IS NULL AND revoked_at IS NULL AND expires_at > now()
    ORDER BY created_at
  LOOP
    joined := public._apply_invite(inv, auth.uid(), my_email);
  END LOOP;

  RETURN joined;
END;
$$;
REVOKE ALL ON FUNCTION public.accept_pending_invites(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.accept_pending_invites(text) TO authenticated;


-- =============================================
-- 5. SIGNUP TRIGGER
--
-- Same as before (profile, own org, owner row, 7-day Team trial) EXCEPT when
-- the person is signing up from an invite: either the signup carried a valid
-- invite_token in user metadata, or an open invite exists for their email.
-- Then no org is created; /invite/[token] or onboarding attaches them.
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_org_id UUID;
  has_invite BOOLEAN;
BEGIN
  INSERT INTO public.profiles (id, email, full_name, plan)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), 'team')
  ON CONFLICT (id) DO NOTHING;

  SELECT EXISTS (
    SELECT 1 FROM public.org_invites
    WHERE accepted_at IS NULL AND revoked_at IS NULL AND expires_at > now()
      AND (email = lower(NEW.email) OR token = NEW.raw_user_meta_data->>'invite_token')
  ) INTO has_invite;

  IF NOT has_invite THEN
    INSERT INTO public.organizations (name, owner_id)
    VALUES (COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), NEW.email, 'My Company'), NEW.id)
    RETURNING id INTO new_org_id;

    INSERT INTO public.org_members (org_id, user_id, email, name, role, status, joined_at)
    VALUES (new_org_id, NEW.id, lower(NEW.email), COALESCE(NEW.raw_user_meta_data->>'full_name', ''), 'owner', 'active', now());

    UPDATE public.profiles SET org_id = new_org_id WHERE id = NEW.id;

    INSERT INTO public.subscriptions (user_id, org_id, plan, status, trial_ends_at)
    VALUES (NEW.id, new_org_id, 'team', 'trialing', now() + interval '7 days')
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  -- Legacy table still read by older code paths
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, CASE WHEN has_invite THEN 'worker' ELSE 'owner' END)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- =============================================
-- 6. LEGACY PENDING MEMBERSHIPS → INVITES
-- =============================================

INSERT INTO public.org_invites (org_id, email, name, role, invited_by, created_at)
SELECT m.org_id, lower(m.email), m.name,
       CASE WHEN m.role IN ('admin','manager','supervisor','worker','viewer') THEN m.role ELSE 'worker' END,
       m.invited_by, m.created_at
FROM public.org_members m
WHERE m.status = 'pending' AND m.user_id IS NULL
ON CONFLICT DO NOTHING;

DELETE FROM public.org_members WHERE status = 'pending' AND user_id IS NULL;
