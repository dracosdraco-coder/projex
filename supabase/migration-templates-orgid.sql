-- line_item_templates and form_templates were missed by migration-orgs.sql:
-- they have no org_id column at all, while the app queries them by org_id
-- once a user has one. Add the column, backfill it, and rewrite RLS to
-- match every other org-scoped table.

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'line_item_templates' AND column_name = 'org_id') THEN
    ALTER TABLE public.line_item_templates ADD COLUMN org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'form_templates' AND column_name = 'org_id') THEN
    ALTER TABLE public.form_templates ADD COLUMN org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;
END $$;

UPDATE public.line_item_templates t SET org_id = p.org_id
FROM public.profiles p WHERE p.id = t.user_id AND t.org_id IS NULL AND p.org_id IS NOT NULL;

UPDATE public.form_templates t SET org_id = p.org_id
FROM public.profiles p WHERE p.id = t.user_id AND t.org_id IS NULL AND p.org_id IS NOT NULL;

DROP POLICY IF EXISTS "li_templates_all" ON public.line_item_templates;
DROP POLICY IF EXISTS "org_line_item_templates_select" ON public.line_item_templates;
DROP POLICY IF EXISTS "org_line_item_templates_insert" ON public.line_item_templates;
DROP POLICY IF EXISTS "org_line_item_templates_update" ON public.line_item_templates;
DROP POLICY IF EXISTS "org_line_item_templates_delete" ON public.line_item_templates;

CREATE POLICY "org_line_item_templates_select" ON public.line_item_templates FOR SELECT USING (
  org_id IN (SELECT public.user_org_ids(auth.uid())) OR (org_id IS NULL AND user_id = auth.uid())
);
CREATE POLICY "org_line_item_templates_insert" ON public.line_item_templates FOR INSERT WITH CHECK (
  org_id IN (SELECT public.user_org_ids(auth.uid())) OR (org_id IS NULL AND user_id = auth.uid())
);
CREATE POLICY "org_line_item_templates_update" ON public.line_item_templates FOR UPDATE USING (
  org_id IN (SELECT public.user_org_ids(auth.uid())) OR (org_id IS NULL AND user_id = auth.uid())
);
CREATE POLICY "org_line_item_templates_delete" ON public.line_item_templates FOR DELETE USING (
  org_id IN (SELECT public.user_org_ids(auth.uid())) OR (org_id IS NULL AND user_id = auth.uid())
);

DROP POLICY IF EXISTS "form_templates_all" ON public.form_templates;
DROP POLICY IF EXISTS "org_form_templates_select" ON public.form_templates;
DROP POLICY IF EXISTS "org_form_templates_insert" ON public.form_templates;
DROP POLICY IF EXISTS "org_form_templates_update" ON public.form_templates;
DROP POLICY IF EXISTS "org_form_templates_delete" ON public.form_templates;

CREATE POLICY "org_form_templates_select" ON public.form_templates FOR SELECT USING (
  org_id IN (SELECT public.user_org_ids(auth.uid())) OR (org_id IS NULL AND user_id = auth.uid())
);
CREATE POLICY "org_form_templates_insert" ON public.form_templates FOR INSERT WITH CHECK (
  org_id IN (SELECT public.user_org_ids(auth.uid())) OR (org_id IS NULL AND user_id = auth.uid())
);
CREATE POLICY "org_form_templates_update" ON public.form_templates FOR UPDATE USING (
  org_id IN (SELECT public.user_org_ids(auth.uid())) OR (org_id IS NULL AND user_id = auth.uid())
);
CREATE POLICY "org_form_templates_delete" ON public.form_templates FOR DELETE USING (
  org_id IN (SELECT public.user_org_ids(auth.uid())) OR (org_id IS NULL AND user_id = auth.uid())
);
