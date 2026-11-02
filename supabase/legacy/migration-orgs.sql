-- =============================================
-- PROJEX — Multi-User Organizations Migration
-- 
-- Adds: organizations, org_members
-- Modifies: adds org_id to all data tables
-- Rewrites: RLS policies for org-scoped access
-- Backfills: creates org for each existing user
-- 
-- Safe to run on existing databases.
-- Run AFTER the base migration.sql
-- =============================================


-- =============================================
-- 1. ORGANIZATIONS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'My Company',
  slug TEXT UNIQUE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  logo_url TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  default_terms TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.org_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'worker' CHECK (role IN ('owner','admin','manager','supervisor','worker','viewer')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('active','pending','deactivated')),
  invited_by UUID REFERENCES auth.users(id),
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, email)
);

CREATE INDEX IF NOT EXISTS idx_org_members_org ON public.org_members(org_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user ON public.org_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_email ON public.org_members(email);
CREATE INDEX IF NOT EXISTS idx_organizations_owner ON public.organizations(owner_id);


-- =============================================
-- 2. ADD org_id TO ALL DATA TABLES
-- =============================================

DO $$ BEGIN
  -- Projects
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='org_id') THEN
    ALTER TABLE public.projects ADD COLUMN org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_projects_org ON public.projects(org_id);
  END IF;

  -- Tasks
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='org_id') THEN
    ALTER TABLE public.tasks ADD COLUMN org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_tasks_org ON public.tasks(org_id);
  END IF;

  -- Generated Documents
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='generated_documents' AND column_name='org_id') THEN
    ALTER TABLE public.generated_documents ADD COLUMN org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_gendocs_org ON public.generated_documents(org_id);
  END IF;

  -- Events (calendar)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='org_id') THEN
    ALTER TABLE public.events ADD COLUMN org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_events_org ON public.events(org_id);
  END IF;

  -- Team Members
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='team_members' AND column_name='org_id') THEN
    ALTER TABLE public.team_members ADD COLUMN org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_team_members_org ON public.team_members(org_id);
  END IF;

  -- Messages
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='messages' AND column_name='org_id') THEN
    ALTER TABLE public.messages ADD COLUMN org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_messages_org ON public.messages(org_id);
  END IF;

  -- Expenses
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='expenses' AND column_name='org_id') THEN
    ALTER TABLE public.expenses ADD COLUMN org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_expenses_org ON public.expenses(org_id);
  END IF;

  -- Phases
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='phases' AND column_name='org_id') THEN
    ALTER TABLE public.phases ADD COLUMN org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_phases_org ON public.phases(org_id);
  END IF;

  -- Documents (file uploads)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documents' AND column_name='org_id') THEN
    ALTER TABLE public.documents ADD COLUMN org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_documents_org ON public.documents(org_id);
  END IF;

  -- Meetings
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='meetings' AND column_name='org_id') THEN
    ALTER TABLE public.meetings ADD COLUMN org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_meetings_org ON public.meetings(org_id);
  END IF;

  -- Branches
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='branches' AND column_name='org_id') THEN
    ALTER TABLE public.branches ADD COLUMN org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_branches_org ON public.branches(org_id);
  END IF;

  -- Notifications
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notifications' AND column_name='org_id') THEN
    ALTER TABLE public.notifications ADD COLUMN org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_notifications_org ON public.notifications(org_id);
  END IF;

  -- Subscriptions (stays per-org, not per-user)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='org_id') THEN
    ALTER TABLE public.subscriptions ADD COLUMN org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;

  -- Profiles: add org_id for current org
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='org_id') THEN
    ALTER TABLE public.profiles ADD COLUMN org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;
  END IF;
END $$;


-- =============================================
-- 3. BACKFILL — Create org for each existing user
-- =============================================

-- Create an org for every user who doesn't have one
INSERT INTO public.organizations (id, name, owner_id)
SELECT gen_random_uuid(), COALESCE(p.full_name, p.email, 'My Company'), u.id
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.id NOT IN (SELECT owner_id FROM public.organizations)
ON CONFLICT DO NOTHING;

-- Create owner membership for each org
INSERT INTO public.org_members (org_id, user_id, email, name, role, status, joined_at)
SELECT o.id, o.owner_id, COALESCE(p.email, u.email), COALESCE(p.full_name, ''), 'owner', 'active', now()
FROM public.organizations o
JOIN auth.users u ON u.id = o.owner_id
LEFT JOIN public.profiles p ON p.id = o.owner_id
WHERE NOT EXISTS (
  SELECT 1 FROM public.org_members om WHERE om.org_id = o.id AND om.user_id = o.owner_id
)
ON CONFLICT (org_id, email) DO NOTHING;

-- Set profile.org_id for existing users
UPDATE public.profiles p
SET org_id = o.id
FROM public.organizations o
WHERE o.owner_id = p.id AND p.org_id IS NULL;

-- Backfill org_id on all existing data rows
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'projects', 'tasks', 'generated_documents', 'events', 'team_members',
    'messages', 'expenses', 'phases', 'documents', 'meetings', 'branches',
    'notifications', 'subscriptions'
  ] LOOP
    EXECUTE format(
      'UPDATE public.%I t SET org_id = o.id FROM public.organizations o WHERE o.owner_id = t.user_id AND t.org_id IS NULL',
      tbl
    );
  END LOOP;
END $$;


-- =============================================
-- 4. HELPER FUNCTION — Check org membership
-- =============================================

CREATE OR REPLACE FUNCTION public.user_org_ids(uid UUID)
RETURNS SETOF UUID AS $$
  SELECT org_id FROM public.org_members WHERE user_id = uid AND status = 'active'
$$ LANGUAGE sql SECURITY DEFINER STABLE;


-- =============================================
-- 5. RLS — Rewrite all policies for org-scoped access
-- =============================================

-- ORGANIZATIONS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "org_select" ON public.organizations;
DROP POLICY IF EXISTS "org_update" ON public.organizations;
DROP POLICY IF EXISTS "org_insert" ON public.organizations;
CREATE POLICY "org_select" ON public.organizations FOR SELECT USING (id IN (SELECT public.user_org_ids(auth.uid())));
CREATE POLICY "org_update" ON public.organizations FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "org_insert" ON public.organizations FOR INSERT WITH CHECK (owner_id = auth.uid());

-- ORG MEMBERS
ALTER TABLE public.org_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "orgmem_select" ON public.org_members;
DROP POLICY IF EXISTS "orgmem_insert" ON public.org_members;
DROP POLICY IF EXISTS "orgmem_update" ON public.org_members;
DROP POLICY IF EXISTS "orgmem_delete" ON public.org_members;
CREATE POLICY "orgmem_select" ON public.org_members FOR SELECT USING (org_id IN (SELECT public.user_org_ids(auth.uid())));
CREATE POLICY "orgmem_insert" ON public.org_members FOR INSERT WITH CHECK (
  org_id IN (SELECT public.user_org_ids(auth.uid()))
);
CREATE POLICY "orgmem_update" ON public.org_members FOR UPDATE USING (
  org_id IN (SELECT om.org_id FROM public.org_members om WHERE om.user_id = auth.uid() AND om.role IN ('owner','admin'))
);
CREATE POLICY "orgmem_delete" ON public.org_members FOR DELETE USING (
  org_id IN (SELECT om.org_id FROM public.org_members om WHERE om.user_id = auth.uid() AND om.role IN ('owner','admin'))
);

-- MACRO: Rewrite policies for all org-scoped data tables
-- Pattern: SELECT/INSERT/UPDATE/DELETE all check org membership
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'projects', 'tasks', 'generated_documents', 'events', 'team_members',
    'messages', 'expenses', 'phases', 'documents', 'meetings', 'branches'
  ] LOOP
    -- Drop old user-scoped policies
    EXECUTE format('DROP POLICY IF EXISTS "%s_select" ON public.%I', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "%s_insert" ON public.%I', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "%s_update" ON public.%I', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "%s_delete" ON public.%I', tbl, tbl);
    -- Also drop common old policy names
    EXECUTE format('DROP POLICY IF EXISTS "Users can view own %s" ON public.%I', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Users can insert own %s" ON public.%I', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Users can update own %s" ON public.%I', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Users can delete own %s" ON public.%I', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.%I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated users full access" ON public.%I', tbl);

    -- Create org-scoped policies
    EXECUTE format(
      'CREATE POLICY "org_%s_select" ON public.%I FOR SELECT USING (org_id IN (SELECT public.user_org_ids(auth.uid())))',
      tbl, tbl
    );
    EXECUTE format(
      'CREATE POLICY "org_%s_insert" ON public.%I FOR INSERT WITH CHECK (org_id IN (SELECT public.user_org_ids(auth.uid())))',
      tbl, tbl
    );
    EXECUTE format(
      'CREATE POLICY "org_%s_update" ON public.%I FOR UPDATE USING (org_id IN (SELECT public.user_org_ids(auth.uid())))',
      tbl, tbl
    );
    EXECUTE format(
      'CREATE POLICY "org_%s_delete" ON public.%I FOR DELETE USING (org_id IN (SELECT public.user_org_ids(auth.uid())))',
      tbl, tbl
    );
  END LOOP;
END $$;

-- Notifications: user still sees only their own, but within their orgs
DROP POLICY IF EXISTS "notif_select" ON public.notifications;
DROP POLICY IF EXISTS "notif_insert" ON public.notifications;
DROP POLICY IF EXISTS "notif_update" ON public.notifications;
DROP POLICY IF EXISTS "notif_delete" ON public.notifications;
CREATE POLICY "notif_select" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notif_insert" ON public.notifications FOR INSERT WITH CHECK (
  org_id IN (SELECT public.user_org_ids(auth.uid()))
);
CREATE POLICY "notif_update" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "notif_delete" ON public.notifications FOR DELETE USING (auth.uid() = user_id);


-- =============================================
-- 6. UPDATE SIGNUP TRIGGER
--    Creates org + membership on new user signup
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_org_id UUID;
  invite_org_id UUID;
  invite_role TEXT;
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, email, full_name, plan)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'free'
  )
  ON CONFLICT (id) DO NOTHING;

  -- Check if this user was invited to an existing org
  SELECT om.org_id, om.role INTO invite_org_id, invite_role
  FROM public.org_members om
  WHERE om.email = NEW.email AND om.user_id IS NULL AND om.status = 'pending'
  LIMIT 1;

  IF invite_org_id IS NOT NULL THEN
    -- Activate the pending membership
    UPDATE public.org_members
    SET user_id = NEW.id, status = 'active', joined_at = now()
    WHERE org_id = invite_org_id AND email = NEW.email AND user_id IS NULL;

    -- Set profile org
    UPDATE public.profiles SET org_id = invite_org_id WHERE id = NEW.id;
  ELSE
    -- Create new org for this user
    INSERT INTO public.organizations (name, owner_id)
    VALUES (COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'My Company'), NEW.id)
    RETURNING id INTO new_org_id;

    -- Create owner membership
    INSERT INTO public.org_members (org_id, user_id, email, name, role, status, joined_at)
    VALUES (new_org_id, NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), 'owner', 'active', now());

    -- Set profile org
    UPDATE public.profiles SET org_id = new_org_id WHERE id = NEW.id;

    -- Create free subscription for the org
    INSERT INTO public.subscriptions (user_id, org_id, plan, status)
    VALUES (NEW.id, new_org_id, 'free', 'none')
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  -- Legacy: create user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE(invite_role, 'owner'))
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- =============================================
-- 7. REALTIME — Add new tables
-- =============================================

DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.organizations; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.org_members; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;


-- =============================================
-- 8. TRIGGERS
-- =============================================

DROP TRIGGER IF EXISTS update_organizations_updated_at ON public.organizations;
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- =============================================
-- VERIFICATION
-- 
-- SELECT * FROM public.organizations;
-- SELECT * FROM public.org_members;
-- SELECT org_id FROM public.projects LIMIT 5;
-- =============================================

-- =============================================
-- 9. BACKFILL — Set org_id on subscriptions
-- =============================================
UPDATE public.subscriptions s
SET org_id = p.org_id
FROM public.profiles p
WHERE p.id = s.user_id AND s.org_id IS NULL AND p.org_id IS NOT NULL;
