import Link from 'next/link'
import type { Metadata } from 'next'

// Article content database
const ARTICLES: Record<string, { title: string; category: string; date: string; readTime: string; content: string }> = {
  'how-to-estimate-a-roofing-project': {
    title: 'How to Estimate a Roofing Project in 2026',
    category: 'Estimating',
    date: '2026-03-20',
    readTime: '8 min',
    content: `
## Start With a Proper Site Assessment

Before you open any estimating software, you need boots on the roof. A thorough site assessment is the foundation of every accurate estimate. Measure the roof area, identify the pitch, note any penetrations (vents, skylights, chimneys), and document the current condition with photos.

For South Florida contractors, pay special attention to HVHZ (High Velocity Hurricane Zone) requirements if the property falls within Miami-Dade or Broward County. This affects material selection, fastening schedules, and ultimately your pricing.

## Material Takeoff

Your material takeoff should include:

- **Roofing material** — shingles, tiles, metal panels, or modified bitumen. Calculate squares (1 square = 100 sq ft) plus 10-15% waste factor
- **Underlayment** — required by code, often self-adhering in HVHZ zones
- **Fasteners** — ring-shank nails, screws for metal, or adhesive per manufacturer specs
- **Flashing** — drip edge, valley, step flashing, pipe boots
- **Ridge and hip** — specialty pieces for ridge caps and hip closures
- **Accessories** — starter strip, ice & water shield if applicable

## Labor Estimation

Labor depends on complexity, not just area. A simple 20-square gable roof is faster than a 15-square hip roof with multiple valleys. Factor in:

- **Tear-off** — typically 1-2 hours per square for a standard shingle roof
- **Installation** — 1-3 hours per square depending on material type
- **Crew size** — a 4-person crew moves differently than a 2-person crew
- **Access** — multi-story buildings, steep pitches, or difficult access add time

## Markup Strategy

Your markup needs to cover overhead AND profit. A common mistake is marking up just enough to cover costs. Include:

- **Overhead** — insurance, vehicle, office, marketing (typically 15-25%)
- **Profit** — your actual take-home (10-20%)
- **Contingency** — unexpected issues (5-10%)

For a $15,000 material and labor cost, a 40% total markup puts your bid at $21,000. That's $6,000 to cover your business and pay yourself.

## Using Projex for Estimates

With Projex, you can build estimates directly from the field. Add line items with quantities, costs, and markup percentages. The system auto-calculates totals and generates a professional PDF you can email to the client before you leave the job site.

The key is speed — the first contractor to deliver a clean, professional estimate usually wins the job.
    `,
  },
  'miami-dade-hvhz-permit-guide': {
    title: 'Miami-Dade HVHZ Permitting: The Complete Guide',
    category: 'Permits',
    date: '2026-03-15',
    readTime: '12 min',
    content: `
## What is HVHZ?

The High Velocity Hurricane Zone encompasses Miami-Dade and Broward counties in South Florida. Properties in this zone are subject to stricter building codes designed to withstand Category 5 hurricane winds (up to 175+ mph).

For roofing contractors, this means every component of your installation must meet specific wind resistance requirements documented through NOA (Notice of Acceptance) approvals.

## NOA Requirements

Every roofing product used in HVHZ must have a valid NOA issued by Miami-Dade County. This includes:

- Roof covering (shingles, tiles, metal panels)
- Underlayment
- Fasteners
- Adhesives
- Flashing components

Before bidding a job, verify that your preferred materials have current NOAs. Expired or missing NOAs will cause permit rejection and inspection failure.

## RAS 127 Wind Pressure Calculations

RAS 127 (Roofing Application Standard) requires wind pressure calculations based on the specific building location, height, and exposure category. You'll need:

- **Building height** — measured to the mean roof height
- **Exposure category** — B (suburban), C (open terrain), or D (coastal)
- **Wind speed** — per the Florida Building Code wind map
- **Roof zones** — Field, Edge, and Corner each have different pressure requirements

The calculated pressures determine which products can be used in each zone and what fastening pattern is required.

## The Permit Process

1. Submit your application with NOA documentation for all materials
2. Include RAS 127 calculations showing your system meets wind requirements
3. Provide a signed and sealed engineering letter if required by jurisdiction
4. Pay permit fees (typically $200-$500 depending on project scope)
5. Wait for approval (3-10 business days in most jurisdictions)

## Common Rejection Reasons

- Expired NOA documents
- Missing RAS 127 calculations
- Incorrect product combinations (underlayment not tested with chosen roof covering)
- Incomplete application (missing contractor license, insurance certificates)

## How Projex Helps

Store your NOA documents, calculation templates, and permit checklists in Projex. Create a permit checklist template you can reuse for every HVHZ job, ensuring nothing gets missed.
    `,
  },
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const article = ARTICLES[slug]
  if (!article) return { title: 'Article Not Found — Projex' }
  return {
    title: `${article.title} — Projex Blog`,
    description: article.content.substring(0, 160).replace(/[#\n]/g, '').trim(),
  }
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const article = ARTICLES[slug]

  if (!article) {
    return (
      <main className="min-h-screen bg-[#09090b] text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Article not found</h1>
          <Link href="/blog" className="text-blue-400 hover:underline text-sm">← Back to blog</Link>
        </div>
      </main>
    )
  }

  // Simple markdown-like rendering
  const renderContent = (content: string) => {
    return content.split('\n').map((line, i) => {
      const trimmed = line.trim()
      if (!trimmed) return <br key={i} />
      if (trimmed.startsWith('## ')) return <h2 key={i} className="text-xl font-bold text-white mt-8 mb-3">{trimmed.replace('## ', '')}</h2>
      if (trimmed.startsWith('- **')) {
        const match = trimmed.match(/- \*\*(.+?)\*\*(.*)/)
        if (match) return <li key={i} className="text-zinc-400 text-[15px] leading-relaxed ml-4 mb-1.5"><strong className="text-zinc-200">{match[1]}</strong>{match[2]}</li>
      }
      if (trimmed.startsWith('- ')) return <li key={i} className="text-zinc-400 text-[15px] leading-relaxed ml-4 mb-1">{trimmed.replace('- ', '')}</li>
      if (/^\d+\./.test(trimmed)) return <li key={i} className="text-zinc-400 text-[15px] leading-relaxed ml-4 mb-1.5 list-decimal">{trimmed.replace(/^\d+\.\s/, '')}</li>
      return <p key={i} className="text-zinc-400 text-[15px] leading-relaxed mb-4">{trimmed}</p>
    })
  }

  return (
    <main className="min-h-screen bg-[#09090b] text-white">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#09090b]/80 backdrop-blur-xl border-b border-white/[0.04]">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold tracking-[0.15em] uppercase text-white">Projex</Link>
          <Link href="/login" className="px-4 py-1.5 bg-white text-black rounded-full text-sm font-medium hover:bg-zinc-200 transition-colors">Start Free Trial</Link>
        </div>
      </nav>

      <article className="max-w-3xl mx-auto px-6 pt-28 pb-20">
        <Link href="/blog" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors mb-6 inline-block">← Back to blog</Link>

        <div className="flex items-center gap-3 mb-4">
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-blue-400 bg-blue-500/10">{article.category}</span>
          <span className="text-[11px] text-zinc-500">{new Date(article.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          <span className="text-[11px] text-zinc-600">{article.readTime} read</span>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold tracking-[-0.02em] text-white mb-8 leading-tight">{article.title}</h1>

        <div className="prose-projex">
          {renderContent(article.content)}
        </div>

        {/* CTA */}
        <div className="mt-16 bg-[#18181b] border border-[#27272a] rounded-2xl p-8 text-center">
          <h3 className="text-xl font-bold text-white mb-2">Try Projex free for 14 days</h3>
          <p className="text-zinc-400 text-sm mb-6">No credit card required. Build estimates, manage projects, and invoice clients — all in one platform.</p>
          <Link href="/login" className="inline-block px-8 py-3 bg-white text-black rounded-full font-semibold hover:bg-zinc-200 transition-colors">
            Start Free Trial →
          </Link>
        </div>
      </article>
    </main>
  )
}
