# PROJEX — Change Log

---

## Session: May 28, 2026 — Environment + Project Setup
**Status:** ✅ Complete

### Done
- Created `CLAUDE.md` — full codebase context document for AI-assisted development
- Expanded `.env.example` from 2 vars to 21 (Supabase, Stripe × 8 price IDs, SMTP, Twilio, Google OAuth, QuickBooks OAuth)
- Pulled production env vars from Vercel → `.env.local` via `vercel env pull`
- Confirmed `.gitignore` correctly excludes `.env` and `.env*.local`

---

## Session: May 28, 2026 — Usability Audit + Landing Page Revision Plan
**Status:** 🔄 In Progress

### Issues Identified
See `USABILITY-ISSUES.md` for full list.

### Planned Changes
- Landing page: remove auto-redirect for logged-in users (always accessible)
- Landing page: full redesign — white background, centered logo, scroll-triggered browser zoom effect
- New pages: Solutions, Documentation, References/Use Cases
- CMS integration for content editing without code
- App integration audit and refinement
- Software feature changes (tracked separately)

---

## Version 1.0 — Clean Build
**Date:** January 28, 2026
**Status:** ✅ Authentication Fixed & Working

### Critical Fixes

**#1 — Dual Auth System Conflict**
Removed NextAuth + Prisma entirely. Migrated to pure Supabase auth.
Files: `package.json`, `src/middleware.ts`, `src/context/AuthContext.tsx`, `src/app/access/page.tsx`, `src/components/ui/UserProfileDropdown.tsx`
Deleted: `prisma/`, `src/lib/auth.ts`, `src/lib/prisma.ts`, NextAuth API routes, SessionProvider, SessionCheck, next-auth types

**#2 — Env Var Formatting**
Removed spaces after `=` signs in `.env.local`.

**#3 — Database Schema Missing**
Created `supabase-schema.sql` with 9 tables, RLS policies, auto profile creation trigger, indexes.
Tables: projects, project_phases, tasks, expenses, meetings, documents, profiles, branches, templates

**#4 — Access Page Using NextAuth**
Converted `/access` to client component using `useAuth()` from Supabase context.

**#5 — Router Redirect Not Working**
Replaced `router.push('/access')` with `window.location.href = '/access'` for reliable post-login navigation.

**#6 — Middleware Too Complex**
Simplified middleware — client handles auth state.

**#7 — Root Page Auth Redirect**
Added auto-redirect: logged-in users on `/` → `/access`.
*(Flagged for reversal — landing page should always be accessible regardless of auth state.)*

**#8 — User State Not Updating After Login**
Added manual `setUser(data.user)` after signIn to ensure immediate state update.

### Dependencies Removed
`next-auth`, `@next-auth/prisma-adapter`, `prisma`, `@prisma/client`, `bcrypt`, `@types/bcrypt`, `tsx`

### Dependencies Added
`@supabase/ssr`, `@supabase/supabase-js`

---
