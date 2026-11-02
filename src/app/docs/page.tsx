'use client'

import Link from 'next/link'
import { useState } from 'react'

const SECTIONS = [
  {
    id: 'overview',
    label: 'Overview',
    icon: '⬡',
  },
  {
    id: 'setup',
    label: 'Initial Setup',
    icon: '⚙',
  },
  {
    id: 'auth',
    label: 'Authentication',
    icon: '🔐',
  },
  {
    id: 'subscriptions',
    label: 'Subscriptions & Billing',
    icon: '💳',
  },
  {
    id: 'projects',
    label: 'Projects & Tasks',
    icon: '📁',
  },
  {
    id: 'comms',
    label: 'Communications Hub',
    icon: '💬',
  },
  {
    id: 'client-portal',
    label: 'Client Portal',
    icon: '🔗',
  },
  {
    id: 'team',
    label: 'Team & Orgs',
    icon: '👥',
  },
  {
    id: 'documents',
    label: 'Documents & Estimates',
    icon: '📄',
  },
  {
    id: 'env',
    label: 'Environment Variables',
    icon: '🔑',
  },
  {
    id: 'legal',
    label: 'Legal & Compliance',
    icon: '⚖',
  },
]

function Code({ children }: { children: string }) {
  return (
    <code className="px-1.5 py-0.5 bg-zinc-800 text-emerald-400 rounded text-[13px] font-mono">
      {children}
    </code>
  )
}

function CodeBlock({ children, label }: { children: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(children)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="relative group my-4">
      {label && <p className="text-[11px] text-zinc-500 font-mono mb-1.5 uppercase tracking-wider">{label}</p>}
      <div className="bg-[#0d0d0f] border border-[#27272a] rounded-xl overflow-hidden">
        <pre className="p-4 text-sm text-zinc-300 font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap break-all">
          {children}
        </pre>
        <button
          onClick={copy}
          className="absolute top-3 right-3 px-2.5 py-1 text-[11px] bg-zinc-800 text-zinc-400 hover:text-white rounded-md transition-colors opacity-0 group-hover:opacity-100"
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
    </div>
  )
}

function Note({ children, type = 'info' }: { children: React.ReactNode; type?: 'info' | 'warn' | 'tip' }) {
  const styles = {
    info: 'bg-blue-500/5 border-blue-500/20 text-blue-300',
    warn: 'bg-amber-500/5 border-amber-500/20 text-amber-300',
    tip: 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300',
  }
  const icons = { info: 'ℹ', warn: '⚠', tip: '💡' }
  return (
    <div className={`flex gap-3 border rounded-xl p-4 my-4 text-sm leading-relaxed ${styles[type]}`}>
      <span className="mt-0.5 shrink-0">{icons[type]}</span>
      <div>{children}</div>
    </div>
  )
}

function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="text-2xl font-bold text-white mt-14 mb-6 tracking-[-0.02em] scroll-mt-24">
      {children}
    </h2>
  )
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="text-base font-semibold text-zinc-100 mt-8 mb-3">{children}</h3>
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-zinc-400 leading-[1.85] mb-3">{children}</p>
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 mb-6">
      <div className="shrink-0 w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-400 mt-0.5">
        {n}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white mb-2">{title}</p>
        <div className="text-sm text-zinc-400 leading-[1.85]">{children}</div>
      </div>
    </div>
  )
}

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('overview')

  const scrollTo = (id: string) => {
    setActiveSection(id)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#09090b]/80 backdrop-blur-xl border-b border-white/[0.04]">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-base font-bold tracking-[0.15em] uppercase text-white">Projex</Link>
            <span className="text-zinc-700">/</span>
            <span className="text-sm text-zinc-400">Docs</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/terms" className="text-sm text-zinc-500 hover:text-white transition-colors hidden sm:block">Terms</Link>
            <Link href="/privacy" className="text-sm text-zinc-500 hover:text-white transition-colors hidden sm:block">Privacy</Link>
            <Link href="/login" className="px-4 py-1.5 bg-white text-black rounded-full text-sm font-medium hover:bg-zinc-200 transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 pt-20 flex gap-10">
        {/* Sidebar */}
        <aside className="hidden lg:block w-56 shrink-0 sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto py-8">
          <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest mb-4">Contents</p>
          <nav className="space-y-0.5">
            {SECTIONS.map(s => (
              <button
                key={s.id}
                onClick={() => scrollTo(s.id)}
                className={`w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                  activeSection === s.id
                    ? 'bg-white/[0.06] text-white font-medium'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03]'
                }`}
              >
                <span className="text-base">{s.icon}</span>
                {s.label}
              </button>
            ))}
          </nav>

          <div className="mt-8 pt-6 border-t border-white/[0.04]">
            <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-3">Legal</p>
            <div className="space-y-1">
              <Link href="/terms" className="block text-xs text-zinc-600 hover:text-zinc-400 transition-colors px-3 py-1">Terms of Service</Link>
              <Link href="/privacy" className="block text-xs text-zinc-600 hover:text-zinc-400 transition-colors px-3 py-1">Privacy Policy</Link>
            </div>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0 py-10 pb-24">

          {/* Header */}
          <div className="mb-12">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">Documentation</p>
            <h1 className="text-4xl md:text-5xl font-bold tracking-[-0.03em] mb-4">Projex Docs</h1>
            <p className="text-zinc-400 text-lg leading-relaxed">
              Everything you need to set up, configure, and operate the Projex platform — from database to billing to production deployment.
            </p>
          </div>

          {/* ─── OVERVIEW ─── */}
          <H2 id="overview">Overview</H2>
          <P>Projex is a full-stack B2B SaaS construction management platform built with:</P>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-5">
            {[
              { label: 'Frontend', value: 'Next.js 16 (App Router)' },
              { label: 'Styling', value: 'Tailwind CSS' },
              { label: 'Database', value: 'Supabase (PostgreSQL)' },
              { label: 'Auth', value: 'Supabase Auth' },
              { label: 'Payments', value: 'Stripe' },
              { label: 'Email', value: 'Resend + Nodemailer' },
              { label: 'Deployment', value: 'Vercel' },
              { label: 'PDFs / Docs', value: 'jsPDF + docx' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-[#18181b] border border-[#27272a] rounded-xl p-4">
                <p className="text-[11px] text-zinc-600 uppercase tracking-wider mb-1">{label}</p>
                <p className="text-sm text-white font-medium">{value}</p>
              </div>
            ))}
          </div>
          <P>The platform is organized around a workspace UI where users navigate between cards (Projects, Estimates, Invoices, Team, Communications, etc.). All data is scoped to organizations with row-level security enforced in Supabase.</P>

          {/* ─── SETUP ─── */}
          <H2 id="setup">Initial Setup</H2>
          <H3>1. Clone & Install</H3>
          <CodeBlock label="Terminal">{`git clone https://github.com/yourrepo/projex.git
cd projex
npm install`}</CodeBlock>

          <H3>2. Configure Environment</H3>
          <P>Copy the example env file and fill in your credentials:</P>
          <CodeBlock label="Terminal">{`cp .env.example .env.local`}</CodeBlock>
          <P>See the <strong>Environment Variables</strong> section for the full list of required keys.</P>

          <H3>3. Run Database Migrations</H3>
          <P>Migrations live in <Code>supabase/migrations/</Code> and are applied in timestamp order with the Supabase CLI:</P>
          <CodeBlock label="Terminal">{`supabase link --project-ref <your-project-ref>
npm run db:push     # applies supabase/migrations/* in order
npm run db:types    # regenerates src/types/supabase.ts`}</CodeBlock>
          <Note type="warn">The first file is a baseline of the full production schema. Files in <Code>supabase/legacy/</Code> are history only. Do not run them.</Note>

          <H3>4. Run Locally</H3>
          <CodeBlock label="Terminal">{`npm run dev
# App runs at http://localhost:3000`}</CodeBlock>

          {/* ─── AUTH ─── */}
          <H2 id="auth">Authentication</H2>
          <P>Projex uses Supabase Auth for all user authentication. The auth flow uses email/password with magic link support.</P>

          <H3>How It Works</H3>
          <Step n={1} title="User signs up at /login">
            Supabase creates a user in <Code>auth.users</Code>. A database trigger automatically creates a corresponding record in <Code>public.profiles</Code>.
          </Step>
          <Step n={2} title="Session is maintained via SSR cookies">
            The <Code>@supabase/ssr</Code> package handles session refresh across server and client components. Session state is managed by <Code>AuthContext</Code> (located at <Code>src/context/AuthContext.tsx</Code>).
          </Step>
          <Step n={3} title="Middleware protects routes">
            <Code>src/middleware.ts</Code> validates the session on every request. Unauthenticated users are redirected to <Code>/login</Code>.
          </Step>
          <Step n={4} title="Password reset">
            Users can request a reset link at <Code>/reset-password</Code>. The email flow is handled by Supabase Auth with your configured site URL.
          </Step>

          <H3>Supabase Auth Configuration</H3>
          <P>In your Supabase dashboard → Authentication → URL Configuration:</P>
          <CodeBlock>{`Site URL:       https://projex.live
Redirect URLs:  https://projex.live/**
                http://localhost:3000/**`}</CodeBlock>

          {/* ─── SUBSCRIPTIONS ─── */}
          <H2 id="subscriptions">Subscriptions & Billing</H2>
          <P>Billing is handled entirely through Stripe. The platform supports 4 tiers with monthly and annual billing.</P>

          <H3>Pricing Tiers</H3>
          <div className="overflow-x-auto my-4">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-[#27272a]">
                  {['Plan', 'Monthly', 'Annual/mo', 'Annual billed'].map(h => (
                    <th key={h} className="text-left py-2 px-3 text-xs text-zinc-500 font-semibold uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-zinc-300">
                {[
                  ['Duo', '$19.99', '$16.99', '$203.88'],
                  ['Team', '$49.99', '$41.99', '$503.88'],
                  ['Business', '$99.99', '$83.99', '$1,007.88'],
                  ['Enterprise', '$149.99', '$124.99', '$1,499.88'],
                ].map(([plan, mo, yr, billed]) => (
                  <tr key={plan} className="border-b border-[#1a1a1d]">
                    <td className="py-2.5 px-3 text-white font-medium">{plan}</td>
                    <td className="py-2.5 px-3">{mo}</td>
                    <td className="py-2.5 px-3">{yr}</td>
                    <td className="py-2.5 px-3">{billed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <H3>Stripe Webhook Flow</H3>
          <Step n={1} title="User selects a plan">
            Frontend calls <Code>POST /api/checkout</Code> → Stripe Checkout session is created.
          </Step>
          <Step n={2} title="Payment completes">
            Stripe fires <Code>checkout.session.completed</Code> to <Code>POST /api/webhooks/stripe</Code>.
          </Step>
          <Step n={3} title="Webhook updates database">
            The handler updates <Code>public.subscriptions</Code> with the Stripe customer ID, subscription ID, plan, and status.
          </Step>
          <Step n={4} title="Plan changes & cancellations">
            <Code>customer.subscription.updated</Code> and <Code>customer.subscription.deleted</Code> events sync plan status in real time.
          </Step>

          <Note type="warn">
            Your Stripe webhook endpoint must be set to <Code>https://projex.live/api/webhooks/stripe</Code> in the Stripe dashboard. Verify the <Code>STRIPE_WEBHOOK_SECRET</Code> matches your endpoint signing secret.
          </Note>

          {/* ─── PROJECTS ─── */}
          <H2 id="projects">Projects & Tasks</H2>
          <P>Projects are the core unit of Projex. Each project belongs to an organization and contains tasks, documents, photos, budgets, and schedule data.</P>

          <H3>Project Lifecycle</H3>
          <div className="flex flex-wrap gap-2 my-4">
            {['Lead', 'Estimate Sent', 'Signed', 'In Progress', 'Punch List', 'Completed', 'Invoiced'].map(s => (
              <span key={s} className="px-3 py-1 bg-[#18181b] border border-[#27272a] rounded-full text-xs text-zinc-300">{s}</span>
            ))}
          </div>

          <H3>Key Components</H3>
          <div className="space-y-2 my-4">
            {[
              { file: 'src/components/cards/ProjectsContent.tsx', desc: 'Project list view — kanban and list layout' },
              { file: 'src/components/cards/TasksContent.tsx', desc: 'Task board with status columns and assignments' },
              { file: 'src/components/cards/ScheduleContent.tsx', desc: 'Timeline/Gantt view for project scheduling' },
              { file: 'src/components/cards/BudgetingContent.tsx', desc: 'Budget tracking vs. contract value' },
              { file: 'src/components/cards/PhotosContent.tsx', desc: 'Photo reports with tagging and notes' },
              { file: 'src/components/cards/DrawingsContent.tsx', desc: 'Drawing canvas for field annotations' },
            ].map(({ file, desc }) => (
              <div key={file} className="flex gap-3 items-start">
                <Code>{file.split('/').pop()!}</Code>
                <span className="text-sm text-zinc-500">{desc}</span>
              </div>
            ))}
          </div>

          {/* ─── COMMS ─── */}
          <H2 id="comms">Communications Hub</H2>
          <P>
            The Communications Hub (<Code>CommsHubContent.tsx</Code>) handles outbound email to clients and team. Email is sent through <Code>POST /api/send-email</Code> (SMTP via Nodemailer), which requires a signed-in org member and is rate-limited per organization. Team chat lives in the Messages card.
          </P>

          <H3>Features</H3>
          <ul className="space-y-1.5 my-4">
            {[
              'Compose and send email with Cc',
              'Reusable email templates (invoice, reminder, update, welcome, follow-up)',
              'Bulk send a template to multiple recipients',
            ].map(item => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-zinc-400">
                <span className="text-emerald-500 mt-0.5">✓</span>
                {item}
              </li>
            ))}
          </ul>

          <Note type="info">
            Calls and SMS are coming soon.
          </Note>

          {/* ─── CLIENT PORTAL ─── */}
          <H2 id="client-portal">Client Portal</H2>
          <P>
            Each project has a private portal link at <Code>/portal/[token]</Code>, where the token is a random secret (not the project ID). This gives clients a read-only view of project status, documents, photos, and key milestones without needing a Projex account.
          </P>

          <H3>How It Works</H3>
          <Step n={1} title="Generate portal link">
            From the Client Portals card, a team member copies the link. Owners, admins and managers can reset it to revoke the old one: <Code>https://projex.live/portal/[token]</Code>
          </Step>
          <Step n={2} title="Client views the portal">
            The portal page looks up the project by token on the server and passes only client-facing fields to <Code>ClientPortalView.tsx</Code>: no expenses, costs or margins, and only documents that have been sent, viewed, approved or paid.
          </Step>
          <Step n={3} title="No login required">
            Clients do not need an account. The portal is intentionally lightweight and mobile-friendly.
          </Step>

          {/* ─── TEAM ─── */}
          <H2 id="team">Team & Organizations</H2>
          <P>Projex uses a multi-tenant organization model. Every user belongs to one or more organizations. All data (projects, tasks, documents) is scoped to an organization.</P>

          <H3>Roles</H3>
          <div className="overflow-x-auto my-4">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-[#27272a]">
                  {['Role', 'Permissions'].map(h => (
                    <th key={h} className="text-left py-2 px-3 text-xs text-zinc-500 font-semibold uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-zinc-300">
                {[
                  ['Owner', 'Full access — billing, settings, all data, member management'],
                  ['Admin', 'Manage members, projects, and all content. Cannot change billing.'],
                  ['Member', 'Create and edit projects and tasks. Cannot manage team or billing.'],
                  ['Viewer', 'Read-only access to projects and documents.'],
                ].map(([role, perms]) => (
                  <tr key={role} className="border-b border-[#1a1a1d]">
                    <td className="py-2.5 px-3 text-white font-medium">{role}</td>
                    <td className="py-2.5 px-3 text-zinc-400">{perms}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <H3>Inviting Members</H3>
          <P>
            Owners and admins invite people via <Code>POST /api/invite</Code>, which creates an <Code>org_invites</Code> row and emails a <Code>/invite/[token]</Code> link that is valid for 7 days. The person signs in or signs up from that page and accepts; only then are they added to the org. Pending invites count toward seats and can be resent, revoked or copied from Team → Members. People who belong to several orgs switch between them from the profile menu.
          </P>

          {/* ─── DOCUMENTS ─── */}
          <H2 id="documents">Documents & Estimates</H2>
          <P>Projex can generate professional PDFs and Word documents from project data.</P>

          <H3>Document Types</H3>
          <ul className="space-y-1.5 my-4">
            {[
              'Proposals — generated from ProposalBuilder.tsx using jsPDF',
              'Estimates — line-item breakdowns with markup and totals',
              'Invoices — with payment terms and due dates',
              'Inspection forms — built from InspectionFormBuilder.tsx',
              'Photo reports — timestamped site documentation',
              'Subcontractor agreements — using docx library',
            ].map(item => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-zinc-400">
                <span className="text-zinc-600 mt-1">—</span>
                {item}
              </li>
            ))}
          </ul>

          {/* ─── ENV ─── */}
          <H2 id="env">Environment Variables</H2>
          <P>All environment variables should be set in Vercel → Project Settings → Environment Variables.</P>

          <CodeBlock label=".env.local (full list)">{`# ─── Supabase ───────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...     # Supabase Settings → API → service_role

# ─── Stripe ─────────────────────────────────────────
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Stripe Price IDs (one per plan × billing period)
STRIPE_PRICE_DUO_MONTHLY=price_...
STRIPE_PRICE_DUO_ANNUAL=price_...
STRIPE_PRICE_TEAM_MONTHLY=price_...
STRIPE_PRICE_TEAM_ANNUAL=price_...
STRIPE_PRICE_BUSINESS_MONTHLY=price_...
STRIPE_PRICE_BUSINESS_ANNUAL=price_...
STRIPE_PRICE_ENTERPRISE_MONTHLY=price_...
STRIPE_PRICE_ENTERPRISE_ANNUAL=price_...

# ─── Email ───────────────────────────────────────────
RESEND_API_KEY=re_...
SMTP_HOST=smtp.your-provider.com    # If using Nodemailer
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=your_password

# ─── App ─────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=https://projex.live`}</CodeBlock>

          <Note type="warn">
            Never commit <Code>.env.local</Code> to version control. The <Code>.gitignore</Code> already excludes it, but double-check before pushing.
          </Note>

          {/* ─── LEGAL ─── */}
          <H2 id="legal">Legal & Compliance</H2>
          <P>Projex maintains the following legal pages required for app store submissions and general business operation.</P>

          <div className="space-y-3 my-4">
            {[
              {
                label: 'Terms of Service',
                url: '/terms',
                desc: 'User agreement covering acceptable use, billing, IP, and liability.',
              },
              {
                label: 'Privacy Policy',
                url: '/privacy',
                desc: 'Data collection, use, retention, and opt-out disclosures. Required for App Store.',
              },
            ].map(({ label, url, desc }) => (
              <div key={label} className="bg-[#18181b] border border-[#27272a] rounded-xl p-5 flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <p className="text-white font-semibold text-sm">{label}</p>
                    <span className="text-zinc-600 text-xs font-mono">{url}</span>
                  </div>
                  <p className="text-sm text-zinc-400">{desc}</p>
                </div>
                <Link
                  href={url}
                  className="shrink-0 px-3 py-1.5 text-xs bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white rounded-lg transition-colors"
                >
                  View →
                </Link>
              </div>
            ))}
          </div>

        </main>
      </div>

      {/* Footer */}
      <div className="border-t border-white/[0.04] px-6 py-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-zinc-600">© {new Date().getFullYear()} Projex. All rights reserved.</p>
          <div className="flex items-center gap-6 text-xs text-zinc-500">
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
