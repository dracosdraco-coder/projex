-- =============================================
-- PROJEX — Complete Database Migration
-- 
-- Safe to run on existing databases.
-- Uses IF NOT EXISTS / ON CONFLICT everywhere.
-- Run in: Supabase Dashboard → SQL Editor
-- =============================================


-- =============================================
-- 1. CORE TABLES (skip if they exist)
-- =============================================

-- Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  company TEXT,
  phone TEXT,
  avatar_url TEXT,
  plan TEXT DEFAULT 'free',
  notification_prefs JSONB DEFAULT '{"email":true,"push":true,"sms":false,"marketing":false}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- User Roles
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner','admin','manager','supervisor','worker','viewer')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'system',
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  read BOOLEAN NOT NULL DEFAULT false,
  project_id UUID,
  document_id UUID,
  task_id UUID,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Form Documents (legacy, kept for compatibility)
CREATE TABLE IF NOT EXISTS public.form_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  title TEXT,
  type TEXT,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);


-- =============================================
-- 2. SUBSCRIPTIONS (Stripe integration)
-- =============================================

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan TEXT DEFAULT 'free',
  status TEXT DEFAULT 'none',
  addons TEXT[] DEFAULT '{}',
  trial_ends_at TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add plan column to profiles if missing
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='plan') THEN
    ALTER TABLE public.profiles ADD COLUMN plan TEXT DEFAULT 'free';
  END IF;
END $$;


-- =============================================
-- 3. ADD MISSING COLUMNS TO EXISTING TABLES
-- =============================================

DO $$ BEGIN
  -- PROJECTS
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='address') THEN
    ALTER TABLE public.projects ADD COLUMN address TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='contract_amount') THEN
    ALTER TABLE public.projects ADD COLUMN contract_amount NUMERIC(12,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='due_date') THEN
    ALTER TABLE public.projects ADD COLUMN due_date TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='branch') THEN
    ALTER TABLE public.projects ADD COLUMN branch TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='progress') THEN
    ALTER TABLE public.projects ADD COLUMN progress INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='timeline') THEN
    ALTER TABLE public.projects ADD COLUMN timeline JSONB DEFAULT '[]'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='proposal_date') THEN
    ALTER TABLE public.projects ADD COLUMN proposal_date TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='contract_signed_date') THEN
    ALTER TABLE public.projects ADD COLUMN contract_signed_date TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='actual_start_date') THEN
    ALTER TABLE public.projects ADD COLUMN actual_start_date TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='actual_end_date') THEN
    ALTER TABLE public.projects ADD COLUMN actual_end_date TIMESTAMPTZ;
  END IF;

  -- DOCUMENTS
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documents' AND column_name='storage_path') THEN
    ALTER TABLE public.documents ADD COLUMN storage_path TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documents' AND column_name='mime_type') THEN
    ALTER TABLE public.documents ADD COLUMN mime_type TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documents' AND column_name='type') THEN
    ALTER TABLE public.documents ADD COLUMN type TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documents' AND column_name='is_project_file') THEN
    ALTER TABLE public.documents ADD COLUMN is_project_file BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documents' AND column_name='category') THEN
    ALTER TABLE public.documents ADD COLUMN category TEXT DEFAULT 'other';
  END IF;

  -- PHASES
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='phases' AND column_name='color') THEN
    ALTER TABLE public.phases ADD COLUMN color TEXT DEFAULT '#3B82F6';
  END IF;

  -- GENERATED DOCUMENTS
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='generated_documents' AND column_name='attached_pdfs') THEN
    ALTER TABLE public.generated_documents ADD COLUMN attached_pdfs JSONB DEFAULT '[]'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='generated_documents' AND column_name='cost_total') THEN
    ALTER TABLE public.generated_documents ADD COLUMN cost_total NUMERIC(12,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='generated_documents' AND column_name='profit') THEN
    ALTER TABLE public.generated_documents ADD COLUMN profit NUMERIC(12,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='generated_documents' AND column_name='margin_percent') THEN
    ALTER TABLE public.generated_documents ADD COLUMN margin_percent NUMERIC(5,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='generated_documents' AND column_name='tax_rate') THEN
    ALTER TABLE public.generated_documents ADD COLUMN tax_rate NUMERIC(5,2) DEFAULT 0;
  END IF;

  -- BRANCHES
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='branches' AND column_name='manager') THEN
    ALTER TABLE public.branches ADD COLUMN manager TEXT;
  END IF;
END $$;


-- =============================================
-- 4. INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON public.subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_profiles_plan ON public.profiles(plan);


-- =============================================
-- 5. ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- PROFILES
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- USER ROLES
DROP POLICY IF EXISTS "roles_select" ON public.user_roles;
DROP POLICY IF EXISTS "roles_insert" ON public.user_roles;
DROP POLICY IF EXISTS "roles_manage" ON public.user_roles;
CREATE POLICY "roles_select" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "roles_insert" ON public.user_roles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "roles_manage" ON public.user_roles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('owner','admin'))
);

-- NOTIFICATIONS
DROP POLICY IF EXISTS "notif_select" ON public.notifications;
DROP POLICY IF EXISTS "notif_insert" ON public.notifications;
DROP POLICY IF EXISTS "notif_update" ON public.notifications;
DROP POLICY IF EXISTS "notif_delete" ON public.notifications;
CREATE POLICY "notif_select" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notif_insert" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "notif_update" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "notif_delete" ON public.notifications FOR DELETE USING (auth.uid() = user_id);

-- FORM DOCUMENTS
DROP POLICY IF EXISTS "form_docs_all" ON public.form_documents;
CREATE POLICY "form_docs_all" ON public.form_documents FOR ALL USING (auth.uid() = user_id);

-- SUBSCRIPTIONS
DROP POLICY IF EXISTS "sub_select" ON public.subscriptions;
DROP POLICY IF EXISTS "sub_insert" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscriptions;
CREATE POLICY "sub_select" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
-- Service role writes via webhook (bypasses RLS), so no INSERT/UPDATE policy needed for users


-- =============================================
-- 6. TRIGGERS & FUNCTIONS
-- =============================================

-- Generic updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_roles_updated_at ON public.user_roles;
CREATE TRIGGER update_user_roles_updated_at BEFORE UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_form_documents_updated_at ON public.form_documents;
CREATE TRIGGER update_form_documents_updated_at BEFORE UPDATE ON public.form_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- =============================================
-- 7. SIGNUP TRIGGER
--    Creates profile + role + subscription on signup
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
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

  -- Create owner role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'owner')
  ON CONFLICT (user_id) DO NOTHING;

  -- Create free subscription record
  INSERT INTO public.subscriptions (user_id, plan, status)
  VALUES (NEW.id, 'free', 'none')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- =============================================
-- 8. BACKFILL EXISTING USERS
--    Safe: ON CONFLICT skips duplicates
-- =============================================

-- Backfill profiles
INSERT INTO public.profiles (id, email, plan)
SELECT id, email, 'free' FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- Backfill roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'owner' FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_roles)
ON CONFLICT (user_id) DO NOTHING;

-- Backfill subscriptions
INSERT INTO public.subscriptions (user_id, plan, status)
SELECT id, 'free', 'none' FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.subscriptions)
ON CONFLICT (user_id) DO NOTHING;


-- =============================================
-- 9. STORAGE BUCKET
-- =============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents', 'documents', true, 26214400,
  ARRAY['image/png','image/jpeg','image/jpg','image/webp','image/gif',
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users upload to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users read own files" ON storage.objects;
DROP POLICY IF EXISTS "Users delete own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;
DROP POLICY IF EXISTS "Public read documents" ON storage.objects;
DROP POLICY IF EXISTS "Public can read documents" ON storage.objects;

CREATE POLICY "Users upload to own folder" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documents' AND auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
CREATE POLICY "Users read own files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documents' AND auth.role() = 'authenticated'
  );
CREATE POLICY "Users delete own files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'documents' AND auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );


-- =============================================
-- 10. REALTIME PUBLICATIONS
-- =============================================

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'projects','tasks','phases','generated_documents','messages',
    'notifications','team_members','expenses','events','meetings',
    'subscriptions','profiles'
  ] LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END LOOP;
END $$;


-- =============================================
-- VERIFICATION — Run this after to confirm:
--
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema='public' ORDER BY 1;
--
-- Expected tables include:
--   branches, documents, events, expenses, 
--   form_documents, generated_documents, meetings,
--   messages, notifications, phases, profiles,
--   projects, subscriptions, tasks, team_members,
--   user_roles
-- =============================================
