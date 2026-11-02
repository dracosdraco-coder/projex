-- =============================================
-- PROJEX — API rate limit events
--
-- Used by src/lib/rate-limit.ts to cap outbound email per org.
-- Only the service role touches this table (RLS on, no policies).
-- Safe to run more than once.
-- =============================================

CREATE TABLE IF NOT EXISTS public.api_rate_events (
  id BIGSERIAL PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  bucket TEXT NOT NULL,
  cost INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_api_rate_events_lookup
  ON public.api_rate_events (org_id, bucket, created_at DESC);

ALTER TABLE public.api_rate_events ENABLE ROW LEVEL SECURITY;

-- Old rows are useless after the window passes; prune occasionally with:
-- DELETE FROM public.api_rate_events WHERE created_at < now() - interval '1 day';
