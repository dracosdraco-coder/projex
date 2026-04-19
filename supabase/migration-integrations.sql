-- =============================================
-- Migration: OAuth Integrations table
-- Stores QuickBooks & Google Calendar tokens
-- =============================================

CREATE TABLE IF NOT EXISTS public.integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('quickbooks', 'google')),
  access_token text,
  refresh_token text,
  realm_id text,         -- QuickBooks company/realm ID
  token_type text,
  expires_at timestamptz,
  scope text,
  connected_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(org_id, provider)
);

ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "integrations_org_member" ON public.integrations
  FOR ALL USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.org_id = integrations.org_id
        AND om.user_id = auth.uid()
        AND om.status = 'active'
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.org_id = integrations.org_id
        AND om.user_id = auth.uid()
        AND om.status = 'active'
    )
  );

CREATE INDEX IF NOT EXISTS idx_integrations_org ON public.integrations(org_id);
CREATE INDEX IF NOT EXISTS idx_integrations_provider ON public.integrations(provider);
