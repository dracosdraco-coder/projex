-- =============================================
-- PROJEX — Baseline schema (production, 2026-11-02)
--
-- Part 1 is a schema-only pg_dump of the live `public` schema, taken with
-- `supabase db dump --linked --schema public` after the §1/§2 security and
-- invite migrations were applied. It is the source of truth that replaces
-- the loose files now in supabase/legacy/.
--
-- Part 2 adds the pieces pg_dump leaves out because they live outside
-- `public` (signup trigger on auth.users, storage bucket + policies, realtime).
-- Those were taken from the migrations that were run in production
-- (legacy/migration-trial.sql, legacy/migration-security-storage-rls.sql).
--
-- Production already has all of this: it is marked as applied with
--   supabase migration repair --status applied 20261102000000
-- and only runs on fresh databases (staging branches, local dev).
-- =============================================

-- ---------------------------------------------
-- Part 1 — public schema (pg_dump)
-- ---------------------------------------------




SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';


SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."org_invites" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "name" "text",
    "role" "text" DEFAULT 'worker'::"text" NOT NULL,
    "token" "text" DEFAULT "encode"("extensions"."gen_random_bytes"(24), 'hex'::"text") NOT NULL,
    "invited_by" "uuid",
    "expires_at" timestamp with time zone DEFAULT ("now"() + '7 days'::interval) NOT NULL,
    "accepted_at" timestamp with time zone,
    "accepted_by" "uuid",
    "revoked_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "org_invites_email_check" CHECK (("email" = "lower"("email"))),
    CONSTRAINT "org_invites_role_check" CHECK (("role" = ANY (ARRAY['admin'::"text", 'manager'::"text", 'supervisor'::"text", 'worker'::"text", 'viewer'::"text"])))
);


ALTER TABLE "public"."org_invites" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."_apply_invite"("inv" "public"."org_invites", "uid" "uuid", "uid_email" "text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  member_id uuid;
  display_name text;
BEGIN
  SELECT COALESCE(NULLIF(full_name, ''), inv.name, split_part(uid_email, '@', 1))
  INTO display_name FROM public.profiles WHERE id = uid;

  -- Existing membership (any email) for this user in this org?
  SELECT id INTO member_id FROM public.org_members WHERE org_id = inv.org_id AND user_id = uid;

  IF member_id IS NULL THEN
    INSERT INTO public.org_members (org_id, user_id, email, name, role, status, invited_by, joined_at)
    VALUES (inv.org_id, uid, lower(uid_email), display_name, inv.role, 'active', inv.invited_by, now())
    ON CONFLICT (org_id, email) DO UPDATE
      SET user_id = EXCLUDED.user_id, status = 'active', joined_at = now(),
          role = CASE WHEN org_members.role = 'owner' THEN 'owner' ELSE EXCLUDED.role END
    RETURNING id INTO member_id;
  ELSE
    UPDATE public.org_members
    SET status = 'active', joined_at = COALESCE(joined_at, now()),
        role = CASE WHEN role = 'owner' THEN 'owner' ELSE inv.role END
    WHERE id = member_id;
  END IF;

  UPDATE public.org_invites SET accepted_at = now(), accepted_by = uid WHERE id = inv.id;

  -- Link (or create) the contact-list entry
  UPDATE public.team_members SET org_member_id = member_id
  WHERE org_id = inv.org_id AND (invite_id = inv.id OR lower(email) IN (inv.email, lower(uid_email)));
  IF NOT FOUND THEN
    INSERT INTO public.team_members (user_id, org_id, name, email, role, invite_id, org_member_id)
    VALUES (COALESCE(inv.invited_by, uid), inv.org_id, display_name, lower(uid_email), inv.role, inv.id, member_id);
  END IF;

  UPDATE public.profiles SET org_id = inv.org_id WHERE id = uid;
  RETURN inv.org_id;
END;
$$;


ALTER FUNCTION "public"."_apply_invite"("inv" "public"."org_invites", "uid" "uuid", "uid_email" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."accept_org_invite"("invite_token" "text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  inv public.org_invites;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  SELECT * INTO inv FROM public.org_invites WHERE token = invite_token FOR UPDATE;
  IF inv.id IS NULL THEN RAISE EXCEPTION 'invite_not_found'; END IF;
  IF inv.revoked_at IS NOT NULL THEN RAISE EXCEPTION 'invite_revoked'; END IF;
  IF inv.accepted_at IS NOT NULL THEN
    IF inv.accepted_by = auth.uid() THEN RETURN inv.org_id; END IF;
    RAISE EXCEPTION 'invite_used';
  END IF;
  IF inv.expires_at < now() THEN RAISE EXCEPTION 'invite_expired'; END IF;

  RETURN public._apply_invite(inv, auth.uid(), auth.jwt() ->> 'email');
END;
$$;


ALTER FUNCTION "public"."accept_org_invite"("invite_token" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."accept_pending_invites"("display_name" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  my_email text := lower(auth.jwt() ->> 'email');
  inv public.org_invites;
  joined uuid;
BEGIN
  IF auth.uid() IS NULL OR my_email IS NULL THEN RETURN NULL; END IF;

  IF NULLIF(display_name, '') IS NOT NULL THEN
    UPDATE public.profiles SET full_name = display_name WHERE id = auth.uid() AND COALESCE(full_name, '') = '';
  END IF;

  FOR inv IN
    SELECT * FROM public.org_invites
    WHERE email = my_email AND accepted_at IS NULL AND revoked_at IS NULL AND expires_at > now()
    ORDER BY created_at
  LOOP
    joined := public._apply_invite(inv, auth.uid(), my_email);
  END LOOP;

  RETURN joined;
END;
$$;


ALTER FUNCTION "public"."accept_pending_invites"("display_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_line_item_total"("p_quantity" numeric, "p_price" numeric, "p_tax_rate" numeric DEFAULT 0, "p_is_taxable" boolean DEFAULT true) RETURNS "jsonb"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
DECLARE
  v_subtotal DECIMAL;
  v_tax DECIMAL;
  v_total DECIMAL;
BEGIN
  v_subtotal := p_quantity * p_price;
  
  IF p_is_taxable THEN
    v_tax := v_subtotal * (p_tax_rate / 100);
  ELSE
    v_tax := 0;
  END IF;
  
  v_total := v_subtotal + v_tax;
  
  RETURN jsonb_build_object(
    'subtotal', v_subtotal,
    'tax', v_tax,
    'total', v_total
  );
END;
$$;


ALTER FUNCTION "public"."calculate_line_item_total"("p_quantity" numeric, "p_price" numeric, "p_tax_rate" numeric, "p_is_taxable" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_next_document_number"("p_user_id" "uuid", "p_document_type" "text", "p_prefix" "text" DEFAULT ''::"text") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_next_number INTEGER;
  v_document_number TEXT;
BEGIN
  -- Insert or update sequence
  INSERT INTO document_sequences (user_id, document_type, prefix, current_number)
  VALUES (p_user_id, p_document_type, p_prefix, 1)
  ON CONFLICT (user_id, document_type)
  DO UPDATE SET current_number = document_sequences.current_number + 1
  RETURNING current_number INTO v_next_number;
  
  -- Format document number: PREFIX-YYYY-0001
  v_document_number := p_prefix || '-' || 
                       TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || 
                       LPAD(v_next_number::TEXT, 4, '0');
  
  RETURN v_document_number;
END;
$$;


ALTER FUNCTION "public"."get_next_document_number"("p_user_id" "uuid", "p_document_type" "text", "p_prefix" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  new_org_id UUID;
  has_invite BOOLEAN;
BEGIN
  INSERT INTO public.profiles (id, email, full_name, plan)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), 'team')
  ON CONFLICT (id) DO NOTHING;

  SELECT EXISTS (
    SELECT 1 FROM public.org_invites
    WHERE accepted_at IS NULL AND revoked_at IS NULL AND expires_at > now()
      AND (email = lower(NEW.email) OR token = NEW.raw_user_meta_data->>'invite_token')
  ) INTO has_invite;

  IF NOT has_invite THEN
    INSERT INTO public.organizations (name, owner_id)
    VALUES (COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), NEW.email, 'My Company'), NEW.id)
    RETURNING id INTO new_org_id;

    INSERT INTO public.org_members (org_id, user_id, email, name, role, status, joined_at)
    VALUES (new_org_id, NEW.id, lower(NEW.email), COALESCE(NEW.raw_user_meta_data->>'full_name', ''), 'owner', 'active', now());

    UPDATE public.profiles SET org_id = new_org_id WHERE id = NEW.id;

    INSERT INTO public.subscriptions (user_id, org_id, plan, status, trial_ends_at)
    VALUES (NEW.id, new_org_id, 'team', 'trialing', now() + interval '7 days')
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  -- Legacy table still read by older code paths
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, CASE WHEN has_invite THEN 'worker' ELSE 'owner' END)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."shares_org_with"("other_user" "text") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.org_members a
    JOIN public.org_members b ON a.org_id = b.org_id
    WHERE a.user_id = auth.uid() AND a.status = 'active'
      AND b.user_id::text = other_user AND b.status = 'active'
  )
$$;


ALTER FUNCTION "public"."shares_org_with"("other_user" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_events_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_events_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_admin_org_ids"("uid" "uuid") RETURNS SETOF "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT org_id FROM public.org_members
  WHERE user_id = uid AND status = 'active' AND role IN ('owner', 'admin')
$$;


ALTER FUNCTION "public"."user_admin_org_ids"("uid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_org_folder_ok"("object_name" "text") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT (storage.foldername(object_name))[1] IN (
    SELECT org_id::text FROM public.org_members WHERE user_id = auth.uid() AND status = 'active'
  )
$$;


ALTER FUNCTION "public"."user_org_folder_ok"("object_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_org_ids"("uid" "uuid") RETURNS SETOF "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT org_id FROM public.org_members WHERE user_id = uid AND status = 'active'
$$;


ALTER FUNCTION "public"."user_org_ids"("uid" "uuid") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."api_rate_events" (
    "id" bigint NOT NULL,
    "org_id" "uuid" NOT NULL,
    "bucket" "text" NOT NULL,
    "cost" integer DEFAULT 1 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."api_rate_events" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."api_rate_events_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."api_rate_events_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."api_rate_events_id_seq" OWNED BY "public"."api_rate_events"."id";



CREATE TABLE IF NOT EXISTS "public"."branches" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "address" "text",
    "city" "text",
    "state" "text",
    "zip_code" "text",
    "phone" "text",
    "email" "text",
    "is_primary" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "manager" "text",
    "org_id" "uuid"
);


ALTER TABLE "public"."branches" OWNER TO "postgres";


COMMENT ON TABLE "public"."branches" IS 'Business branch/location management';



CREATE TABLE IF NOT EXISTS "public"."document_sequences" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "document_type" "text" NOT NULL,
    "prefix" "text" DEFAULT ''::"text" NOT NULL,
    "current_number" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."document_sequences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."documents" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "project_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "type" "text" NOT NULL,
    "storage_path" "text" NOT NULL,
    "file_size" integer NOT NULL,
    "mime_type" "text" NOT NULL,
    "uploaded_at" timestamp with time zone DEFAULT "now"(),
    "is_project_file" boolean DEFAULT false,
    "category" "text" DEFAULT 'other'::"text",
    "org_id" "uuid",
    CONSTRAINT "documents_type_check" CHECK (("type" = ANY (ARRAY['contract'::"text", 'permit'::"text", 'photo'::"text", 'invoice'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."events" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "project_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "location" "text",
    "start_time" timestamp with time zone NOT NULL,
    "end_time" timestamp with time zone NOT NULL,
    "all_day" boolean DEFAULT false,
    "type" "text" DEFAULT 'meeting'::"text" NOT NULL,
    "attendees" "jsonb" DEFAULT '[]'::"jsonb",
    "recurring" boolean DEFAULT false,
    "recurrence_rule" "text",
    "recurrence_end" "date",
    "color" "text",
    "reminder_minutes" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "org_id" "uuid",
    CONSTRAINT "events_type_check" CHECK (("type" = ANY (ARRAY['meeting'::"text", 'deadline'::"text", 'milestone'::"text", 'appointment'::"text", 'reminder'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."expenses" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "category" "text" NOT NULL,
    "description" "text" NOT NULL,
    "amount" numeric(12,2) NOT NULL,
    "date" timestamp with time zone DEFAULT "now"(),
    "receipt_url" "text",
    "vendor" "text",
    "payment_method" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "org_id" "uuid"
);


ALTER TABLE "public"."expenses" OWNER TO "postgres";


COMMENT ON TABLE "public"."expenses" IS 'Expense tracking for projects';



CREATE TABLE IF NOT EXISTS "public"."form_documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "project_id" "uuid",
    "title" "text",
    "type" "text",
    "status" "text" DEFAULT 'draft'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."form_documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."form_templates" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "name" "text" NOT NULL,
    "company_name" "text",
    "company_logo_url" "text",
    "company_address" "text",
    "company_phone" "text",
    "company_email" "text",
    "company_website" "text",
    "show_margins" boolean DEFAULT false,
    "terms" "text",
    "notes" "text",
    "footer" "text",
    "line_items" "jsonb" DEFAULT '[]'::"jsonb",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "org_id" "uuid",
    CONSTRAINT "form_templates_type_check" CHECK (("type" = ANY (ARRAY['estimate'::"text", 'invoice'::"text", 'work_order'::"text", 'change_order'::"text", 'purchase_order'::"text"])))
);


ALTER TABLE "public"."form_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."generated_documents" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "project_id" "uuid",
    "type" "text" NOT NULL,
    "document_number" "text" NOT NULL,
    "status" "text" DEFAULT 'draft'::"text",
    "date_issued" "date" DEFAULT CURRENT_DATE NOT NULL,
    "date_due" "date",
    "date_sent" timestamp with time zone,
    "date_approved" timestamp with time zone,
    "date_paid" timestamp with time zone,
    "company_name" "text",
    "company_logo_url" "text",
    "company_address" "text",
    "company_phone" "text",
    "company_email" "text",
    "company_website" "text",
    "client_name" "text",
    "client_email" "text",
    "client_phone" "text",
    "client_address" "text",
    "line_items" "jsonb" DEFAULT '[]'::"jsonb",
    "subtotal" numeric(10,2) DEFAULT 0 NOT NULL,
    "tax_total" numeric(10,2) DEFAULT 0,
    "total" numeric(10,2) DEFAULT 0 NOT NULL,
    "cost_total" numeric(10,2) DEFAULT 0 NOT NULL,
    "profit" numeric(10,2) GENERATED ALWAYS AS (("subtotal" - "cost_total")) STORED,
    "margin_percent" numeric(5,2) GENERATED ALWAYS AS (
CASE
    WHEN ("cost_total" > (0)::numeric) THEN ((("subtotal" - "cost_total") / "cost_total") * (100)::numeric)
    ELSE (0)::numeric
END) STORED,
    "terms" "text",
    "notes" "text",
    "footer" "text",
    "px_file_path" "text",
    "pdf_file_path" "text",
    "attached_pdfs" "jsonb" DEFAULT '[]'::"jsonb",
    "parent_document_id" "uuid",
    "payment_method" "text",
    "payment_reference" "text",
    "amount_paid" numeric(10,2) DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "tax_rate" numeric(5,2) DEFAULT 0,
    "org_id" "uuid",
    CONSTRAINT "generated_documents_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'sent'::"text", 'viewed'::"text", 'approved'::"text", 'rejected'::"text", 'paid'::"text", 'void'::"text"]))),
    CONSTRAINT "generated_documents_type_check" CHECK (("type" = ANY (ARRAY['estimate'::"text", 'invoice'::"text", 'work_order'::"text", 'change_order'::"text", 'purchase_order'::"text", 'proposal'::"text", 'contract'::"text"])))
);


ALTER TABLE "public"."generated_documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."integrations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "org_id" "uuid",
    "provider" "text" NOT NULL,
    "access_token" "text",
    "refresh_token" "text",
    "realm_id" "text",
    "token_type" "text",
    "expires_at" timestamp with time zone,
    "scope" "text",
    "connected_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "integrations_provider_check" CHECK (("provider" = ANY (ARRAY['quickbooks'::"text", 'google'::"text"])))
);


ALTER TABLE "public"."integrations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."leads" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "org_id" "uuid",
    "name" "text" NOT NULL,
    "email" "text" DEFAULT ''::"text",
    "phone" "text" DEFAULT ''::"text",
    "company" "text" DEFAULT ''::"text",
    "source" "text" DEFAULT 'Website'::"text",
    "status" "text" DEFAULT 'new'::"text",
    "value" numeric DEFAULT 0,
    "notes" "text" DEFAULT ''::"text",
    "address" "text" DEFAULT ''::"text",
    "project_type" "text" DEFAULT ''::"text",
    "last_contact_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "leads_status_check" CHECK (("status" = ANY (ARRAY['new'::"text", 'contacted'::"text", 'qualified'::"text", 'proposal'::"text", 'won'::"text", 'lost'::"text"])))
);


ALTER TABLE "public"."leads" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."line_item_templates" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "category" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "unit" "text" NOT NULL,
    "cost" numeric(10,2) DEFAULT 0 NOT NULL,
    "price" numeric(10,2) DEFAULT 0 NOT NULL,
    "margin_percent" numeric(5,2) GENERATED ALWAYS AS (
CASE
    WHEN ("cost" > (0)::numeric) THEN ((("price" - "cost") / "cost") * (100)::numeric)
    ELSE (0)::numeric
END) STORED,
    "tax_rate" numeric(5,2) DEFAULT 0,
    "is_taxable" boolean DEFAULT true,
    "notes" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "org_id" "uuid",
    CONSTRAINT "line_item_templates_category_check" CHECK (("category" = ANY (ARRAY['labor'::"text", 'materials'::"text", 'equipment'::"text", 'subcontractor'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."line_item_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."meetings" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "project_id" "uuid",
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "start_time" timestamp with time zone NOT NULL,
    "end_time" timestamp with time zone NOT NULL,
    "location" "text",
    "meeting_type" "text",
    "attendees" "jsonb" DEFAULT '[]'::"jsonb",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "org_id" "uuid",
    CONSTRAINT "meetings_meeting_type_check" CHECK (("meeting_type" = ANY (ARRAY['in-person'::"text", 'virtual'::"text", 'phone'::"text"])))
);


ALTER TABLE "public"."meetings" OWNER TO "postgres";


COMMENT ON TABLE "public"."meetings" IS 'Schedule and track meetings';



CREATE TABLE IF NOT EXISTS "public"."message_attachments" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "message_id" "uuid" NOT NULL,
    "file_name" "text" NOT NULL,
    "storage_path" "text" NOT NULL,
    "file_type" "text" NOT NULL,
    "file_size" bigint,
    "uploaded_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."message_attachments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."messages" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "project_id" "uuid",
    "branch_id" "uuid",
    "sender_name" "text" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "org_id" "uuid"
);


ALTER TABLE "public"."messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "text" DEFAULT 'system'::"text" NOT NULL,
    "title" "text" NOT NULL,
    "body" "text" DEFAULT ''::"text" NOT NULL,
    "read" boolean DEFAULT false NOT NULL,
    "project_id" "uuid",
    "document_id" "uuid",
    "task_id" "uuid",
    "action_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "org_id" "uuid"
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."org_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "email" "text" NOT NULL,
    "name" "text",
    "role" "text" DEFAULT 'worker'::"text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "invited_by" "uuid",
    "joined_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "org_members_role_check" CHECK (("role" = ANY (ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text", 'supervisor'::"text", 'worker'::"text", 'viewer'::"text"]))),
    CONSTRAINT "org_members_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'pending'::"text", 'deactivated'::"text"])))
);


ALTER TABLE "public"."org_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."organizations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" DEFAULT 'My Company'::"text" NOT NULL,
    "slug" "text",
    "owner_id" "uuid" NOT NULL,
    "logo_url" "text",
    "address" "text",
    "phone" "text",
    "email" "text",
    "website" "text",
    "default_terms" "text",
    "settings" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."organizations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."phases" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "project_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "status" "text" DEFAULT 'not-started'::"text",
    "color" "text" DEFAULT '#3B82F6'::"text",
    "order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "org_id" "uuid",
    CONSTRAINT "phases_status_check" CHECK (("status" = ANY (ARRAY['not-started'::"text", 'in-progress'::"text", 'completed'::"text"])))
);


ALTER TABLE "public"."phases" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."photos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "org_id" "uuid",
    "project_id" "uuid",
    "storage_path" "text" NOT NULL,
    "public_url" "text",
    "name" "text" DEFAULT ''::"text",
    "caption" "text" DEFAULT ''::"text",
    "category" "text" DEFAULT 'General'::"text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."photos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "full_name" "text",
    "company_name" "text",
    "phone" "text",
    "role" "text" DEFAULT 'contractor'::"text",
    "avatar_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "plan" "text" DEFAULT 'free'::"text",
    "org_id" "uuid"
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON TABLE "public"."profiles" IS 'User profiles with extended information';



CREATE TABLE IF NOT EXISTS "public"."project_phases" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "order_index" integer NOT NULL,
    "start_date" timestamp with time zone,
    "end_date" timestamp with time zone,
    "status" "text" DEFAULT 'pending'::"text",
    "budget" numeric(12,2) DEFAULT 0,
    "actual_cost" numeric(12,2) DEFAULT 0,
    "progress" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "project_phases_progress_check" CHECK ((("progress" >= 0) AND ("progress" <= 100))),
    CONSTRAINT "project_phases_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'in-progress'::"text", 'completed'::"text", 'blocked'::"text"])))
);


ALTER TABLE "public"."project_phases" OWNER TO "postgres";


COMMENT ON TABLE "public"."project_phases" IS 'Project phases for breaking down work into stages';



CREATE TABLE IF NOT EXISTS "public"."project_team" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "team_member_id" "uuid" NOT NULL,
    "role_in_project" "text",
    "added_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."project_team" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."projects" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "client_name" "text",
    "client_email" "text",
    "client_phone" "text",
    "status" "text" DEFAULT 'active'::"text",
    "start_date" timestamp with time zone,
    "end_date" timestamp with time zone,
    "budget" numeric(12,2) DEFAULT 0,
    "actual_cost" numeric(12,2) DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "address" "text",
    "progress" integer DEFAULT 0,
    "branch_id" "uuid",
    "branch" "text",
    "contract_amount" numeric(12,2) DEFAULT 0,
    "due_date" timestamp with time zone,
    "timeline" "jsonb" DEFAULT '[]'::"jsonb",
    "proposal_date" timestamp with time zone,
    "contract_signed_date" timestamp with time zone,
    "actual_start_date" timestamp with time zone,
    "actual_end_date" timestamp with time zone,
    "org_id" "uuid",
    "portal_token" "text" DEFAULT "encode"("extensions"."gen_random_bytes"(24), 'hex'::"text"),
    CONSTRAINT "projects_progress_check" CHECK ((("progress" >= 0) AND ("progress" <= 100))),
    CONSTRAINT "projects_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'completed'::"text", 'on-hold'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."projects" OWNER TO "postgres";


COMMENT ON TABLE "public"."projects" IS 'Main projects table for tracking contractor projects';



CREATE TABLE IF NOT EXISTS "public"."referrals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "referrer_id" "uuid" NOT NULL,
    "referred_email" "text" NOT NULL,
    "referred_user_id" "uuid",
    "status" "text" DEFAULT 'sent'::"text" NOT NULL,
    "reward_applied" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "converted_at" timestamp with time zone,
    CONSTRAINT "referrals_status_check" CHECK (("status" = ANY (ARRAY['sent'::"text", 'joined'::"text", 'converted'::"text"])))
);


ALTER TABLE "public"."referrals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "stripe_customer_id" "text",
    "stripe_subscription_id" "text",
    "plan" "text" DEFAULT 'free'::"text",
    "status" "text" DEFAULT 'none'::"text",
    "addons" "text"[] DEFAULT '{}'::"text"[],
    "trial_ends_at" timestamp with time zone,
    "current_period_end" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "org_id" "uuid"
);


ALTER TABLE "public"."subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."task_comments" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "task_id" "uuid" NOT NULL,
    "commenter_name" "text" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."task_comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tasks" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "project_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "status" "text" DEFAULT 'todo'::"text",
    "priority" "text" DEFAULT 'medium'::"text",
    "assigned_to" "uuid",
    "due_date" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "phase_id" "uuid",
    "org_id" "uuid",
    CONSTRAINT "tasks_priority_check" CHECK (("priority" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text", 'urgent'::"text"]))),
    CONSTRAINT "tasks_status_check" CHECK (("status" = ANY (ARRAY['todo'::"text", 'in-progress'::"text", 'review'::"text", 'completed'::"text"])))
);


ALTER TABLE "public"."tasks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."team_members" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "phone" "text",
    "role" "text" DEFAULT 'worker'::"text",
    "avatar_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "org_id" "uuid",
    "invite_id" "uuid",
    "org_member_id" "uuid",
    CONSTRAINT "team_members_role_check" CHECK (("role" = ANY (ARRAY['admin'::"text", 'manager'::"text", 'supervisor'::"text", 'worker'::"text"])))
);


ALTER TABLE "public"."team_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."templates" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "type" "text" NOT NULL,
    "content" "jsonb" NOT NULL,
    "is_shared" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "templates_type_check" CHECK (("type" = ANY (ARRAY['project'::"text", 'task'::"text", 'phase'::"text", 'document'::"text", 'proposal'::"text"])))
);


ALTER TABLE "public"."templates" OWNER TO "postgres";


COMMENT ON TABLE "public"."templates" IS 'Reusable templates for various entities';



CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'owner'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_roles_role_check" CHECK (("role" = ANY (ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text", 'supervisor'::"text", 'worker'::"text", 'viewer'::"text"])))
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";


ALTER TABLE ONLY "public"."api_rate_events" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."api_rate_events_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."api_rate_events"
    ADD CONSTRAINT "api_rate_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."branches"
    ADD CONSTRAINT "branches_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."document_sequences"
    ADD CONSTRAINT "document_sequences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."document_sequences"
    ADD CONSTRAINT "document_sequences_user_id_document_type_key" UNIQUE ("user_id", "document_type");



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."expenses"
    ADD CONSTRAINT "expenses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."form_documents"
    ADD CONSTRAINT "form_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."form_templates"
    ADD CONSTRAINT "form_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."generated_documents"
    ADD CONSTRAINT "generated_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."integrations"
    ADD CONSTRAINT "integrations_org_id_provider_key" UNIQUE ("org_id", "provider");



ALTER TABLE ONLY "public"."integrations"
    ADD CONSTRAINT "integrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."line_item_templates"
    ADD CONSTRAINT "line_item_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."meetings"
    ADD CONSTRAINT "meetings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."message_attachments"
    ADD CONSTRAINT "message_attachments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."org_invites"
    ADD CONSTRAINT "org_invites_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."org_invites"
    ADD CONSTRAINT "org_invites_token_key" UNIQUE ("token");



ALTER TABLE ONLY "public"."org_members"
    ADD CONSTRAINT "org_members_org_id_email_key" UNIQUE ("org_id", "email");



ALTER TABLE ONLY "public"."org_members"
    ADD CONSTRAINT "org_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."phases"
    ADD CONSTRAINT "phases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."photos"
    ADD CONSTRAINT "photos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_phases"
    ADD CONSTRAINT "project_phases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_team"
    ADD CONSTRAINT "project_team_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_team"
    ADD CONSTRAINT "project_team_project_id_team_member_id_key" UNIQUE ("project_id", "team_member_id");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."referrals"
    ADD CONSTRAINT "referrals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."task_comments"
    ADD CONSTRAINT "task_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."templates"
    ADD CONSTRAINT "templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "unique_storage_path" UNIQUE ("storage_path");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_key" UNIQUE ("user_id");



CREATE INDEX "idx_api_rate_events_lookup" ON "public"."api_rate_events" USING "btree" ("org_id", "bucket", "created_at" DESC);



CREATE INDEX "idx_branches_org" ON "public"."branches" USING "btree" ("org_id");



CREATE INDEX "idx_branches_user_id" ON "public"."branches" USING "btree" ("user_id");



CREATE INDEX "idx_document_sequences_user" ON "public"."document_sequences" USING "btree" ("user_id");



CREATE INDEX "idx_documents_org" ON "public"."documents" USING "btree" ("org_id");



CREATE INDEX "idx_documents_project_id" ON "public"."documents" USING "btree" ("project_id");



CREATE INDEX "idx_documents_type" ON "public"."documents" USING "btree" ("type");



CREATE INDEX "idx_documents_user_id" ON "public"."documents" USING "btree" ("user_id");



CREATE INDEX "idx_events_end_time" ON "public"."events" USING "btree" ("end_time");



CREATE INDEX "idx_events_org" ON "public"."events" USING "btree" ("org_id");



CREATE INDEX "idx_events_project_id" ON "public"."events" USING "btree" ("project_id");



CREATE INDEX "idx_events_start_time" ON "public"."events" USING "btree" ("start_time");



CREATE INDEX "idx_events_type" ON "public"."events" USING "btree" ("type");



CREATE INDEX "idx_events_user_id" ON "public"."events" USING "btree" ("user_id");



CREATE INDEX "idx_expenses_date" ON "public"."expenses" USING "btree" ("date" DESC);



CREATE INDEX "idx_expenses_org" ON "public"."expenses" USING "btree" ("org_id");



CREATE INDEX "idx_expenses_project_id" ON "public"."expenses" USING "btree" ("project_id");



CREATE INDEX "idx_expenses_user_id" ON "public"."expenses" USING "btree" ("user_id");



CREATE INDEX "idx_form_templates_active" ON "public"."form_templates" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_form_templates_type" ON "public"."form_templates" USING "btree" ("type");



CREATE INDEX "idx_form_templates_user" ON "public"."form_templates" USING "btree" ("user_id");



CREATE INDEX "idx_gendocs_org" ON "public"."generated_documents" USING "btree" ("org_id");



CREATE INDEX "idx_generated_documents_date_issued" ON "public"."generated_documents" USING "btree" ("date_issued" DESC);



CREATE INDEX "idx_generated_documents_number" ON "public"."generated_documents" USING "btree" ("document_number");



CREATE INDEX "idx_generated_documents_project" ON "public"."generated_documents" USING "btree" ("project_id");



CREATE INDEX "idx_generated_documents_status" ON "public"."generated_documents" USING "btree" ("status");



CREATE INDEX "idx_generated_documents_type" ON "public"."generated_documents" USING "btree" ("type");



CREATE INDEX "idx_generated_documents_user" ON "public"."generated_documents" USING "btree" ("user_id");



CREATE INDEX "idx_integrations_org" ON "public"."integrations" USING "btree" ("org_id");



CREATE INDEX "idx_integrations_provider" ON "public"."integrations" USING "btree" ("provider");



CREATE INDEX "idx_leads_org_id" ON "public"."leads" USING "btree" ("org_id");



CREATE INDEX "idx_leads_status" ON "public"."leads" USING "btree" ("status");



CREATE INDEX "idx_leads_user_id" ON "public"."leads" USING "btree" ("user_id");



CREATE INDEX "idx_line_item_templates_active" ON "public"."line_item_templates" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_line_item_templates_category" ON "public"."line_item_templates" USING "btree" ("category");



CREATE INDEX "idx_line_item_templates_user" ON "public"."line_item_templates" USING "btree" ("user_id");



CREATE INDEX "idx_meetings_org" ON "public"."meetings" USING "btree" ("org_id");



CREATE INDEX "idx_meetings_project_id" ON "public"."meetings" USING "btree" ("project_id");



CREATE INDEX "idx_meetings_user_id" ON "public"."meetings" USING "btree" ("user_id");



CREATE INDEX "idx_message_attachments_message_id" ON "public"."message_attachments" USING "btree" ("message_id");



CREATE INDEX "idx_messages_branch_id" ON "public"."messages" USING "btree" ("branch_id");



CREATE INDEX "idx_messages_org" ON "public"."messages" USING "btree" ("org_id");



CREATE INDEX "idx_messages_project_id" ON "public"."messages" USING "btree" ("project_id");



CREATE INDEX "idx_messages_user_id" ON "public"."messages" USING "btree" ("user_id");



CREATE INDEX "idx_notifications_org" ON "public"."notifications" USING "btree" ("org_id");



CREATE INDEX "idx_notifications_user" ON "public"."notifications" USING "btree" ("user_id", "read", "created_at" DESC);



CREATE INDEX "idx_org_invites_email" ON "public"."org_invites" USING "btree" ("email");



CREATE UNIQUE INDEX "idx_org_invites_open" ON "public"."org_invites" USING "btree" ("org_id", "email") WHERE (("accepted_at" IS NULL) AND ("revoked_at" IS NULL));



CREATE INDEX "idx_org_invites_org" ON "public"."org_invites" USING "btree" ("org_id");



CREATE INDEX "idx_org_members_email" ON "public"."org_members" USING "btree" ("email");



CREATE INDEX "idx_org_members_org" ON "public"."org_members" USING "btree" ("org_id");



CREATE INDEX "idx_org_members_user" ON "public"."org_members" USING "btree" ("user_id");



CREATE INDEX "idx_organizations_owner" ON "public"."organizations" USING "btree" ("owner_id");



CREATE INDEX "idx_phases_org" ON "public"."phases" USING "btree" ("org_id");



CREATE INDEX "idx_phases_project_id" ON "public"."project_phases" USING "btree" ("project_id");



CREATE INDEX "idx_photos_org_id" ON "public"."photos" USING "btree" ("org_id");



CREATE INDEX "idx_photos_project_id" ON "public"."photos" USING "btree" ("project_id");



CREATE INDEX "idx_photos_user_id" ON "public"."photos" USING "btree" ("user_id");



CREATE INDEX "idx_profiles_plan" ON "public"."profiles" USING "btree" ("plan");



CREATE INDEX "idx_project_team_member" ON "public"."project_team" USING "btree" ("team_member_id");



CREATE INDEX "idx_project_team_member_id" ON "public"."project_team" USING "btree" ("team_member_id");



CREATE INDEX "idx_project_team_project" ON "public"."project_team" USING "btree" ("project_id");



CREATE INDEX "idx_project_team_project_id" ON "public"."project_team" USING "btree" ("project_id");



CREATE INDEX "idx_projects_created_at" ON "public"."projects" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_projects_org" ON "public"."projects" USING "btree" ("org_id");



CREATE UNIQUE INDEX "idx_projects_portal_token" ON "public"."projects" USING "btree" ("portal_token");



CREATE INDEX "idx_projects_status" ON "public"."projects" USING "btree" ("status");



CREATE INDEX "idx_projects_user_id" ON "public"."projects" USING "btree" ("user_id");



CREATE INDEX "idx_referrals_email" ON "public"."referrals" USING "btree" ("referred_email");



CREATE INDEX "idx_referrals_referrer" ON "public"."referrals" USING "btree" ("referrer_id");



CREATE INDEX "idx_subscriptions_status" ON "public"."subscriptions" USING "btree" ("status");



CREATE INDEX "idx_subscriptions_stripe_customer" ON "public"."subscriptions" USING "btree" ("stripe_customer_id");



CREATE INDEX "idx_subscriptions_user_id" ON "public"."subscriptions" USING "btree" ("user_id");



CREATE INDEX "idx_task_comments_task_id" ON "public"."task_comments" USING "btree" ("task_id");



CREATE INDEX "idx_tasks_assigned_to" ON "public"."tasks" USING "btree" ("assigned_to");



CREATE INDEX "idx_tasks_org" ON "public"."tasks" USING "btree" ("org_id");



CREATE INDEX "idx_tasks_project_id" ON "public"."tasks" USING "btree" ("project_id");



CREATE INDEX "idx_tasks_status" ON "public"."tasks" USING "btree" ("status");



CREATE INDEX "idx_tasks_user_id" ON "public"."tasks" USING "btree" ("user_id");



CREATE INDEX "idx_team_members_email" ON "public"."team_members" USING "btree" ("email");



CREATE INDEX "idx_team_members_org" ON "public"."team_members" USING "btree" ("org_id");



CREATE INDEX "idx_team_members_org_member" ON "public"."team_members" USING "btree" ("org_member_id");



CREATE INDEX "idx_team_members_user_id" ON "public"."team_members" USING "btree" ("user_id");



CREATE INDEX "idx_templates_user_id" ON "public"."templates" USING "btree" ("user_id");



CREATE INDEX "idx_user_roles_user" ON "public"."user_roles" USING "btree" ("user_id");



CREATE INDEX "phases_project_id_idx" ON "public"."phases" USING "btree" ("project_id");



CREATE INDEX "phases_user_id_idx" ON "public"."phases" USING "btree" ("user_id");



CREATE INDEX "tasks_phase_id_idx" ON "public"."tasks" USING "btree" ("phase_id");



CREATE OR REPLACE TRIGGER "events_updated_at" BEFORE UPDATE ON "public"."events" FOR EACH ROW EXECUTE FUNCTION "public"."update_events_updated_at"();



CREATE OR REPLACE TRIGGER "update_branches_updated_at" BEFORE UPDATE ON "public"."branches" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_expenses_updated_at" BEFORE UPDATE ON "public"."expenses" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_form_documents_updated_at" BEFORE UPDATE ON "public"."form_documents" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_form_templates_updated_at" BEFORE UPDATE ON "public"."form_templates" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_generated_documents_updated_at" BEFORE UPDATE ON "public"."generated_documents" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_line_item_templates_updated_at" BEFORE UPDATE ON "public"."line_item_templates" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_meetings_updated_at" BEFORE UPDATE ON "public"."meetings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_organizations_updated_at" BEFORE UPDATE ON "public"."organizations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_project_phases_updated_at" BEFORE UPDATE ON "public"."project_phases" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_projects_updated_at" BEFORE UPDATE ON "public"."projects" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_subscriptions_updated_at" BEFORE UPDATE ON "public"."subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_templates_updated_at" BEFORE UPDATE ON "public"."templates" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_roles_updated_at" BEFORE UPDATE ON "public"."user_roles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."api_rate_events"
    ADD CONSTRAINT "api_rate_events_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."branches"
    ADD CONSTRAINT "branches_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."branches"
    ADD CONSTRAINT "branches_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."document_sequences"
    ADD CONSTRAINT "document_sequences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."expenses"
    ADD CONSTRAINT "expenses_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."expenses"
    ADD CONSTRAINT "expenses_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."expenses"
    ADD CONSTRAINT "expenses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "fk_projects_branch" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."form_documents"
    ADD CONSTRAINT "form_documents_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."form_documents"
    ADD CONSTRAINT "form_documents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."form_templates"
    ADD CONSTRAINT "form_templates_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."form_templates"
    ADD CONSTRAINT "form_templates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."generated_documents"
    ADD CONSTRAINT "generated_documents_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."generated_documents"
    ADD CONSTRAINT "generated_documents_parent_document_id_fkey" FOREIGN KEY ("parent_document_id") REFERENCES "public"."generated_documents"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."generated_documents"
    ADD CONSTRAINT "generated_documents_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."generated_documents"
    ADD CONSTRAINT "generated_documents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."integrations"
    ADD CONSTRAINT "integrations_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."integrations"
    ADD CONSTRAINT "integrations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."line_item_templates"
    ADD CONSTRAINT "line_item_templates_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."line_item_templates"
    ADD CONSTRAINT "line_item_templates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."meetings"
    ADD CONSTRAINT "meetings_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."meetings"
    ADD CONSTRAINT "meetings_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."meetings"
    ADD CONSTRAINT "meetings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."message_attachments"
    ADD CONSTRAINT "message_attachments_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_invites"
    ADD CONSTRAINT "org_invites_accepted_by_fkey" FOREIGN KEY ("accepted_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."org_invites"
    ADD CONSTRAINT "org_invites_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."org_invites"
    ADD CONSTRAINT "org_invites_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_members"
    ADD CONSTRAINT "org_members_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."org_members"
    ADD CONSTRAINT "org_members_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_members"
    ADD CONSTRAINT "org_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."phases"
    ADD CONSTRAINT "phases_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."phases"
    ADD CONSTRAINT "phases_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."phases"
    ADD CONSTRAINT "phases_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."photos"
    ADD CONSTRAINT "photos_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."photos"
    ADD CONSTRAINT "photos_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."photos"
    ADD CONSTRAINT "photos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."project_phases"
    ADD CONSTRAINT "project_phases_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_team"
    ADD CONSTRAINT "project_team_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_team"
    ADD CONSTRAINT "project_team_team_member_id_fkey" FOREIGN KEY ("team_member_id") REFERENCES "public"."team_members"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."referrals"
    ADD CONSTRAINT "referrals_referred_user_id_fkey" FOREIGN KEY ("referred_user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."referrals"
    ADD CONSTRAINT "referrals_referrer_id_fkey" FOREIGN KEY ("referrer_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."task_comments"
    ADD CONSTRAINT "task_comments_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."team_members"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_phase_id_fkey" FOREIGN KEY ("phase_id") REFERENCES "public"."phases"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_invite_id_fkey" FOREIGN KEY ("invite_id") REFERENCES "public"."org_invites"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_org_member_id_fkey" FOREIGN KEY ("org_member_id") REFERENCES "public"."org_members"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."templates"
    ADD CONSTRAINT "templates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Users can create phases in their projects" ON "public"."project_phases" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."projects"
  WHERE (("projects"."id" = "project_phases"."project_id") AND ("projects"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can create their own branches" ON "public"."branches" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create their own expenses" ON "public"."expenses" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create their own meetings" ON "public"."meetings" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create their own projects" ON "public"."projects" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create their own templates" ON "public"."templates" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete phases in their projects" ON "public"."project_phases" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."projects"
  WHERE (("projects"."id" = "project_phases"."project_id") AND ("projects"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete their own branches" ON "public"."branches" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own documents" ON "public"."documents" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own events" ON "public"."events" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own expenses" ON "public"."expenses" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own form templates" ON "public"."form_templates" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own generated documents" ON "public"."generated_documents" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own line item templates" ON "public"."line_item_templates" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own meetings" ON "public"."meetings" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own projects" ON "public"."projects" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own templates" ON "public"."templates" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own branches" ON "public"."branches" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own document sequences" ON "public"."document_sequences" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own documents" ON "public"."documents" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own events" ON "public"."events" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own expenses" ON "public"."expenses" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own form templates" ON "public"."form_templates" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own generated documents" ON "public"."generated_documents" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own line item templates" ON "public"."line_item_templates" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own projects" ON "public"."projects" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update phases in their projects" ON "public"."project_phases" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."projects"
  WHERE (("projects"."id" = "project_phases"."project_id") AND ("projects"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update their own branches" ON "public"."branches" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own document sequences" ON "public"."document_sequences" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own events" ON "public"."events" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own expenses" ON "public"."expenses" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own form templates" ON "public"."form_templates" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own generated documents" ON "public"."generated_documents" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own line item templates" ON "public"."line_item_templates" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own meetings" ON "public"."meetings" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update their own projects" ON "public"."projects" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own templates" ON "public"."templates" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own referrals" ON "public"."referrals" FOR SELECT USING (("auth"."uid"() = "referrer_id"));



CREATE POLICY "Users can view phases of their projects" ON "public"."project_phases" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."projects"
  WHERE (("projects"."id" = "project_phases"."project_id") AND ("projects"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their own branches" ON "public"."branches" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own document sequences" ON "public"."document_sequences" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own documents" ON "public"."documents" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own events" ON "public"."events" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own expenses" ON "public"."expenses" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own form templates" ON "public"."form_templates" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own generated documents" ON "public"."generated_documents" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own line item templates" ON "public"."line_item_templates" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own meetings" ON "public"."meetings" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view their own projects" ON "public"."projects" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own templates" ON "public"."templates" FOR SELECT USING ((("auth"."uid"() = "user_id") OR ("is_shared" = true)));



ALTER TABLE "public"."api_rate_events" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "attachments_delete" ON "public"."message_attachments" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."messages"
  WHERE (("messages"."id" = "message_attachments"."message_id") AND ("messages"."user_id" = "auth"."uid"())))));



CREATE POLICY "attachments_insert" ON "public"."message_attachments" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."messages"
  WHERE (("messages"."id" = "message_attachments"."message_id") AND ("messages"."user_id" = "auth"."uid"())))));



CREATE POLICY "attachments_select" ON "public"."message_attachments" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."messages"
  WHERE (("messages"."id" = "message_attachments"."message_id") AND ("messages"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."branches" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "comments_delete" ON "public"."task_comments" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."tasks"
  WHERE (("tasks"."id" = "task_comments"."task_id") AND ("tasks"."user_id" = "auth"."uid"())))));



CREATE POLICY "comments_insert" ON "public"."task_comments" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."tasks"
  WHERE (("tasks"."id" = "task_comments"."task_id") AND ("tasks"."user_id" = "auth"."uid"())))));



CREATE POLICY "comments_select" ON "public"."task_comments" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."tasks"
  WHERE (("tasks"."id" = "task_comments"."task_id") AND ("tasks"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."document_sequences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."documents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."expenses" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "form_docs_all" ON "public"."form_documents" USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."form_documents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."form_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."generated_documents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."integrations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "integrations_org_member" ON "public"."integrations" USING ((("auth"."uid"() = "user_id") OR (EXISTS ( SELECT 1
   FROM "public"."org_members" "om"
  WHERE (("om"."org_id" = "integrations"."org_id") AND ("om"."user_id" = "auth"."uid"()) AND ("om"."status" = 'active'::"text")))))) WITH CHECK ((("auth"."uid"() = "user_id") OR (EXISTS ( SELECT 1
   FROM "public"."org_members" "om"
  WHERE (("om"."org_id" = "integrations"."org_id") AND ("om"."user_id" = "auth"."uid"()) AND ("om"."status" = 'active'::"text"))))));



CREATE POLICY "invites_admin_select" ON "public"."org_invites" FOR SELECT USING (("org_id" IN ( SELECT "public"."user_admin_org_ids"("auth"."uid"()) AS "user_admin_org_ids")));



ALTER TABLE "public"."leads" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "leads_delete" ON "public"."leads" FOR DELETE USING ((("auth"."uid"() = "user_id") OR (("org_id" IS NOT NULL) AND ("org_id" IN ( SELECT "org_members"."org_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))))));



CREATE POLICY "leads_insert" ON "public"."leads" FOR INSERT WITH CHECK ((("auth"."uid"() = "user_id") OR (("org_id" IS NOT NULL) AND ("org_id" IN ( SELECT "org_members"."org_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))))));



CREATE POLICY "leads_select" ON "public"."leads" FOR SELECT USING ((("auth"."uid"() = "user_id") OR (("org_id" IS NOT NULL) AND ("org_id" IN ( SELECT "org_members"."org_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))))));



CREATE POLICY "leads_update" ON "public"."leads" FOR UPDATE USING ((("auth"."uid"() = "user_id") OR (("org_id" IS NOT NULL) AND ("org_id" IN ( SELECT "org_members"."org_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))))));



ALTER TABLE "public"."line_item_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."meetings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."message_attachments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "msg_attachments_all" ON "public"."message_attachments" USING ((EXISTS ( SELECT 1
   FROM "public"."messages" "m"
  WHERE (("m"."id" = "message_attachments"."message_id") AND (("m"."user_id" = "auth"."uid"()) OR ("m"."org_id" IN ( SELECT "public"."user_org_ids"("auth"."uid"()) AS "user_org_ids")))))));



CREATE POLICY "notif_delete" ON "public"."notifications" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "notif_insert" ON "public"."notifications" FOR INSERT WITH CHECK ((("user_id" = "auth"."uid"()) OR (("org_id" IN ( SELECT "public"."user_org_ids"("auth"."uid"()) AS "user_org_ids")) AND ("user_id" IN ( SELECT "om"."user_id"
   FROM "public"."org_members" "om"
  WHERE (("om"."org_id" = "notifications"."org_id") AND ("om"."status" = 'active'::"text")))))));



CREATE POLICY "notif_select" ON "public"."notifications" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "notif_update" ON "public"."notifications" FOR UPDATE USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "org_branches_delete" ON "public"."branches" FOR DELETE USING (("org_id" IN ( SELECT "public"."user_org_ids"("auth"."uid"()) AS "user_org_ids")));



CREATE POLICY "org_branches_insert" ON "public"."branches" FOR INSERT WITH CHECK (("org_id" IN ( SELECT "public"."user_org_ids"("auth"."uid"()) AS "user_org_ids")));



CREATE POLICY "org_branches_select" ON "public"."branches" FOR SELECT USING (("org_id" IN ( SELECT "public"."user_org_ids"("auth"."uid"()) AS "user_org_ids")));



CREATE POLICY "org_branches_update" ON "public"."branches" FOR UPDATE USING (("org_id" IN ( SELECT "public"."user_org_ids"("auth"."uid"()) AS "user_org_ids")));



CREATE POLICY "org_documents_delete" ON "public"."documents" FOR DELETE USING (("org_id" IN ( SELECT "public"."user_org_ids"("auth"."uid"()) AS "user_org_ids")));



CREATE POLICY "org_documents_insert" ON "public"."documents" FOR INSERT WITH CHECK (("org_id" IN ( SELECT "public"."user_org_ids"("auth"."uid"()) AS "user_org_ids")));



CREATE POLICY "org_documents_select" ON "public"."documents" FOR SELECT USING (("org_id" IN ( SELECT "public"."user_org_ids"("auth"."uid"()) AS "user_org_ids")));



CREATE POLICY "org_documents_update" ON "public"."documents" FOR UPDATE USING (("org_id" IN ( SELECT "public"."user_org_ids"("auth"."uid"()) AS "user_org_ids")));



CREATE POLICY "org_events_delete" ON "public"."events" FOR DELETE USING (("org_id" IN ( SELECT "public"."user_org_ids"("auth"."uid"()) AS "user_org_ids")));



CREATE POLICY "org_events_insert" ON "public"."events" FOR INSERT WITH CHECK (("org_id" IN ( SELECT "public"."user_org_ids"("auth"."uid"()) AS "user_org_ids")));



CREATE POLICY "org_events_select" ON "public"."events" FOR SELECT USING (("org_id" IN ( SELECT "public"."user_org_ids"("auth"."uid"()) AS "user_org_ids")));



CREATE POLICY "org_events_update" ON "public"."events" FOR UPDATE USING (("org_id" IN ( SELECT "public"."user_org_ids"("auth"."uid"()) AS "user_org_ids")));



CREATE POLICY "org_expenses_delete" ON "public"."expenses" FOR DELETE USING (("org_id" IN ( SELECT "public"."user_org_ids"("auth"."uid"()) AS "user_org_ids")));



CREATE POLICY "org_expenses_insert" ON "public"."expenses" FOR INSERT WITH CHECK (("org_id" IN ( SELECT "public"."user_org_ids"("auth"."uid"()) AS "user_org_ids")));



CREATE POLICY "org_expenses_select" ON "public"."expenses" FOR SELECT USING (("org_id" IN ( SELECT "public"."user_org_ids"("auth"."uid"()) AS "user_org_ids")));



CREATE POLICY "org_expenses_update" ON "public"."expenses" FOR UPDATE USING (("org_id" IN ( SELECT "public"."user_org_ids"("auth"."uid"()) AS "user_org_ids")));



CREATE POLICY "org_form_templates_delete" ON "public"."form_templates" FOR DELETE USING ((("org_id" IN ( SELECT "public"."user_org_ids"("auth"."uid"()) AS "user_org_ids")) OR (("org_id" IS NULL) AND ("user_id" = "auth"."uid"()))));



CREATE POLICY "org_form_templates_insert" ON "public"."form_templates" FOR INSERT WITH CHECK ((("org_id" IN ( SELECT "public"."user_org_ids"("auth"."uid"()) AS "user_org_ids")) OR (("org_id" IS NULL) AND ("user_id" = "auth"."uid"()))));



CREATE POLICY "org_form_templates_select" ON "public"."form_templates" FOR SELECT USING ((("org_id" IN ( SELECT "public"."user_org_ids"("auth"."uid"()) AS "user_org_ids")) OR (("org_id" IS NULL) AND ("user_id" = "auth"."uid"()))));



CREATE POLICY "org_form_templates_update" ON "public"."form_templates" FOR UPDATE USING ((("org_id" IN ( SELECT "public"."user_org_ids"("auth"."uid"()) AS "user_org_ids")) OR (("org_id" IS NULL) AND ("user_id" = "auth"."uid"()))));



CREATE POLICY "org_generated_documents_delete" ON "public"."generated_documents" FOR DELETE USING (("org_id" IN ( SELECT "public"."user_org_ids"("auth"."uid"()) AS "user_org_ids")));



CREATE POLICY "org_generated_documents_insert" ON "public"."generated_documents" FOR INSERT WITH CHECK (("org_id" IN ( SELECT "public"."user_org_ids"("auth"."uid"()) AS "user_org_ids")));



CREATE POLICY "org_generated_documents_select" ON "public"."generated_documents" FOR SELECT USING (("org_id" IN ( SELECT "public"."user_org_ids"("auth"."uid"()) AS "user_org_ids")));



CREATE POLICY "org_generated_documents_update" ON "public"."generated_documents" FOR UPDATE USING (("org_id" IN ( SELECT "public"."user_org_ids"("auth"."uid"()) AS "user_org_ids")));



CREATE POLICY "org_insert" ON "public"."organizations" FOR INSERT WITH CHECK (("owner_id" = "auth"."uid"()));



ALTER TABLE "public"."org_invites" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "org_line_item_templates_delete" ON "public"."line_item_templates" FOR DELETE USING ((("org_id" IN ( SELECT "public"."user_org_ids"("auth"."uid"()) AS "user_org_ids")) OR (("org_id" IS NULL) AND ("user_id" = "auth"."uid"()))));



CREATE POLICY "org_line_item_templates_insert" ON "public"."line_item_templates" FOR INSERT WITH CHECK ((("org_id" IN ( SELECT "public"."user_org_ids"("auth"."uid"()) AS "user_org_ids")) OR (("org_id" IS NULL) AND ("user_id" = "auth"."uid"()))));



CREATE POLICY "org_line_item_templates_select" ON "public"."line_item_templates" FOR SELECT USING ((("org_id" IN ( SELECT "public"."user_org_ids"("auth"."uid"()) AS "user_org_ids")) OR (("org_id" IS NULL) AND ("user_id" = "auth"."uid"()))));



CREATE POLICY "org_line_item_templates_update" ON "public"."line_item_templates" FOR UPDATE USING ((("org_id" IN ( SELECT "public"."user_org_ids"("auth"."uid"()) AS "user_org_ids")) OR (("org_id" IS NULL) AND ("user_id" = "auth"."uid"()))));



CREATE POLICY "org_meetings_delete" ON "public"."meetings" FOR DELETE USING (("org_id" IN ( SELECT "public"."user_org_ids"("auth"."uid"()) AS "user_org_ids")));



CREATE POLICY "org_meetings_insert" ON "public"."meetings" FOR INSERT WITH CHECK (("org_id" IN ( SELECT "public"."user_org_ids"("auth"."uid"()) AS "user_org_ids")));



CREATE POLICY "org_meetings_select" ON "public"."meetings" FOR SELECT USING (("org_id" IN ( SELECT "public"."user_org_ids"("auth"."uid"()) AS "user_org_ids")));



CREATE POLICY "org_meetings_update" ON "public"."meetings" FOR UPDATE USING (("org_id" IN ( SELECT "public"."user_org_ids"("auth"."uid"()) AS "user_org_ids")));



ALTER TABLE "public"."org_members" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "org_messages_delete" ON "public"."messages" FOR DELETE USING (("org_id" IN ( SELECT "public"."user_org_ids"("auth"."uid"()) AS "user_org_ids")));



CREATE POLICY "org_messages_insert" ON "public"."messages" FOR INSERT WITH CHECK (("org_id" IN ( SELECT "public"."user_org_ids"("auth"."uid"()) AS "user_org_ids")));



CREATE POLICY "org_messages_select" ON "public"."messages" FOR SELECT USING (("org_id" IN ( SELECT "public"."user_org_ids"("auth"."uid"()) AS "user_org_ids")));



CREATE POLICY "org_messages_update" ON "public"."messages" FOR UPDATE USING (("org_id" IN ( SELECT "public"."user_org_ids"("auth"."uid"()) AS "user_org_ids")));



CREATE POLICY "org_phases_delete" ON "public"."phases" FOR DELETE USING (("org_id" IN ( SELECT "public"."user_org_ids"("auth"."uid"()) AS "user_org_ids")));



CREATE POLICY "org_phases_insert" ON "public"."phases" FOR INSERT WITH CHECK (("org_id" IN ( SELECT "public"."user_org_ids"("auth"."uid"()) AS "user_org_ids")));



CREATE POLICY "org_phases_select" ON "public"."phases" FOR SELECT USING (("org_id" IN ( SELECT "public"."user_org_ids"("auth"."uid"()) AS "user_org_ids")));



CREATE POLICY "org_phases_update" ON "public"."phases" FOR UPDATE USING (("org_id" IN ( SELECT "public"."user_org_ids"("auth"."uid"()) AS "user_org_ids")));



CREATE POLICY "org_project_team_delete" ON "public"."project_team" FOR DELETE USING (("project_id" IN ( SELECT "projects"."id"
   FROM "public"."projects"
  WHERE ("projects"."org_id" IN ( SELECT "public"."user_org_ids"("auth"."uid"()) AS "user_org_ids")))));



CREATE POLICY "org_project_team_insert" ON "public"."project_team" FOR INSERT WITH CHECK (("project_id" IN ( SELECT "projects"."id"
   FROM "public"."projects"
  WHERE ("projects"."org_id" IN ( SELECT "public"."user_org_ids"("auth"."uid"()) AS "user_org_ids")))));



CREATE POLICY "org_project_team_select" ON "public"."project_team" FOR SELECT USING (("project_id" IN ( SELECT "projects"."id"
   FROM "public"."projects"
  WHERE ("projects"."org_id" IN ( SELECT "public"."user_org_ids"("auth"."uid"()) AS "user_org_ids")))));



CREATE POLICY "org_project_team_update" ON "public"."project_team" FOR UPDATE USING (("project_id" IN ( SELECT "projects"."id"
   FROM "public"."projects"
  WHERE ("projects"."org_id" IN ( SELECT "public"."user_org_ids"("auth"."uid"()) AS "user_org_ids")))));



CREATE POLICY "org_projects_delete" ON "public"."projects" FOR DELETE USING (("org_id" IN ( SELECT "public"."user_org_ids"("auth"."uid"()) AS "user_org_ids")));



CREATE POLICY "org_projects_insert" ON "public"."projects" FOR INSERT WITH CHECK (("org_id" IN ( SELECT "public"."user_org_ids"("auth"."uid"()) AS "user_org_ids")));



CREATE POLICY "org_projects_select" ON "public"."projects" FOR SELECT USING (("org_id" IN ( SELECT "public"."user_org_ids"("auth"."uid"()) AS "user_org_ids")));



CREATE POLICY "org_projects_update" ON "public"."projects" FOR UPDATE USING (("org_id" IN ( SELECT "public"."user_org_ids"("auth"."uid"()) AS "user_org_ids")));



CREATE POLICY "org_select" ON "public"."organizations" FOR SELECT USING (("id" IN ( SELECT "public"."user_org_ids"("auth"."uid"()) AS "user_org_ids")));



CREATE POLICY "org_tasks_delete" ON "public"."tasks" FOR DELETE USING (("org_id" IN ( SELECT "public"."user_org_ids"("auth"."uid"()) AS "user_org_ids")));



CREATE POLICY "org_tasks_insert" ON "public"."tasks" FOR INSERT WITH CHECK (("org_id" IN ( SELECT "public"."user_org_ids"("auth"."uid"()) AS "user_org_ids")));



CREATE POLICY "org_tasks_select" ON "public"."tasks" FOR SELECT USING (("org_id" IN ( SELECT "public"."user_org_ids"("auth"."uid"()) AS "user_org_ids")));



CREATE POLICY "org_tasks_update" ON "public"."tasks" FOR UPDATE USING (("org_id" IN ( SELECT "public"."user_org_ids"("auth"."uid"()) AS "user_org_ids")));



CREATE POLICY "org_team_members_delete" ON "public"."team_members" FOR DELETE USING (("org_id" IN ( SELECT "public"."user_org_ids"("auth"."uid"()) AS "user_org_ids")));



CREATE POLICY "org_team_members_insert" ON "public"."team_members" FOR INSERT WITH CHECK (("org_id" IN ( SELECT "public"."user_org_ids"("auth"."uid"()) AS "user_org_ids")));



CREATE POLICY "org_team_members_select" ON "public"."team_members" FOR SELECT USING (("org_id" IN ( SELECT "public"."user_org_ids"("auth"."uid"()) AS "user_org_ids")));



CREATE POLICY "org_team_members_update" ON "public"."team_members" FOR UPDATE USING (("org_id" IN ( SELECT "public"."user_org_ids"("auth"."uid"()) AS "user_org_ids")));



CREATE POLICY "org_update" ON "public"."organizations" FOR UPDATE USING (("owner_id" = "auth"."uid"()));



ALTER TABLE "public"."organizations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "orgmem_delete" ON "public"."org_members" FOR DELETE USING ((("org_id" IN ( SELECT "public"."user_admin_org_ids"("auth"."uid"()) AS "user_admin_org_ids")) AND ("role" <> 'owner'::"text")));



CREATE POLICY "orgmem_insert" ON "public"."org_members" FOR INSERT WITH CHECK (((("org_id" IN ( SELECT "public"."user_admin_org_ids"("auth"."uid"()) AS "user_admin_org_ids")) AND ("role" <> 'owner'::"text")) OR (("user_id" = "auth"."uid"()) AND ("role" = 'owner'::"text") AND ("org_id" IN ( SELECT "organizations"."id"
   FROM "public"."organizations"
  WHERE ("organizations"."owner_id" = "auth"."uid"()))))));



CREATE POLICY "orgmem_select" ON "public"."org_members" FOR SELECT USING (("org_id" IN ( SELECT "public"."user_org_ids"("auth"."uid"()) AS "user_org_ids")));



CREATE POLICY "orgmem_update" ON "public"."org_members" FOR UPDATE USING ((("org_id" IN ( SELECT "public"."user_admin_org_ids"("auth"."uid"()) AS "user_admin_org_ids")) AND (("role" <> 'owner'::"text") OR ("user_id" = "auth"."uid"())))) WITH CHECK ((("org_id" IN ( SELECT "public"."user_admin_org_ids"("auth"."uid"()) AS "user_admin_org_ids")) AND (("role" <> 'owner'::"text") OR ("org_id" IN ( SELECT "organizations"."id"
   FROM "public"."organizations"
  WHERE ("organizations"."owner_id" = "auth"."uid"()))))));



ALTER TABLE "public"."phases" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."photos" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "photos_delete" ON "public"."photos" FOR DELETE USING ((("auth"."uid"() = "user_id") OR (("org_id" IS NOT NULL) AND ("org_id" IN ( SELECT "org_members"."org_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))))));



CREATE POLICY "photos_insert" ON "public"."photos" FOR INSERT WITH CHECK ((("auth"."uid"() = "user_id") OR (("org_id" IS NOT NULL) AND ("org_id" IN ( SELECT "org_members"."org_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))))));



CREATE POLICY "photos_select" ON "public"."photos" FOR SELECT USING ((("auth"."uid"() = "user_id") OR (("org_id" IS NOT NULL) AND ("org_id" IN ( SELECT "org_members"."org_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))))));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_insert" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "profiles_select" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "profiles_update" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



ALTER TABLE "public"."project_phases" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_team" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "project_team_delete" ON "public"."project_team" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."projects"
  WHERE (("projects"."id" = "project_team"."project_id") AND ("projects"."user_id" = "auth"."uid"())))));



CREATE POLICY "project_team_insert" ON "public"."project_team" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."projects"
  WHERE (("projects"."id" = "project_team"."project_id") AND ("projects"."user_id" = "auth"."uid"())))));



CREATE POLICY "project_team_select" ON "public"."project_team" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."projects"
  WHERE (("projects"."id" = "project_team"."project_id") AND ("projects"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."projects" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."referrals" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "roles_insert" ON "public"."user_roles" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "roles_manage" ON "public"."user_roles" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "user_roles_1"
  WHERE (("user_roles_1"."user_id" = "auth"."uid"()) AND ("user_roles_1"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"]))))));



CREATE POLICY "roles_select" ON "public"."user_roles" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "sub_select" ON "public"."subscriptions" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."task_comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tasks" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "team_delete" ON "public"."team_members" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "team_insert" ON "public"."team_members" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."team_members" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "team_select" ON "public"."team_members" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "team_update" ON "public"."team_members" FOR UPDATE USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON TABLE "public"."org_invites" TO "anon";
GRANT ALL ON TABLE "public"."org_invites" TO "authenticated";
GRANT ALL ON TABLE "public"."org_invites" TO "service_role";



REVOKE ALL ON FUNCTION "public"."_apply_invite"("inv" "public"."org_invites", "uid" "uuid", "uid_email" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."_apply_invite"("inv" "public"."org_invites", "uid" "uuid", "uid_email" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."accept_org_invite"("invite_token" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."accept_org_invite"("invite_token" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."accept_org_invite"("invite_token" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."accept_pending_invites"("display_name" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."accept_pending_invites"("display_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."accept_pending_invites"("display_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_line_item_total"("p_quantity" numeric, "p_price" numeric, "p_tax_rate" numeric, "p_is_taxable" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_line_item_total"("p_quantity" numeric, "p_price" numeric, "p_tax_rate" numeric, "p_is_taxable" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_line_item_total"("p_quantity" numeric, "p_price" numeric, "p_tax_rate" numeric, "p_is_taxable" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_next_document_number"("p_user_id" "uuid", "p_document_type" "text", "p_prefix" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_next_document_number"("p_user_id" "uuid", "p_document_type" "text", "p_prefix" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_next_document_number"("p_user_id" "uuid", "p_document_type" "text", "p_prefix" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."shares_org_with"("other_user" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."shares_org_with"("other_user" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."shares_org_with"("other_user" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_events_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_events_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_events_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."user_admin_org_ids"("uid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."user_admin_org_ids"("uid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_admin_org_ids"("uid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."user_org_folder_ok"("object_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."user_org_folder_ok"("object_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_org_folder_ok"("object_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."user_org_ids"("uid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."user_org_ids"("uid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_org_ids"("uid" "uuid") TO "service_role";



GRANT ALL ON TABLE "public"."api_rate_events" TO "anon";
GRANT ALL ON TABLE "public"."api_rate_events" TO "authenticated";
GRANT ALL ON TABLE "public"."api_rate_events" TO "service_role";



GRANT ALL ON SEQUENCE "public"."api_rate_events_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."api_rate_events_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."api_rate_events_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."branches" TO "anon";
GRANT ALL ON TABLE "public"."branches" TO "authenticated";
GRANT ALL ON TABLE "public"."branches" TO "service_role";



GRANT ALL ON TABLE "public"."document_sequences" TO "anon";
GRANT ALL ON TABLE "public"."document_sequences" TO "authenticated";
GRANT ALL ON TABLE "public"."document_sequences" TO "service_role";



GRANT ALL ON TABLE "public"."documents" TO "anon";
GRANT ALL ON TABLE "public"."documents" TO "authenticated";
GRANT ALL ON TABLE "public"."documents" TO "service_role";



GRANT ALL ON TABLE "public"."events" TO "anon";
GRANT ALL ON TABLE "public"."events" TO "authenticated";
GRANT ALL ON TABLE "public"."events" TO "service_role";



GRANT ALL ON TABLE "public"."expenses" TO "anon";
GRANT ALL ON TABLE "public"."expenses" TO "authenticated";
GRANT ALL ON TABLE "public"."expenses" TO "service_role";



GRANT ALL ON TABLE "public"."form_documents" TO "anon";
GRANT ALL ON TABLE "public"."form_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."form_documents" TO "service_role";



GRANT ALL ON TABLE "public"."form_templates" TO "anon";
GRANT ALL ON TABLE "public"."form_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."form_templates" TO "service_role";



GRANT ALL ON TABLE "public"."generated_documents" TO "anon";
GRANT ALL ON TABLE "public"."generated_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."generated_documents" TO "service_role";



GRANT ALL ON TABLE "public"."integrations" TO "anon";
GRANT ALL ON TABLE "public"."integrations" TO "authenticated";
GRANT ALL ON TABLE "public"."integrations" TO "service_role";



GRANT ALL ON TABLE "public"."leads" TO "anon";
GRANT ALL ON TABLE "public"."leads" TO "authenticated";
GRANT ALL ON TABLE "public"."leads" TO "service_role";



GRANT ALL ON TABLE "public"."line_item_templates" TO "anon";
GRANT ALL ON TABLE "public"."line_item_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."line_item_templates" TO "service_role";



GRANT ALL ON TABLE "public"."meetings" TO "anon";
GRANT ALL ON TABLE "public"."meetings" TO "authenticated";
GRANT ALL ON TABLE "public"."meetings" TO "service_role";



GRANT ALL ON TABLE "public"."message_attachments" TO "anon";
GRANT ALL ON TABLE "public"."message_attachments" TO "authenticated";
GRANT ALL ON TABLE "public"."message_attachments" TO "service_role";



GRANT ALL ON TABLE "public"."messages" TO "anon";
GRANT ALL ON TABLE "public"."messages" TO "authenticated";
GRANT ALL ON TABLE "public"."messages" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."org_members" TO "anon";
GRANT ALL ON TABLE "public"."org_members" TO "authenticated";
GRANT ALL ON TABLE "public"."org_members" TO "service_role";



GRANT ALL ON TABLE "public"."organizations" TO "anon";
GRANT ALL ON TABLE "public"."organizations" TO "authenticated";
GRANT ALL ON TABLE "public"."organizations" TO "service_role";



GRANT ALL ON TABLE "public"."phases" TO "anon";
GRANT ALL ON TABLE "public"."phases" TO "authenticated";
GRANT ALL ON TABLE "public"."phases" TO "service_role";



GRANT ALL ON TABLE "public"."photos" TO "anon";
GRANT ALL ON TABLE "public"."photos" TO "authenticated";
GRANT ALL ON TABLE "public"."photos" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."project_phases" TO "anon";
GRANT ALL ON TABLE "public"."project_phases" TO "authenticated";
GRANT ALL ON TABLE "public"."project_phases" TO "service_role";



GRANT ALL ON TABLE "public"."project_team" TO "anon";
GRANT ALL ON TABLE "public"."project_team" TO "authenticated";
GRANT ALL ON TABLE "public"."project_team" TO "service_role";



GRANT ALL ON TABLE "public"."projects" TO "anon";
GRANT ALL ON TABLE "public"."projects" TO "authenticated";
GRANT ALL ON TABLE "public"."projects" TO "service_role";



GRANT ALL ON TABLE "public"."referrals" TO "anon";
GRANT ALL ON TABLE "public"."referrals" TO "authenticated";
GRANT ALL ON TABLE "public"."referrals" TO "service_role";



GRANT ALL ON TABLE "public"."subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."task_comments" TO "anon";
GRANT ALL ON TABLE "public"."task_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."task_comments" TO "service_role";



GRANT ALL ON TABLE "public"."tasks" TO "anon";
GRANT ALL ON TABLE "public"."tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."tasks" TO "service_role";



GRANT ALL ON TABLE "public"."team_members" TO "anon";
GRANT ALL ON TABLE "public"."team_members" TO "authenticated";
GRANT ALL ON TABLE "public"."team_members" TO "service_role";



GRANT ALL ON TABLE "public"."templates" TO "anon";
GRANT ALL ON TABLE "public"."templates" TO "authenticated";
GRANT ALL ON TABLE "public"."templates" TO "service_role";



GRANT ALL ON TABLE "public"."user_roles" TO "anon";
GRANT ALL ON TABLE "public"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roles" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";









-- ---------------------------------------------
-- Part 2 — outside `public`
-- ---------------------------------------------

-- Signup: profile + own org (or nothing, when joining from an invite)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Private file storage, org-scoped by first path segment
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents', 'documents', false, 26214400,
  ARRAY['image/png','image/jpeg','image/jpg','image/webp','image/gif',
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword']
)
ON CONFLICT (id) DO UPDATE SET public = false;

DROP POLICY IF EXISTS "documents_org_select" ON storage.objects;
DROP POLICY IF EXISTS "documents_org_insert" ON storage.objects;
DROP POLICY IF EXISTS "documents_org_update" ON storage.objects;
DROP POLICY IF EXISTS "documents_org_delete" ON storage.objects;

CREATE POLICY "documents_org_select" ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id = 'documents' AND (
    public.user_org_folder_ok(name)
    OR public.shares_org_with(COALESCE(owner_id, owner::text))
  )
);
CREATE POLICY "documents_org_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'documents' AND public.user_org_folder_ok(name)
);
CREATE POLICY "documents_org_update" ON storage.objects FOR UPDATE TO authenticated USING (
  bucket_id = 'documents' AND public.user_org_folder_ok(name)
);
CREATE POLICY "documents_org_delete" ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id = 'documents' AND (
    public.user_org_folder_ok(name)
    OR COALESCE(owner_id, owner::text) = auth.uid()::text
  )
);

-- Realtime: tables the app subscribes to (src/hooks/useRealtime.ts) plus earlier additions
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'projects','tasks','phases','expenses','events','meetings','branches','documents',
    'generated_documents','form_documents','form_templates','line_item_templates','templates',
    'messages','notifications','team_members','org_members','organizations','leads','photos',
    'profiles','subscriptions','user_roles'
  ] LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    EXCEPTION WHEN duplicate_object OR undefined_table OR undefined_object THEN NULL;
    END;
  END LOOP;
END $$;
