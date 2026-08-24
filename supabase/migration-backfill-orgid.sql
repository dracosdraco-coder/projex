-- Backfill org_id on rows created while the app's data hooks had a stale
-- closure over orgId (always null), so every insert since org support was
-- added went in with org_id = NULL regardless of the creator's actual org.
-- Safe to re-run: only touches rows where org_id IS NULL.

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'projects', 'tasks', 'generated_documents', 'events', 'team_members',
    'messages', 'expenses', 'phases', 'documents', 'meetings', 'branches',
    'line_item_templates', 'form_templates'
  ] LOOP
    EXECUTE format(
      'UPDATE public.%I t SET org_id = p.org_id FROM public.profiles p WHERE p.id = t.user_id AND t.org_id IS NULL AND p.org_id IS NOT NULL',
      tbl
    );
  END LOOP;
END $$;
