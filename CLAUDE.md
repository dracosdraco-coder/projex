# Projex — Internal CRM / Project Management SaaS

## What this is

Projex is a construction/service-business project management SaaS. It has two surfaces:
- **Landing page** (`src/app/page.tsx`) — marketing site with plans, add-ons, testimonials, FAQ, comparison table
- **App** (`src/app/access/`) — the full internal CRM, loaded after auth

## Tech stack

- **Framework**: Next.js 16 (App Router)
- **Auth + DB**: Supabase (PostgreSQL, Row Level Security, SSR client)
- **Billing**: Stripe (subscriptions + add-ons, webhook at `/api/webhooks/stripe`)
- **Email**: Nodemailer (SMTP)
- **VoIP / SMS**: Twilio
- **Integrations**: Google Calendar OAuth, QuickBooks OAuth
- **Styling**: Tailwind CSS v3
- **Charts**: Recharts
- **PWA**: service worker (`public/sw.js`), manifest (`public/manifest.json`)
- **Fonts**: DM Sans (body), JetBrains Mono (mono/numbers) — loaded inline in landing page

## Project structure

```
src/
  app/
    page.tsx              # Landing page (marketing)
    layout.tsx            # Root layout — wraps everything in AuthProvider
    access/               # Main app shell (protected)
      page.tsx            # Auth guard → renders AccessClient
      AccessClient.tsx    # Spatial canvas / window manager / all cards
    api/
      checkout/           # Stripe checkout session
      addon-checkout/     # Stripe add-on checkout
      billing-portal/     # Stripe customer portal
      webhooks/stripe/    # Stripe webhook handler
      send-email/         # Nodemailer SMTP
      voip/               # Twilio SMS + calls
      invite/             # Team member invite emails
      referrals/          # Referral tracking
      integrations/
        google/           # Google Calendar OAuth flow
        quickbooks/       # QuickBooks OAuth flow
    login/                # Auth page (sign in / sign up)
    portal/[projectId]/   # Public client portal
    blog/ docs/ privacy/ terms/ reset-password/
  components/
    cards/                # One component per "card" type (Dashboard, Projects, Tasks, etc.)
    windows/              # Dock + Window (draggable/resizable window manager)
    ui/                   # Shared UI: Modal, Toast, FilterBar, Logo, etc.
    [feature modals]      # DocumentEditor, ProposalBuilder, TaskBoard, etc.
  context/
    AuthContext.tsx        # Supabase auth state (user, signIn, signUp, signOut, etc.)
    FileContext.tsx
  hooks/
    useData.ts            # Main data hook — projects, expenses, team, meetings, branches
    useWindowManager.ts   # Spatial canvas window state
    useCanvas.ts          # Canvas pan/zoom
    useSubscription.ts    # Stripe plan + feature gating
    useOrg.tsx            # Org/multi-tenant management
    [other hooks]
  lib/
    supabase.ts           # Browser client
    supabase-server.ts    # Server middleware client (SSR session refresh)
    stripe-plans.ts       # Plan config, feature flags, plan hierarchy
    pdf-generator.ts      # jsPDF document export
    document-converter.ts # docx export
    utils.ts
  middleware.ts           # Session refresh on every request (Supabase SSR pattern)
  types/                  # TypeScript types
```

## Auth flow

1. Middleware (`src/middleware.ts`) calls `updateSession` on every non-static request.
2. Unauthenticated users hitting protected routes → redirect to `/login`.
3. Authenticated users hitting `/login` → redirect to `/access`.
4. `AuthContext` provides `user` state client-side via `supabase.auth.getSession()`.

## Plan / feature gating

Defined in `src/lib/stripe-plans.ts`:
- Plans: `duo` → `team` → `business` → `enterprise`
- `CARD_PLAN_REQUIREMENTS` maps each card type to its minimum plan
- `meetsMinimumPlan()` checks access; `canAccess()` checks feature strings
- Stripe price IDs are resolved server-side from env vars (`STRIPE_PRICE_<PLAN>_<INTERVAL>`)

## Database

Schema lives in `supabase-schema.sql` + migration files in `supabase/`.
Apply via Supabase SQL Editor. Key tables: profiles, projects, tasks, expenses,
team_members, meetings, branches, subscriptions, organizations.

## Environment variables

See `.env.example` for the full list. Never commit `.env` or `.env.local`.
The `.gitignore` already excludes both.

## Development

```bash
npm install
cp .env.example .env.local   # fill in your values
npm run dev                   # http://localhost:3000
```

## Key conventions

- All data fetching is in custom hooks under `src/hooks/`
- No mock data is used in production paths — `src/data/mockData.ts` is for dev only
- Cards in the spatial canvas are rendered by `AccessClient.tsx` which maps card types to components
- The landing page and the app share the same Next.js app but have completely separate UI stacks (landing is dark/zinc, app uses a theme toggle)
- Stripe price IDs are **never** hardcoded — always read from env vars at runtime

## Current status (as of May 2026)

- Auth, DB, billing, and core features are working (beta)
- Landing page and app are both in active revision
- Areas under active work: landing page copy/design refresh, CRM feature completeness
