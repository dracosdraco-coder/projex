-- Project Team Assignments table
CREATE TABLE IF NOT EXISTS public.project_team (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  team_member_id UUID NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
  role_in_project TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, team_member_id)
);

CREATE INDEX IF NOT EXISTS idx_project_team_project ON public.project_team(project_id);
CREATE INDEX IF NOT EXISTS idx_project_team_member ON public.project_team(team_member_id);

ALTER TABLE public.project_team ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users in the org to manage assignments
DROP POLICY IF EXISTS "org_project_team_select" ON public.project_team;
DROP POLICY IF EXISTS "org_project_team_insert" ON public.project_team;
DROP POLICY IF EXISTS "org_project_team_update" ON public.project_team;
DROP POLICY IF EXISTS "org_project_team_delete" ON public.project_team;

CREATE POLICY "org_project_team_select" ON public.project_team FOR SELECT USING (
  project_id IN (SELECT id FROM public.projects WHERE org_id IN (SELECT public.user_org_ids(auth.uid())))
);
CREATE POLICY "org_project_team_insert" ON public.project_team FOR INSERT WITH CHECK (
  project_id IN (SELECT id FROM public.projects WHERE org_id IN (SELECT public.user_org_ids(auth.uid())))
);
CREATE POLICY "org_project_team_update" ON public.project_team FOR UPDATE USING (
  project_id IN (SELECT id FROM public.projects WHERE org_id IN (SELECT public.user_org_ids(auth.uid())))
);
CREATE POLICY "org_project_team_delete" ON public.project_team FOR DELETE USING (
  project_id IN (SELECT id FROM public.projects WHERE org_id IN (SELECT public.user_org_ids(auth.uid())))
);

-- Backfill org_id on subscriptions (in case previous migration didn't run this)
UPDATE public.subscriptions s
SET org_id = p.org_id
FROM public.profiles p
WHERE p.id = s.user_id AND s.org_id IS NULL AND p.org_id IS NOT NULL;
