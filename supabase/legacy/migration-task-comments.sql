-- =============================================
-- TASK_COMMENTS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.task_comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id uuid REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  commenter_name text DEFAULT '',
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON public.task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_created_at ON public.task_comments(created_at DESC);

ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "task_comments_select" ON public.task_comments;
DROP POLICY IF EXISTS "task_comments_insert" ON public.task_comments;
DROP POLICY IF EXISTS "task_comments_delete" ON public.task_comments;

CREATE POLICY "task_comments_select" ON public.task_comments FOR SELECT
  USING (
    auth.uid() = user_id
    OR task_id IN (
      SELECT id FROM public.tasks WHERE
        user_id = auth.uid()
        OR org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "task_comments_insert" ON public.task_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "task_comments_delete" ON public.task_comments FOR DELETE
  USING (auth.uid() = user_id);
