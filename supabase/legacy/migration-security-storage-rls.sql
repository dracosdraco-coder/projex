-- =============================================
-- PROJEX — Storage, client portal & RLS hardening (review §1.2–1.4)
--
-- 1. documents bucket → private, org-scoped paths ({org_id}/...)
-- 2. projects.portal_token for unguessable client portal links
-- 3. org_members: fix "infinite recursion" policies, admin-only writes
-- 4. notifications: insert only for yourself or members of your org
-- 5. referrals: drop public insert/update (server-only now)
-- 6. message_attachments: visible to the whole org, not just the author
-- 7. accept_pending_invites() for onboarding
--
-- Run on a staging/branch project first. Safe to run more than once.
-- =============================================


-- =============================================
-- 1. STORAGE
-- =============================================

UPDATE storage.buckets SET public = false WHERE id = 'documents';

DROP POLICY IF EXISTS "Users upload to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users read own files" ON storage.objects;
DROP POLICY IF EXISTS "Users delete own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;
DROP POLICY IF EXISTS "Public read documents" ON storage.objects;
DROP POLICY IF EXISTS "Public can read documents" ON storage.objects;
DROP POLICY IF EXISTS "documents_org_select" ON storage.objects;
DROP POLICY IF EXISTS "documents_org_insert" ON storage.objects;
DROP POLICY IF EXISTS "documents_org_update" ON storage.objects;
DROP POLICY IF EXISTS "documents_org_delete" ON storage.objects;

-- First path segment must be an org the user is an active member of.
-- Uses a text comparison so legacy paths ("messages/…", "{user_id}/…") don't
-- throw on a uuid cast.
CREATE OR REPLACE FUNCTION public.user_org_folder_ok(object_name text)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT (storage.foldername(object_name))[1] IN (
    SELECT org_id::text FROM public.org_members WHERE user_id = auth.uid() AND status = 'active'
  )
$$;

-- Legacy files (uploaded before org-scoped paths) stay readable by anyone who
-- shares an org with the uploader, until scripts/migrate-storage-paths.ts moves them.
CREATE OR REPLACE FUNCTION public.shares_org_with(other_user text)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.org_members a
    JOIN public.org_members b ON a.org_id = b.org_id
    WHERE a.user_id = auth.uid() AND a.status = 'active'
      AND b.user_id::text = other_user AND b.status = 'active'
  )
$$;

CREATE POLICY "documents_org_select" ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id = 'documents' AND (
    public.user_org_folder_ok(name)
    OR public.shares_org_with(COALESCE(owner_id, owner::text))
  )
);
CREATE POLICY "documents_org_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'documents' AND public.user_org_folder_ok(name)
);
CREATE POLICY "documents_org_update" ON storage.objects FOR UPDATE TO authenticated USING (
  bucket_id = 'documents' AND public.user_org_folder_ok(name)
);
CREATE POLICY "documents_org_delete" ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id = 'documents' AND (
    public.user_org_folder_ok(name)
    OR COALESCE(owner_id, owner::text) = auth.uid()::text
  )
);

-- Public URLs no longer work on a private bucket; the app signs storage_path instead
ALTER TABLE public.photos ALTER COLUMN public_url DROP NOT NULL;


-- =============================================
-- 2. CLIENT PORTAL TOKENS
-- =============================================

ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS portal_token TEXT;
UPDATE public.projects SET portal_token = encode(gen_random_bytes(24), 'hex') WHERE portal_token IS NULL;
ALTER TABLE public.projects ALTER COLUMN portal_token SET DEFAULT encode(gen_random_bytes(24), 'hex');
CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_portal_token ON public.projects(portal_token);


-- =============================================
-- 3. ORG_MEMBERS — no self-referencing policies
-- =============================================

CREATE OR REPLACE FUNCTION public.user_admin_org_ids(uid uuid)
RETURNS SETOF uuid
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT org_id FROM public.org_members
  WHERE user_id = uid AND status = 'active' AND role IN ('owner', 'admin')
$$;

DROP POLICY IF EXISTS "orgmem_insert" ON public.org_members;
DROP POLICY IF EXISTS "orgmem_update" ON public.org_members;
DROP POLICY IF EXISTS "orgmem_delete" ON public.org_members;

-- Admins add members; an org's owner can add their own owner row (onboarding)
CREATE POLICY "orgmem_insert" ON public.org_members FOR INSERT WITH CHECK (
  (org_id IN (SELECT public.user_admin_org_ids(auth.uid())) AND role <> 'owner')
  OR (
    user_id = auth.uid() AND role = 'owner'
    AND org_id IN (SELECT id FROM public.organizations WHERE owner_id = auth.uid())
  )
);

-- Admins manage members; only the owner can touch the owner row or grant 'owner'
CREATE POLICY "orgmem_update" ON public.org_members FOR UPDATE
  USING (
    org_id IN (SELECT public.user_admin_org_ids(auth.uid()))
    AND (role <> 'owner' OR user_id = auth.uid())
  )
  WITH CHECK (
    org_id IN (SELECT public.user_admin_org_ids(auth.uid()))
    AND (role <> 'owner' OR org_id IN (SELECT id FROM public.organizations WHERE owner_id = auth.uid()))
  );

CREATE POLICY "orgmem_delete" ON public.org_members FOR DELETE USING (
  org_id IN (SELECT public.user_admin_org_ids(auth.uid())) AND role <> 'owner'
);


-- =============================================
-- 4. NOTIFICATIONS
-- =============================================

DROP POLICY IF EXISTS "notif_insert" ON public.notifications;
CREATE POLICY "notif_insert" ON public.notifications FOR INSERT WITH CHECK (
  user_id = auth.uid()
  OR (
    org_id IN (SELECT public.user_org_ids(auth.uid()))
    AND user_id IN (
      SELECT om.user_id FROM public.org_members om
      WHERE om.org_id = notifications.org_id AND om.status = 'active'
    )
  )
);


-- =============================================
-- 5. REFERRALS — writes go through /api/referrals (service role)
-- =============================================

DROP POLICY IF EXISTS "Anyone can insert referrals" ON public.referrals;
DROP POLICY IF EXISTS "System can update referrals" ON public.referrals;


-- =============================================
-- 6. MESSAGE ATTACHMENTS — follow the parent message's org
-- =============================================

DROP POLICY IF EXISTS "msg_attachments_all" ON public.message_attachments;
CREATE POLICY "msg_attachments_all" ON public.message_attachments FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.messages m
    WHERE m.id = message_attachments.message_id
      AND (m.user_id = auth.uid() OR m.org_id IN (SELECT public.user_org_ids(auth.uid())))
  )
);


-- =============================================
-- 7. ACCEPT PENDING INVITES (called from onboarding)
--
-- Activates pending memberships whose email matches the caller's verified
-- auth email. Role is left as the inviter set it. Returns the org joined.
-- Replaced by token-based invites in §2.
-- =============================================

CREATE OR REPLACE FUNCTION public.accept_pending_invites(display_name text DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  my_email text := lower(auth.jwt() ->> 'email');
  joined uuid;
  updated int;
BEGIN
  IF auth.uid() IS NULL OR my_email IS NULL THEN
    RETURN NULL;
  END IF;

  UPDATE public.org_members
  SET user_id = auth.uid(),
      name = COALESCE(NULLIF(display_name, ''), name),
      status = 'active',
      joined_at = now()
  WHERE lower(email) = my_email AND status = 'pending';

  GET DIAGNOSTICS updated = ROW_COUNT;
  IF updated = 0 THEN
    RETURN NULL;
  END IF;

  SELECT org_id INTO joined FROM public.org_members
  WHERE user_id = auth.uid() AND lower(email) = my_email AND status = 'active'
  ORDER BY joined_at DESC NULLS LAST
  LIMIT 1;

  IF joined IS NOT NULL THEN
    UPDATE public.profiles SET org_id = joined WHERE id = auth.uid();
  END IF;

  RETURN joined;
END;
$$;

REVOKE ALL ON FUNCTION public.accept_pending_invites(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.accept_pending_invites(text) TO authenticated;
