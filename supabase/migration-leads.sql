-- =============================================
-- LEADS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.leads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text DEFAULT '',
  phone text DEFAULT '',
  company text DEFAULT '',
  source text DEFAULT 'Website',
  status text DEFAULT 'new' CHECK (status IN ('new','contacted','qualified','proposal','won','lost')),
  value numeric DEFAULT 0,
  notes text DEFAULT '',
  address text DEFAULT '',
  project_type text DEFAULT '',
  last_contact_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON public.leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_org_id ON public.leads(org_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);

-- RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "leads_select" ON public.leads;
DROP POLICY IF EXISTS "leads_insert" ON public.leads;
DROP POLICY IF EXISTS "leads_update" ON public.leads;
DROP POLICY IF EXISTS "leads_delete" ON public.leads;

CREATE POLICY "leads_select" ON public.leads FOR SELECT
  USING (
    auth.uid() = user_id
    OR (org_id IS NOT NULL AND org_id IN (
      SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
    ))
  );

CREATE POLICY "leads_insert" ON public.leads FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    OR (org_id IS NOT NULL AND org_id IN (
      SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
    ))
  );

CREATE POLICY "leads_update" ON public.leads FOR UPDATE
  USING (
    auth.uid() = user_id
    OR (org_id IS NOT NULL AND org_id IN (
      SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
    ))
  );

CREATE POLICY "leads_delete" ON public.leads FOR DELETE
  USING (
    auth.uid() = user_id
    OR (org_id IS NOT NULL AND org_id IN (
      SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
    ))
  );

-- =============================================
-- PHOTOS TABLE
-- Stores metadata for uploaded project photos
-- (actual files live in Supabase Storage)
-- =============================================

CREATE TABLE IF NOT EXISTS public.photos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  public_url text NOT NULL,
  name text DEFAULT '',
  caption text DEFAULT '',
  category text DEFAULT 'General',
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_photos_project_id ON public.photos(project_id);
CREATE INDEX IF NOT EXISTS idx_photos_user_id ON public.photos(user_id);
CREATE INDEX IF NOT EXISTS idx_photos_org_id ON public.photos(org_id);

-- RLS
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "photos_select" ON public.photos;
DROP POLICY IF EXISTS "photos_insert" ON public.photos;
DROP POLICY IF EXISTS "photos_delete" ON public.photos;

CREATE POLICY "photos_select" ON public.photos FOR SELECT
  USING (
    auth.uid() = user_id
    OR (org_id IS NOT NULL AND org_id IN (
      SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
    ))
  );

CREATE POLICY "photos_insert" ON public.photos FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    OR (org_id IS NOT NULL AND org_id IN (
      SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
    ))
  );

CREATE POLICY "photos_delete" ON public.photos FOR DELETE
  USING (
    auth.uid() = user_id
    OR (org_id IS NOT NULL AND org_id IN (
      SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
    ))
  );

-- =============================================
-- COMMS_LOGS TABLE
-- Persists SMS and call history from CommsHub
-- =============================================

CREATE TABLE IF NOT EXISTS public.comms_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('sms_sent','sms_received','call_outgoing','call_incoming')),
  contact_name text DEFAULT '',
  contact_phone text DEFAULT '',
  body text DEFAULT '',
  duration_seconds integer DEFAULT 0,
  twilio_sid text DEFAULT '',
  status text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_comms_logs_user_id ON public.comms_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_comms_logs_org_id ON public.comms_logs(org_id);
CREATE INDEX IF NOT EXISTS idx_comms_logs_created_at ON public.comms_logs(created_at DESC);

-- RLS
ALTER TABLE public.comms_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "comms_logs_all" ON public.comms_logs;

CREATE POLICY "comms_logs_all" ON public.comms_logs FOR ALL
  USING (
    auth.uid() = user_id
    OR (org_id IS NOT NULL AND org_id IN (
      SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
    ))
  )
  WITH CHECK (
    auth.uid() = user_id
    OR (org_id IS NOT NULL AND org_id IN (
      SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
    ))
  );
