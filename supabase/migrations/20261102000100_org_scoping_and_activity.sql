-- =============================================
-- PROJEX — Org scoping & activity log (review §3)
--
-- 1. current_org_id(): default org_id for inserts that don't set one
-- 2. form_documents gets org_id (the app already writes it; inserts were failing)
-- 3. Backfill stray org_ids, then org_id NOT NULL on every org-scoped table
-- 4. updated_at triggers where the column exists but nothing maintained it
-- 5. Indexes for the common (org, project, newest-first) reads
-- 6. activity_events + triggers: one table that records every change
-- =============================================


-- =============================================
-- 1. DEFAULT ORG
-- =============================================

-- The signed-in user's active org. Used as a column DEFAULT so a client insert
-- that races the org loading (orgId still null) lands in the right org instead
-- of failing. RLS still checks the user is actually a member.
CREATE OR REPLACE FUNCTION public.current_org_id()
RETURNS uuid
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT org_id FROM public.profiles WHERE id = auth.uid()
$$;


-- =============================================
-- 2. FORM DOCUMENTS → org-scoped like everything else
-- =============================================

ALTER TABLE public.form_documents ADD COLUMN IF NOT EXISTS org_id uuid
  REFERENCES public.organizations(id) ON DELETE CASCADE;

UPDATE public.form_documents f SET org_id = p.org_id
FROM public.profiles p WHERE f.org_id IS NULL AND p.id = f.user_id;

DROP POLICY IF EXISTS "form_docs_all" ON public.form_documents;
DROP POLICY IF EXISTS "org_form_documents_select" ON public.form_documents;
DROP POLICY IF EXISTS "org_form_documents_insert" ON public.form_documents;
DROP POLICY IF EXISTS "org_form_documents_update" ON public.form_documents;
DROP POLICY IF EXISTS "org_form_documents_delete" ON public.form_documents;
CREATE POLICY "org_form_documents_select" ON public.form_documents FOR SELECT USING (org_id IN (SELECT public.user_org_ids(auth.uid())));
CREATE POLICY "org_form_documents_insert" ON public.form_documents FOR INSERT WITH CHECK (org_id IN (SELECT public.user_org_ids(auth.uid())));
CREATE POLICY "org_form_documents_update" ON public.form_documents FOR UPDATE USING (org_id IN (SELECT public.user_org_ids(auth.uid())));
CREATE POLICY "org_form_documents_delete" ON public.form_documents FOR DELETE USING (org_id IN (SELECT public.user_org_ids(auth.uid())));


-- =============================================
-- 3. org_id REQUIRED
-- =============================================

-- Calendar events created before the org model: take the project's org, else the creator's
UPDATE public.events e SET org_id = pr.org_id
FROM public.projects pr WHERE e.org_id IS NULL AND e.project_id = pr.id;
UPDATE public.events e SET org_id = p.org_id
FROM public.profiles p WHERE e.org_id IS NULL AND p.id = e.user_id;

DO $$
DECLARE
  t text;
  nulls bigint;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'branches','documents','events','expenses','form_documents','form_templates',
    'generated_documents','integrations','leads','line_item_templates','meetings',
    'messages','notifications','phases','photos','projects','tasks','team_members'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN org_id SET DEFAULT public.current_org_id()', t);

    EXECUTE format('SELECT count(*) FROM public.%I WHERE org_id IS NULL', t) INTO nulls;
    IF nulls = 0 THEN
      EXECUTE format('ALTER TABLE public.%I ALTER COLUMN org_id SET NOT NULL', t);
    ELSE
      -- Don't fail the whole migration over orphaned rows; report and leave nullable
      RAISE WARNING '% has % row(s) with no org_id — left nullable', t, nulls;
    END IF;
  END LOOP;
END $$;


-- =============================================
-- 4. updated_at MAINTENANCE
-- =============================================

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['integrations','leads','messages','phases','tasks','team_members'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS update_%1$s_updated_at ON public.%1$I', t);
    EXECUTE format('CREATE TRIGGER update_%1$s_updated_at BEFORE UPDATE ON public.%1$I
                    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()', t);
  END LOOP;
END $$;


-- =============================================
-- 5. INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_messages_org_project_created ON public.messages (org_id, project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_photos_org_project_created ON public.photos (org_id, project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_org_project_uploaded ON public.documents (org_id, project_id, uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_org_project ON public.tasks (org_id, project_id);
CREATE INDEX IF NOT EXISTS idx_events_org_start ON public.events (org_id, start_time);


-- =============================================
-- 6. ACTIVITY LOG
--
-- Filled by triggers, so it's complete no matter which screen or API made the
-- change. Feeds the dashboard activity feed now; notifications and summaries later.
-- Stores a label and the names of changed fields — not full row copies.
-- =============================================

CREATE TABLE IF NOT EXISTS public.activity_events (
  id BIGSERIAL PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id UUID,
  actor_id UUID,
  actor_name TEXT,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  verb TEXT NOT NULL CHECK (verb IN ('created', 'updated', 'deleted')),
  summary TEXT,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_org_created ON public.activity_events (org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_org_project_created ON public.activity_events (org_id, project_id, created_at DESC);

ALTER TABLE public.activity_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "activity_select" ON public.activity_events;
-- Read-only for org members; rows are only written by the trigger below
CREATE POLICY "activity_select" ON public.activity_events FOR SELECT
  USING (org_id IN (SELECT public.user_org_ids(auth.uid())));

CREATE OR REPLACE FUNCTION public.log_activity()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  rec jsonb := CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(NEW) END;
  org uuid := (rec ->> 'org_id')::uuid;
  changed text[];
  details jsonb := '{}';
  label text;
BEGIN
  -- Rows deleted by an org-level cascade: the org is already gone, nothing to log
  IF org IS NULL OR NOT EXISTS (SELECT 1 FROM public.organizations WHERE id = org) THEN
    RETURN NULL;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    SELECT array_agg(n.key ORDER BY n.key) INTO changed
    FROM jsonb_each(to_jsonb(NEW)) n
    WHERE n.key NOT IN ('updated_at')
      AND n.value IS DISTINCT FROM (to_jsonb(OLD) -> n.key);
    IF changed IS NULL THEN RETURN NULL; END IF;  -- touch-only update
    details := jsonb_build_object('changed', to_jsonb(changed));
    IF 'status' = ANY(changed) THEN
      details := details || jsonb_build_object('status', jsonb_build_object('from', to_jsonb(OLD) ->> 'status', 'to', rec ->> 'status'));
    END IF;
  END IF;

  IF rec ? 'amount' THEN details := details || jsonb_build_object('amount', rec -> 'amount'); END IF;
  IF rec ? 'type' AND TG_TABLE_NAME = 'generated_documents' THEN details := details || jsonb_build_object('doc_type', rec ->> 'type'); END IF;

  label := COALESCE(
    NULLIF(rec ->> 'name', ''),
    NULLIF(rec ->> 'title', ''),
    CASE WHEN TG_TABLE_NAME = 'generated_documents' THEN concat_ws(' ', rec ->> 'type', rec ->> 'document_number') END,
    NULLIF(rec ->> 'description', ''),
    left(NULLIF(rec ->> 'content', ''), 80),
    NULLIF(rec ->> 'email', '')
  );

  INSERT INTO public.activity_events (org_id, project_id, actor_id, actor_name, entity_type, entity_id, verb, summary, data)
  VALUES (
    org,
    CASE WHEN TG_TABLE_NAME = 'projects' THEN (rec ->> 'id')::uuid ELSE (rec ->> 'project_id')::uuid END,
    auth.uid(),
    (SELECT COALESCE(NULLIF(full_name, ''), email) FROM public.profiles WHERE id = auth.uid()),
    TG_ARGV[0],
    (rec ->> 'id')::uuid,
    CASE TG_OP WHEN 'INSERT' THEN 'created' WHEN 'UPDATE' THEN 'updated' ELSE 'deleted' END,
    label,
    details
  );
  RETURN NULL;
END;
$$;

DO $$
DECLARE
  pair text[];
BEGIN
  FOREACH pair SLICE 1 IN ARRAY ARRAY[
    ['projects','project'], ['phases','phase'], ['tasks','task'], ['expenses','expense'],
    ['generated_documents','document'], ['documents','file'], ['photos','photo'],
    ['messages','message'], ['meetings','meeting'], ['events','event'],
    ['leads','lead'], ['org_members','member']
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS log_activity ON public.%I', pair[1]);
    EXECUTE format('CREATE TRIGGER log_activity AFTER INSERT OR UPDATE OR DELETE ON public.%I
                    FOR EACH ROW EXECUTE FUNCTION public.log_activity(%L)', pair[1], pair[2]);
  END LOOP;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_events;
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL;
END $$;
