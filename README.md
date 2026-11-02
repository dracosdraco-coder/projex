# Projex

Project management and CRM SaaS for construction and service businesses.

## Stack

- Next.js 16 (App Router), React 18, TypeScript, Tailwind CSS
- Supabase: Postgres, Auth, Row Level Security, Storage
- Stripe: subscriptions and add-ons
- Nodemailer: SMTP email
- Google Calendar and QuickBooks OAuth integrations
- Deployed on Vercel

## Layout

```
src/app/page.tsx          Marketing landing page
src/app/access/           Main app (auth-protected spatial canvas / window manager)
src/app/api/              API routes (Stripe, email, invites, integrations)
src/app/portal/           Public client portal
src/components/cards/     One component per app card (Projects, Tasks, Documents, ...)
src/hooks/                Data fetching and state (Supabase queries live here)
src/lib/stripe-plans.ts   Plans and feature gating
src/middleware.ts         Supabase SSR session refresh and route protection
supabase-schema.sql       Base schema
supabase/                 Migrations
```

## Running locally

```bash
npm install
cp .env.example .env.local
npm run dev
```
