-- =============================================
-- PROJEX — COMPLETE DATABASE SCHEMA
-- Run this in Supabase SQL Editor
-- 
-- Safe to run on existing databases:
--   • Uses CREATE TABLE IF NOT EXISTS
--   • Uses DO $$ blocks for column additions
--   • Uses DROP POLICY IF EXISTS before CREATE
--   • Idempotent — run as many times as needed
-- =============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- 1. CORE TABLES
-- =============================================

CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL, description text,
  client_name text, client_email text, client_phone text, address text,
  status text DEFAULT 'active' CHECK (status IN ('active','completed','on-hold','cancelled')),
  contract_amount numeric(12,2) DEFAULT 0,
  start_date timestamptz, end_date timestamptz, due_date timestamptz,
  budget numeric(12,2) DEFAULT 0, actual_cost numeric(12,2) DEFAULT 0,
  progress integer DEFAULT 0, branch text,
  timeline jsonb DEFAULT '[]'::jsonb,
  proposal_date timestamptz, contract_signed_date timestamptz,
  actual_start_date timestamptz, actual_end_date timestamptz,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='address') THEN ALTER TABLE public.projects ADD COLUMN address text; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='contract_amount') THEN ALTER TABLE public.projects ADD COLUMN contract_amount numeric(12,2) DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='due_date') THEN ALTER TABLE public.projects ADD COLUMN due_date timestamptz; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='branch') THEN ALTER TABLE public.projects ADD COLUMN branch text; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='timeline') THEN ALTER TABLE public.projects ADD COLUMN timeline jsonb DEFAULT '[]'::jsonb; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='progress') THEN ALTER TABLE public.projects ADD COLUMN progress integer DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='proposal_date') THEN ALTER TABLE public.projects ADD COLUMN proposal_date timestamptz; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='contract_signed_date') THEN ALTER TABLE public.projects ADD COLUMN contract_signed_date timestamptz; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='actual_start_date') THEN ALTER TABLE public.projects ADD COLUMN actual_start_date timestamptz; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='actual_end_date') THEN ALTER TABLE public.projects ADD COLUMN actual_end_date timestamptz; END IF;
END $$;


CREATE TABLE IF NOT EXISTS public.phases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL, description text,
  start_date timestamptz, end_date timestamptz,
  status text DEFAULT 'not-started' CHECK (status IN ('not-started','in-progress','completed','blocked','pending')),
  color text DEFAULT '#3B82F6', "order" integer DEFAULT 0,
  progress integer DEFAULT 0, budget numeric(12,2) DEFAULT 0, actual_cost numeric(12,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='phases' AND column_name='user_id') THEN ALTER TABLE public.phases ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='phases' AND column_name='color') THEN ALTER TABLE public.phases ADD COLUMN color text DEFAULT '#3B82F6'; END IF;
END $$;


CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  phase_id uuid REFERENCES public.phases(id) ON DELETE SET NULL,
  title text NOT NULL, description text,
  status text DEFAULT 'todo' CHECK (status IN ('todo','in-progress','review','completed')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  assigned_to text, due_date timestamptz,
  estimated_hours numeric(6,2), actual_hours numeric(6,2),
  estimated_cost numeric(12,2), actual_cost numeric(12,2), order_index integer,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='user_id') THEN ALTER TABLE public.tasks ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE; END IF;
END $$;


CREATE TABLE IF NOT EXISTS public.task_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  commenter_name text NOT NULL, content text NOT NULL,
  created_at timestamptz DEFAULT now()
);


CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category text NOT NULL, description text NOT NULL, amount numeric(12,2) NOT NULL,
  date timestamptz DEFAULT now(), receipt_url text, vendor text, payment_method text, notes text,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);


-- =============================================
-- 2. TEAM & COMMUNICATION
-- =============================================

CREATE TABLE IF NOT EXISTS public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL, email text, phone text,
  role text DEFAULT 'worker', avatar_url text,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.project_team (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  team_member_id uuid REFERENCES public.team_members(id) ON DELETE CASCADE NOT NULL,
  role_in_project text, created_at timestamptz DEFAULT now(),
  UNIQUE(project_id, team_member_id)
);

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  branch_id uuid, sender_name text NOT NULL, content text NOT NULL,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.message_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid REFERENCES public.messages(id) ON DELETE CASCADE NOT NULL,
  file_name text NOT NULL, storage_path text NOT NULL, file_type text, file_size bigint,
  uploaded_at timestamptz DEFAULT now()
);


-- =============================================
-- 3. DOCUMENTS & FORMS
-- =============================================

CREATE TABLE IF NOT EXISTS public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL, file_url text, file_type text, file_size bigint,
  category text DEFAULT 'other', description text,
  type text, storage_path text, mime_type text, is_project_file boolean DEFAULT false,
  uploaded_at timestamptz DEFAULT now(), created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documents' AND column_name='storage_path') THEN ALTER TABLE public.documents ADD COLUMN storage_path text; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documents' AND column_name='mime_type') THEN ALTER TABLE public.documents ADD COLUMN mime_type text; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documents' AND column_name='type') THEN ALTER TABLE public.documents ADD COLUMN type text; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documents' AND column_name='is_project_file') THEN ALTER TABLE public.documents ADD COLUMN is_project_file boolean DEFAULT false; END IF;
  BEGIN ALTER TABLE public.documents ALTER COLUMN file_size TYPE bigint USING file_size::bigint; EXCEPTION WHEN others THEN NULL; END;
END $$;


CREATE TABLE IF NOT EXISTS public.generated_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  type text NOT NULL, document_number text, status text DEFAULT 'draft',
  date_issued text, date_due text, date_sent timestamptz, date_approved timestamptz, date_paid timestamptz,
  company_name text, company_logo_url text, company_address text, company_phone text, company_email text, company_website text,
  client_name text, client_email text, client_phone text, client_address text,
  line_items jsonb DEFAULT '[]'::jsonb,
  subtotal numeric(12,2) DEFAULT 0, tax_total numeric(12,2) DEFAULT 0, total numeric(12,2) DEFAULT 0,
  cost_total numeric(12,2) DEFAULT 0, profit numeric(12,2) DEFAULT 0, margin_percent numeric(5,2) DEFAULT 0, tax_rate numeric(5,2) DEFAULT 0,
  terms text, notes text, footer text,
  px_file_path text, pdf_file_path text, attached_pdfs jsonb DEFAULT '[]'::jsonb,
  parent_document_id uuid REFERENCES public.generated_documents(id) ON DELETE SET NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='generated_documents' AND column_name='attached_pdfs') THEN ALTER TABLE public.generated_documents ADD COLUMN attached_pdfs jsonb DEFAULT '[]'::jsonb; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='generated_documents' AND column_name='cost_total') THEN ALTER TABLE public.generated_documents ADD COLUMN cost_total numeric(12,2) DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='generated_documents' AND column_name='profit') THEN ALTER TABLE public.generated_documents ADD COLUMN profit numeric(12,2) DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='generated_documents' AND column_name='margin_percent') THEN ALTER TABLE public.generated_documents ADD COLUMN margin_percent numeric(5,2) DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='generated_documents' AND column_name='tax_rate') THEN ALTER TABLE public.generated_documents ADD COLUMN tax_rate numeric(5,2) DEFAULT 0; END IF;
END $$;


CREATE TABLE IF NOT EXISTS public.form_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  title text, type text, status text DEFAULT 'draft',
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.line_item_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category text, name text NOT NULL, description text, unit text DEFAULT 'ea',
  cost numeric(12,2) DEFAULT 0, price numeric(12,2) DEFAULT 0,
  tax_rate numeric(5,2) DEFAULT 0, is_taxable boolean DEFAULT true, notes text, is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.form_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text DEFAULT 'estimate', name text NOT NULL,
  company_name text, company_logo_url text, company_address text, company_phone text, company_email text, company_website text,
  show_margins boolean DEFAULT false, terms text, notes text, footer text,
  line_items jsonb DEFAULT '[]'::jsonb, is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);


-- =============================================
-- 4. CALENDAR, MEETINGS, BRANCHES
-- =============================================

CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  title text NOT NULL, description text, location text,
  start_time timestamptz NOT NULL, end_time timestamptz NOT NULL,
  all_day boolean DEFAULT false, type text DEFAULT 'event',
  attendees jsonb DEFAULT '[]'::jsonb, recurring text, reminder_minutes integer, color text,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL, description text,
  start_time timestamptz NOT NULL, end_time timestamptz NOT NULL,
  location text, meeting_type text, attendees jsonb DEFAULT '[]'::jsonb, notes text,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL, address text, city text, state text, zip_code text,
  phone text, email text, manager text, is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='branches' AND column_name='manager') THEN ALTER TABLE public.branches ADD COLUMN manager text; END IF;
END $$;


-- =============================================
-- 5. PROFILES, TEMPLATES, ROLES, NOTIFICATIONS
-- =============================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL, full_name text, company_name text, phone text,
  role text DEFAULT 'contractor', avatar_url text,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL, type text NOT NULL, content jsonb NOT NULL, is_shared boolean DEFAULT false,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'owner' CHECK (role IN ('owner','admin','manager','supervisor','worker','viewer')),
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'system', title text NOT NULL, body text NOT NULL DEFAULT '',
  read boolean NOT NULL DEFAULT false,
  project_id uuid, document_id uuid, task_id uuid, action_url text,
  created_at timestamptz DEFAULT now()
);


-- =============================================
-- 6. INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_phases_project_id ON public.phases(project_id);
CREATE INDEX IF NOT EXISTS idx_phases_user_id ON public.phases(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_phase_id ON public.tasks(phase_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON public.task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_expenses_project_id ON public.expenses(project_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON public.expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_team_project ON public.project_team(project_id);
CREATE INDEX IF NOT EXISTS idx_project_team_member ON public.project_team(team_member_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON public.messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_project_id ON public.messages(project_id);
CREATE INDEX IF NOT EXISTS idx_message_attachments_msg ON public.message_attachments(message_id);
CREATE INDEX IF NOT EXISTS idx_documents_project_id ON public.documents(project_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_docs_user ON public.generated_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_docs_project ON public.generated_documents(project_id);
CREATE INDEX IF NOT EXISTS idx_generated_docs_type ON public.generated_documents(type);
CREATE INDEX IF NOT EXISTS idx_line_item_templates_user ON public.line_item_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_form_templates_user ON public.form_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_events_user_id ON public.events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_start ON public.events(start_time);
CREATE INDEX IF NOT EXISTS idx_meetings_project_id ON public.meetings(project_id);
CREATE INDEX IF NOT EXISTS idx_meetings_user_id ON public.meetings(user_id);
CREATE INDEX IF NOT EXISTS idx_branches_user_id ON public.branches(user_id);
CREATE INDEX IF NOT EXISTS idx_templates_user_id ON public.templates(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON public.user_roles(user_id);


-- =============================================
-- 7. ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_team ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.line_item_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop all old policies first, then recreate

-- PROJECTS
DROP POLICY IF EXISTS "Users can view their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can create their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON public.projects;
CREATE POLICY "Users can view their own projects" ON public.projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own projects" ON public.projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own projects" ON public.projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own projects" ON public.projects FOR DELETE USING (auth.uid() = user_id);

-- PHASES
DROP POLICY IF EXISTS "phases_select" ON public.phases;
DROP POLICY IF EXISTS "phases_insert" ON public.phases;
DROP POLICY IF EXISTS "phases_update" ON public.phases;
DROP POLICY IF EXISTS "phases_delete" ON public.phases;
DROP POLICY IF EXISTS "Users can view phases in their projects" ON public.phases;
DROP POLICY IF EXISTS "Users can create phases in their projects" ON public.phases;
DROP POLICY IF EXISTS "Users can update phases in their projects" ON public.phases;
DROP POLICY IF EXISTS "Users can delete phases in their projects" ON public.phases;
CREATE POLICY "phases_select" ON public.phases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "phases_insert" ON public.phases FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "phases_update" ON public.phases FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "phases_delete" ON public.phases FOR DELETE USING (auth.uid() = user_id);

-- TASKS
DROP POLICY IF EXISTS "tasks_select" ON public.tasks;
DROP POLICY IF EXISTS "tasks_insert" ON public.tasks;
DROP POLICY IF EXISTS "tasks_update" ON public.tasks;
DROP POLICY IF EXISTS "tasks_delete" ON public.tasks;
DROP POLICY IF EXISTS "Users can view tasks in their projects" ON public.tasks;
DROP POLICY IF EXISTS "Users can create tasks in their projects" ON public.tasks;
DROP POLICY IF EXISTS "Users can update tasks in their projects" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete tasks in their projects" ON public.tasks;
CREATE POLICY "tasks_select" ON public.tasks FOR SELECT USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.projects WHERE projects.id = tasks.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "tasks_insert" ON public.tasks FOR INSERT WITH CHECK (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.projects WHERE projects.id = tasks.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "tasks_update" ON public.tasks FOR UPDATE USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.projects WHERE projects.id = tasks.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "tasks_delete" ON public.tasks FOR DELETE USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.projects WHERE projects.id = tasks.project_id AND projects.user_id = auth.uid()));

-- TASK COMMENTS
DROP POLICY IF EXISTS "task_comments_all" ON public.task_comments;
CREATE POLICY "task_comments_all" ON public.task_comments FOR ALL USING (EXISTS (SELECT 1 FROM public.tasks t JOIN public.projects p ON p.id = t.project_id WHERE t.id = task_comments.task_id AND p.user_id = auth.uid()));

-- EXPENSES
DROP POLICY IF EXISTS "Users can view their own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can create their own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can update their own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can delete their own expenses" ON public.expenses;
CREATE POLICY "Users can view their own expenses" ON public.expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own expenses" ON public.expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own expenses" ON public.expenses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own expenses" ON public.expenses FOR DELETE USING (auth.uid() = user_id);

-- TEAM MEMBERS
DROP POLICY IF EXISTS "team_members_all" ON public.team_members;
CREATE POLICY "team_members_all" ON public.team_members FOR ALL USING (auth.uid() = user_id);

-- PROJECT TEAM
DROP POLICY IF EXISTS "project_team_all" ON public.project_team;
CREATE POLICY "project_team_all" ON public.project_team FOR ALL USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = project_team.project_id AND projects.user_id = auth.uid()));

-- MESSAGES
DROP POLICY IF EXISTS "messages_all" ON public.messages;
CREATE POLICY "messages_all" ON public.messages FOR ALL USING (auth.uid() = user_id);

-- MESSAGE ATTACHMENTS
DROP POLICY IF EXISTS "msg_attachments_all" ON public.message_attachments;
CREATE POLICY "msg_attachments_all" ON public.message_attachments FOR ALL USING (EXISTS (SELECT 1 FROM public.messages WHERE messages.id = message_attachments.message_id AND messages.user_id = auth.uid()));

-- DOCUMENTS
DROP POLICY IF EXISTS "Users can view their own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can create their own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can delete their own documents" ON public.documents;
CREATE POLICY "Users can view their own documents" ON public.documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own documents" ON public.documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own documents" ON public.documents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own documents" ON public.documents FOR DELETE USING (auth.uid() = user_id);

-- GENERATED DOCUMENTS
DROP POLICY IF EXISTS "gen_docs_all" ON public.generated_documents;
CREATE POLICY "gen_docs_all" ON public.generated_documents FOR ALL USING (auth.uid() = user_id);

-- FORM DOCUMENTS
DROP POLICY IF EXISTS "form_docs_all" ON public.form_documents;
CREATE POLICY "form_docs_all" ON public.form_documents FOR ALL USING (auth.uid() = user_id);

-- LINE ITEM TEMPLATES
DROP POLICY IF EXISTS "li_templates_all" ON public.line_item_templates;
CREATE POLICY "li_templates_all" ON public.line_item_templates FOR ALL USING (auth.uid() = user_id);

-- FORM TEMPLATES
DROP POLICY IF EXISTS "form_templates_all" ON public.form_templates;
CREATE POLICY "form_templates_all" ON public.form_templates FOR ALL USING (auth.uid() = user_id);

-- EVENTS
DROP POLICY IF EXISTS "events_all" ON public.events;
CREATE POLICY "events_all" ON public.events FOR ALL USING (auth.uid() = user_id);

-- MEETINGS
DROP POLICY IF EXISTS "Users can view their own meetings" ON public.meetings;
DROP POLICY IF EXISTS "Users can create their own meetings" ON public.meetings;
DROP POLICY IF EXISTS "Users can update their own meetings" ON public.meetings;
DROP POLICY IF EXISTS "Users can delete their own meetings" ON public.meetings;
CREATE POLICY "Users can view their own meetings" ON public.meetings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own meetings" ON public.meetings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own meetings" ON public.meetings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own meetings" ON public.meetings FOR DELETE USING (auth.uid() = user_id);

-- BRANCHES
DROP POLICY IF EXISTS "Users can view their own branches" ON public.branches;
DROP POLICY IF EXISTS "Users can create their own branches" ON public.branches;
DROP POLICY IF EXISTS "Users can update their own branches" ON public.branches;
DROP POLICY IF EXISTS "Users can delete their own branches" ON public.branches;
CREATE POLICY "Users can view their own branches" ON public.branches FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own branches" ON public.branches FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own branches" ON public.branches FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own branches" ON public.branches FOR DELETE USING (auth.uid() = user_id);

-- PROFILES
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- TEMPLATES
DROP POLICY IF EXISTS "Users can view their own templates" ON public.templates;
DROP POLICY IF EXISTS "Users can create their own templates" ON public.templates;
DROP POLICY IF EXISTS "Users can update their own templates" ON public.templates;
DROP POLICY IF EXISTS "Users can delete their own templates" ON public.templates;
CREATE POLICY "Users can view their own templates" ON public.templates FOR SELECT USING (auth.uid() = user_id OR is_shared = true);
CREATE POLICY "Users can create their own templates" ON public.templates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own templates" ON public.templates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own templates" ON public.templates FOR DELETE USING (auth.uid() = user_id);

-- USER ROLES
DROP POLICY IF EXISTS "roles_select" ON public.user_roles;
DROP POLICY IF EXISTS "roles_insert" ON public.user_roles;
DROP POLICY IF EXISTS "roles_manage" ON public.user_roles;
DROP POLICY IF EXISTS "Users can read own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "roles_select" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "roles_insert" ON public.user_roles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "roles_manage" ON public.user_roles FOR UPDATE USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('owner','admin')));

-- NOTIFICATIONS
DROP POLICY IF EXISTS "notif_select" ON public.notifications;
DROP POLICY IF EXISTS "notif_insert" ON public.notifications;
DROP POLICY IF EXISTS "notif_update" ON public.notifications;
DROP POLICY IF EXISTS "notif_delete" ON public.notifications;
CREATE POLICY "notif_select" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notif_insert" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "notif_update" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "notif_delete" ON public.notifications FOR DELETE USING (auth.uid() = user_id);


-- =============================================
-- 8. FUNCTIONS & TRIGGERS
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'projects','phases','tasks','expenses','team_members','messages',
    'documents','generated_documents','form_documents','line_item_templates',
    'form_templates','events','meetings','branches','profiles','templates','user_roles'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS update_%s_updated_at ON public.%I', t, t);
    EXECUTE format('CREATE TRIGGER update_%s_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()', t, t);
  END LOOP;
END $$;

-- Auto-create profile + owner role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''))
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'owner')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- =============================================
-- 9. STORAGE BUCKET
-- =============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('documents','documents',true,26214400,
  ARRAY['image/png','image/jpeg','image/jpg','image/webp','image/gif','application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/msword'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users upload to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users read own files" ON storage.objects;
DROP POLICY IF EXISTS "Users delete own files" ON storage.objects;
DROP POLICY IF EXISTS "Public read documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;
DROP POLICY IF EXISTS "Public can read documents" ON storage.objects;

CREATE POLICY "Users upload to own folder" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users read own files" ON storage.objects FOR SELECT USING (bucket_id = 'documents' AND auth.role() = 'authenticated');
CREATE POLICY "Users delete own files" ON storage.objects FOR DELETE USING (bucket_id = 'documents' AND auth.role() = 'authenticated' AND (storage.foldername(name))[1] = auth.uid()::text);


-- =============================================
-- 10. REALTIME
-- =============================================

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'projects','tasks','phases','generated_documents','messages',
    'notifications','team_members','expenses','events','meetings'
  ] LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END LOOP;
END $$;

-- =============================================
-- DONE! Verify: SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY 1;
-- =============================================
