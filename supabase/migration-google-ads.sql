-- =============================================
-- PROJEX — Google Ads Lead Tracking Fields
-- Adds campaign attribution to leads table
-- Run in Supabase SQL Editor
-- =============================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leads' AND column_name='campaign_name') THEN
    ALTER TABLE public.leads ADD COLUMN campaign_name TEXT DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leads' AND column_name='campaign_id') THEN
    ALTER TABLE public.leads ADD COLUMN campaign_id TEXT DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leads' AND column_name='google_click_id') THEN
    ALTER TABLE public.leads ADD COLUMN google_click_id TEXT DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leads' AND column_name='ad_group_name') THEN
    ALTER TABLE public.leads ADD COLUMN ad_group_name TEXT DEFAULT '';
  END IF;
END $$;
