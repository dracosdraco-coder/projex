# Projex — Complete Setup Guide

## Step 1: Supabase Database Schema

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Paste and run the contents of `supabase/migrations/003_subscriptions.sql`
3. This creates:
   - `profiles` table (user info, plan)
   - `subscriptions` table (Stripe sync, billing status)
   - Auto-trigger that creates both records on signup
   - RLS policies for security

## Step 2: Stripe Setup

### Create Products & Prices

1. Go to **stripe.com/dashboard** → **Products**
2. Create 4 products with the following prices:

| Product      | Monthly   | Annual (per month) | Annual (billed) |
|-------------|-----------|-------------------|-----------------|
| Duo         | $19.99/mo | $16.99/mo         | $203.88/yr      |
| Team        | $49.99/mo | $41.99/mo         | $503.88/yr      |
| Business    | $99.99/mo | $83.99/mo         | $1,007.88/yr    |
| Enterprise  | $149.99/mo| $124.99/mo        | $1,499.88/yr    |

3. For each product, create TWO prices:
   - Recurring → Monthly
   - Recurring → Yearly (use the annual billed amount)

4. Copy the **Price IDs** (e.g., `price_1Qx...`) for each

### Configure Webhook

1. Go to **Developers** → **Webhooks** → **Add endpoint**
2. URL: `https://projex.live/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. Copy the **Webhook Signing Secret** (`whsec_...`)

### Get API Keys

1. Go to **Developers** → **API Keys**
2. Copy **Secret Key** (`sk_live_...`) — KEEP SECRET
3. Copy **Publishable Key** (`pk_live_...`)

## Step 3: Vercel Environment Variables

Go to **Vercel Dashboard** → your project → **Settings** → **Environment Variables**

Add ALL of these:

```
# Supabase (you should already have these)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   ← NEW: get from Supabase Settings → API → service_role

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Stripe Price IDs (get from Step 2)
STRIPE_PRICE_DUO_MONTHLY=price_...
STRIPE_PRICE_DUO_ANNUAL=price_...
STRIPE_PRICE_TEAM_MONTHLY=price_...
STRIPE_PRICE_TEAM_ANNUAL=price_...
STRIPE_PRICE_BUSINESS_MONTHLY=price_...
STRIPE_PRICE_BUSINESS_ANNUAL=price_...
STRIPE_PRICE_ENTERPRISE_MONTHLY=price_...
STRIPE_PRICE_ENTERPRISE_ANNUAL=price_...

# App URL
NEXT_PUBLIC_APP_URL=https://projex.live
```

**IMPORTANT**: The `SUPABASE_SERVICE_ROLE_KEY` is different from the anon key.
Find it in Supabase → Settings → API → `service_role` (secret).
This is needed for the webhook to write to the database.

## Step 4: GoDaddy Domain → Vercel

1. In **Vercel** → your project → **Settings** → **Domains**
2. Add `projex.live` and `www.projex.live`
3. Vercel gives you DNS records (usually CNAME or A records)
4. In **GoDaddy** → **DNS Management** for projex.live:
   - Delete existing A records
   - Add: `A` record → `@` → `76.76.21.21` (Vercel's IP)
   - Add: `CNAME` record → `www` → `cname.vercel-dns.com`
5. Wait 5-30 minutes for DNS propagation

## Step 5: Supabase Auth URLs

1. Go to **Supabase** → **Authentication** → **URL Configuration**
2. Set **Site URL**: `https://projex.live`
3. Add **Redirect URLs**:
   - `https://projex.live/**`
   - `https://www.projex.live/**`
   - `http://localhost:3000/**` (for local dev)

## Step 6: Microsoft 365 Email (for projex.live)

### DNS Records for M365

In **GoDaddy DNS** for projex.live, add:

1. **MX Record**: `@` → `projex-live.mail.protection.outlook.com` (priority 0)
2. **TXT Record**: `@` → `v=spf1 include:spf.protection.outlook.com -all`
3. **CNAME**: `autodiscover` → `autodiscover.outlook.com`

### Create Email Addresses

In **Microsoft 365 Admin Center**:
- `hello@projex.live` — customer-facing
- `support@projex.live` — support
- `billing@projex.live` — billing notifications
- `noreply@projex.live` — transactional emails

### SMTP for App Emails (future)

To send emails from the app (invites, notifications):
- SMTP Server: `smtp.office365.com`
- Port: 587 (TLS)
- Username: `noreply@projex.live`
- Password: (the M365 account password)
- Add these as env vars when you build the email feature

## Step 7: Test the Flow

### Test Stripe (use test mode first!)

1. Switch Stripe to **Test Mode** (toggle in dashboard)
2. Use test card: `4242 4242 4242 4242`, any future date, any CVC
3. Use test env vars (`sk_test_...`, `pk_test_...`, etc.)
4. Test the full flow:
   - Visit projex.live → click "Start free trial"
   - Sign up → redirected to Stripe Checkout
   - Complete payment with test card
   - Redirected back to /access
   - Check Supabase `subscriptions` table — should show `trialing`

### Go Live

1. Switch Stripe to **Live Mode**
2. Replace all test keys with live keys in Vercel env vars
3. Create a new live webhook endpoint
4. Redeploy

## Architecture Summary

```
User visits projex.live
  ↓
Landing page (/) — no auth needed
  ↓
Click "Start free trial" → /login (Supabase auth)
  ↓
After signup → /api/checkout (creates Stripe session)
  ↓
Stripe Checkout (hosted by Stripe — handles card, billing)
  ↓
Success → /access?checkout=success
  ↓
Meanwhile: Stripe webhook → /api/webhooks/stripe
  → Updates Supabase `subscriptions` table
  → Updates `profiles.plan`
  ↓
/access checks subscription → renders app or paywall
```

## File Reference

| File | Purpose |
|------|---------|
| `src/app/page.tsx` | Landing page with pricing |
| `src/app/api/checkout/route.ts` | Creates Stripe Checkout sessions |
| `src/app/api/webhooks/stripe/route.ts` | Handles Stripe events |
| `src/app/api/subscription/route.ts` | Returns user's subscription status |
| `src/lib/stripe-plans.ts` | Plan config, feature gating, limits |
| `src/hooks/useSubscription.ts` | Frontend subscription hook |
| `src/components/cards/SettingsContent.tsx` | Account/billing UI |
| `supabase/migrations/003_subscriptions.sql` | Database schema |
