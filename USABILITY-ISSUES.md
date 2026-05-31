# PROJEX — Usability Issues & Revision Backlog
**Created:** May 28, 2026
**Updated:** May 28, 2026

---

## PRIORITY 1 — Landing Page (Blocking)

### [LP-01] Logged-in users can't access the landing page
**Issue:** `src/app/page.tsx` auto-redirects authenticated users to `/access` immediately. Users cannot view pricing, share the landing URL, or return to the marketing page while signed in.
**Fix:** Remove the auth redirect from the landing page. The landing page should always render. Nav should show "Go to app →" when user is signed in instead of "Sign in / Get started".
**File:** `src/app/page.tsx` lines 81, `src/middleware.ts`

### [LP-02] Landing page background is black — should be white
**Issue:** The entire landing page uses `bg-[#09090b]` (near-black). The new design direction is a clean white/light background.
**Fix:** Full redesign required. See LP-03 for the new design spec.
**File:** `src/app/page.tsx`

### [LP-03] Landing page needs full redesign — scroll-triggered browser zoom
**Issue:** Current design is a static dark page. New design:
- White background, minimal
- "PROJEX" logo centered on screen at load
- Navigation: centered at top, no border/box styling, text links only
- Hero: As user scrolls, a browser-chrome mockup appears small/centered and scales up proportionally (zoom-in effect) revealing the live app UI inside
- The mockup should show real Projex window cards (Dashboard, Projects, Messages, etc.)
- Below the browser zoom: feature highlights, pricing, social proof — all on white
**Status:** Design approved verbally — implementation pending

### [LP-04] No Solutions page
**Issue:** Missing. Should cover use cases by business type (roofing, electrical, GC, etc.) and how Projex solves their specific problems.

### [LP-05] No Documentation page
**Issue:** `/docs` exists but is likely a placeholder. Needs real content: getting started, features, API reference basics.
**File:** `src/app/docs/page.tsx`

### [LP-06] No References / Use Cases page
**Issue:** Missing. Should show logos of companies using Projex + brief case study snippets. Logo slots are ready to fill in.

### [LP-07] Footer links are dead
**Issue:** Most footer links (`About`, `Contact`, `Security`, social links, `Changelog`) point to `#` and do nothing.
**File:** `src/app/page.tsx` footer section

### [LP-08] Nav links don't connect to new pages
**Issue:** Nav only has Features, Pricing, Add-ons (anchor scrolls). Once Solutions/Docs/References pages exist, nav needs updating.

---

## PRIORITY 2 — Content Management

### [CMS-01] No way to edit landing page content without code
**Issue:** All copy, testimonials, pricing, FAQ, add-ons are hardcoded in `src/app/page.tsx`. Non-technical editing requires VS Code.
**Options under consideration:**
- A. Sanity CMS (headless, real-time, has a free tier)
- B. Notion as CMS (simplest — content lives in Notion, fetched at build time)
- C. Supabase-backed admin panel (stays in our stack, no third-party)
- D. Simple JSON/markdown files in repo (version-controlled but still needs git)
**Decision needed:** Which approach fits the workflow.

---

## PRIORITY 3 — App / Integrations

### [APP-01] Integration audit needed
**Issue:** Google Calendar, QuickBooks, Twilio, and Stripe integrations exist as API routes but need end-to-end testing. Unknown which are fully functional vs. scaffolded.
**Files:** `src/app/api/integrations/`

### [APP-02] Integrations should match the app's tone and concept
**Issue:** Each integration needs to feel native — not bolted on. UI for connecting/disconnecting integrations, status indicators, and sync feedback need consistency.
**File:** `src/components/cards/IntegrationsContent.tsx`

### [APP-03] No clear onboarding flow after signup
**Issue:** A new user lands on a blank spatial canvas with no guidance. Onboarding component exists (`src/components/Onboarding.tsx`) but unclear if it's wired up properly.

### [APP-04] Window canvas starts empty — no default layout
**Issue:** New users see a blank dotted canvas. Default window positions/layout would reduce the "now what?" moment on first load.

### [APP-05] Revenue Collected shows $11,755 but Contract Value is $4,125
**Issue:** Visible in screenshots — Revenue Collected is higher than Contract Value which may indicate a data calculation issue in the Dashboard. Needs audit.
**File:** `src/components/cards/DashboardContent.tsx`

### [APP-06] Charts show no data / dashed placeholder
**Issue:** "Revenue Over Time" and "Expense Breakdown" charts render but appear empty (dashed lines only). Either no data exists or the charts aren't connected to real data.
**File:** `src/components/cards/DashboardContent.tsx`

---

## PRIORITY 4 — Software Feature Changes
*(To be detailed in next session)*

### [FEAT-01] Feature list TBD
Items to be discussed and added based on Ethan's list.

---

## Resolved Issues

- [ENV-01] `.env.example` only had 2 of 21 required vars → Fixed May 28, 2026
- [ENV-02] No `CLAUDE.md` context file → Created May 28, 2026
- [LP-01] Logged-in users auto-redirected away from landing page → Fixed May 28, 2026 (removed redirect; nav shows "Open app →" when signed in)
- [LP-02] Dark black background on landing page → Fixed May 28, 2026 (full redesign to white)
- [LP-03] No scroll-triggered browser zoom effect → Implemented May 28, 2026 (animated CSS mockup, scales 30%→100% on scroll)
- [LP-04] No Solutions page → Created May 28, 2026 (`/solutions`)
- [LP-05] Docs page was a placeholder → Existing detailed docs page kept; linked from nav
- [LP-06] No References page → Created May 28, 2026 (`/references`, ready for client logos)
- [LP-07] No About page → Created May 28, 2026 (`/about`)
- [LP-08] Nav only had anchor links → Updated with Solutions, Docs, References links
