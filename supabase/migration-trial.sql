-- =============================================
-- Migration: 7-day free trial on signup
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. Update handle_new_user to auto-start a 7-day trial (Team plan, no card required)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_org_id UUID;
  invite_org_id UUID;
  invite_role TEXT;
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, email, full_name, plan)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'team'
  )
  ON CONFLICT (id) DO NOTHING;

  -- Check if this user was invited to an existing org
  SELECT om.org_id, om.role INTO invite_org_id, invite_role
  FROM public.org_members om
  WHERE om.email = NEW.email AND om.user_id IS NULL AND om.status = 'pending'
  LIMIT 1;

  IF invite_org_id IS NOT NULL THEN
    -- Activate the pending membership
    UPDATE public.org_members
    SET user_id = NEW.id, status = 'active', joined_at = now()
    WHERE org_id = invite_org_id AND email = NEW.email AND user_id IS NULL;

    -- Set profile org
    UPDATE public.profiles SET org_id = invite_org_id WHERE id = NEW.id;
  ELSE
    -- Create new org for this user
    INSERT INTO public.organizations (name, owner_id)
    VALUES (COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'My Company'), NEW.id)
    RETURNING id INTO new_org_id;

    -- Create owner membership
    INSERT INTO public.org_members (org_id, user_id, email, name, role, status, joined_at)
    VALUES (new_org_id, NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), 'owner', 'active', now());

    -- Set profile org
    UPDATE public.profiles SET org_id = new_org_id WHERE id = NEW.id;

    -- 7-day free trial — Team plan, no credit card required
    INSERT INTO public.subscriptions (user_id, org_id, plan, status, trial_ends_at)
    VALUES (NEW.id, new_org_id, 'team', 'trialing', now() + interval '7 days')
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  -- Legacy: create user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE(invite_role, 'owner'))
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =============================================
-- 2. DEMO ACCOUNT SETUP
-- Run the block below AFTER creating the demo user in Supabase Auth:
--   Dashboard → Authentication → Users → Add user
--   Email: demo@projex.live
--   Password: (set your own — add as NEXT_PUBLIC_DEMO_PASSWORD in .env.local)
--   "Auto Confirm User": YES (check this box so no email verification needed)
-- =============================================

-- After creating the auth user, find their UUID and replace <DEMO_USER_ID> below:
-- SELECT id FROM auth.users WHERE email = 'demo@projex.live';

-- Then run:
/*
DO $$
DECLARE
  demo_uid UUID := '<DEMO_USER_ID>';  -- replace with actual UUID from query above
  demo_org_id UUID;
  demo_proj_id UUID;
BEGIN
  -- Get the auto-created org
  SELECT id INTO demo_org_id FROM public.organizations WHERE owner_id = demo_uid LIMIT 1;

  -- Upgrade subscription to Business (active, no expiry)
  UPDATE public.subscriptions
  SET plan = 'business', status = 'active', trial_ends_at = NULL, current_period_end = now() + interval '10 years'
  WHERE user_id = demo_uid;

  UPDATE public.profiles SET plan = 'business' WHERE id = demo_uid;

  -- Sample project
  INSERT INTO public.projects (user_id, org_id, name, status, description, address, start_date, end_date)
  VALUES (demo_uid, demo_org_id, 'Riverside Kitchen Remodel', 'active', 'Full kitchen renovation including cabinets, countertops, and plumbing', '123 Riverside Dr, Miami, FL 33101', now() - interval '14 days', now() + interval '30 days')
  RETURNING id INTO demo_proj_id;

  -- Sample tasks
  INSERT INTO public.tasks (user_id, org_id, project_id, title, status, priority, due_date)
  VALUES
    (demo_uid, demo_org_id, demo_proj_id, 'Demo existing cabinets', 'completed', 'high', now() - interval '10 days'),
    (demo_uid, demo_org_id, demo_proj_id, 'Install new plumbing rough-in', 'completed', 'high', now() - interval '5 days'),
    (demo_uid, demo_org_id, demo_proj_id, 'Cabinet installation', 'in_progress', 'high', now() + interval '3 days'),
    (demo_uid, demo_org_id, demo_proj_id, 'Countertop template & fabrication', 'pending', 'medium', now() + interval '10 days'),
    (demo_uid, demo_org_id, demo_proj_id, 'Final inspection', 'pending', 'medium', now() + interval '25 days');

  RAISE NOTICE 'Demo account seeded successfully. Org ID: %', demo_org_id;
END;
$$;
*/
