-- One-off repair for team members who were invited but got siloed into
-- their own auto-created org before the onboarding fix (commit dab27c3).
--
-- Fill in the two emails below and run this as ONE transaction per affected
-- person. It is safe to run for someone who's already correctly joined —
-- the WHERE clauses become no-ops in that case.

BEGIN;

-- 1. Fill these in:
--    owner_email    = the account whose org the invited person should belong to
--    invited_email  = the invited person's login email
DO $$
DECLARE
  owner_email    TEXT := 'OWNER_EMAIL_HERE';
  invited_email  TEXT := 'INVITED_EMAIL_HERE';

  correct_org_id UUID;
  invited_user_id UUID;
  orphan_org_id  UUID;
BEGIN
  -- Resolve the correct org from the owner's profile
  SELECT org_id INTO correct_org_id
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE lower(u.email) = lower(owner_email);

  IF correct_org_id IS NULL THEN
    RAISE EXCEPTION 'Could not find org for owner_email %', owner_email;
  END IF;

  -- Resolve the invited user's id and their current (possibly wrong) org
  SELECT p.id, p.org_id INTO invited_user_id, orphan_org_id
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE lower(u.email) = lower(invited_email);

  IF invited_user_id IS NULL THEN
    RAISE EXCEPTION 'Could not find profile for invited_email %', invited_email;
  END IF;

  RAISE NOTICE 'invited_user_id=%, orphan_org_id=%, correct_org_id=%', invited_user_id, orphan_org_id, correct_org_id;

  -- Move any data the invited user created while stuck in the orphan org
  -- into the correct org (only rows they own, so nothing else in the
  -- orphan org — if it somehow has other members' data — gets touched).
  IF orphan_org_id IS NOT NULL AND orphan_org_id <> correct_org_id THEN
    UPDATE public.projects            SET org_id = correct_org_id WHERE org_id = orphan_org_id AND user_id = invited_user_id;
    UPDATE public.tasks               SET org_id = correct_org_id WHERE org_id = orphan_org_id AND user_id = invited_user_id;
    UPDATE public.events              SET org_id = correct_org_id WHERE org_id = orphan_org_id AND user_id = invited_user_id;
    UPDATE public.team_members        SET org_id = correct_org_id WHERE org_id = orphan_org_id AND user_id = invited_user_id;
    UPDATE public.messages            SET org_id = correct_org_id WHERE org_id = orphan_org_id AND user_id = invited_user_id;
    UPDATE public.expenses            SET org_id = correct_org_id WHERE org_id = orphan_org_id AND user_id = invited_user_id;
    UPDATE public.phases              SET org_id = correct_org_id WHERE org_id = orphan_org_id AND user_id = invited_user_id;
    UPDATE public.documents           SET org_id = correct_org_id WHERE org_id = orphan_org_id AND user_id = invited_user_id;
    UPDATE public.meetings            SET org_id = correct_org_id WHERE org_id = orphan_org_id AND user_id = invited_user_id;
    UPDATE public.branches            SET org_id = correct_org_id WHERE org_id = orphan_org_id AND user_id = invited_user_id;
    UPDATE public.generated_documents SET org_id = correct_org_id WHERE org_id = orphan_org_id AND user_id = invited_user_id;
  END IF;

  -- Point their profile at the correct org
  UPDATE public.profiles SET org_id = correct_org_id WHERE id = invited_user_id;

  -- Activate (or create) their membership in the correct org
  INSERT INTO public.org_members (org_id, user_id, email, name, role, status, joined_at)
  SELECT correct_org_id, invited_user_id, invited_email,
         COALESCE((SELECT full_name FROM public.profiles WHERE id = invited_user_id), invited_email),
         'worker', 'active', now()
  ON CONFLICT (org_id, email) DO UPDATE
    SET user_id = EXCLUDED.user_id, status = 'active', joined_at = now();

  -- Remove any stray pending/active membership row for them in the orphan org
  IF orphan_org_id IS NOT NULL AND orphan_org_id <> correct_org_id THEN
    DELETE FROM public.org_members WHERE org_id = orphan_org_id AND lower(email) = lower(invited_email);
  END IF;

  RAISE NOTICE 'Done. Review the orphan org (id=%) manually before deleting it — it may be empty now.', orphan_org_id;
END $$;

COMMIT;

-- After running, optionally check whether the orphan org is now empty and
-- safe to delete:
--   SELECT * FROM public.projects WHERE org_id = 'ORPHAN_ORG_ID_HERE';
--   SELECT * FROM public.org_members WHERE org_id = 'ORPHAN_ORG_ID_HERE';
-- If both are empty:
--   DELETE FROM public.organizations WHERE id = 'ORPHAN_ORG_ID_HERE';
