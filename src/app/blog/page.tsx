import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog — Projex | Construction Management Tips & Insights',
  description: 'Expert tips on construction project management, estimating, invoicing, and growing your contracting business in South Florida.',
}

const ARTICLES = [
  {
    slug: 'how-to-estimate-a-roofing-project',
    title: 'How to Estimate a Roofing Project in 2026',
    excerpt: 'A step-by-step guide to building accurate roofing estimates — from material takeoffs to markup strategy.',
    category: 'Estimating',
    date: '2026-03-20',
    readTime: '8 min',
  },
  {
    slug: 'miami-dade-hvhz-permit-guide',
    title: 'Miami-Dade HVHZ Permitting: The Complete Guide',
    excerpt: 'Everything you need to know about High Velocity Hurricane Zone permits, NOA requirements, and RAS 127 compliance.',
    category: 'Permits',
    date: '2026-03-15',
    readTime: '12 min',
  },
  {
    slug: 'construction-invoicing-best-practices',
    title: '5 Invoicing Mistakes That Cost Contractors Thousands',
    excerpt: 'Common invoicing errors that delay payments and how to fix them with proper documentation.',
    category: 'Finance',
    date: '2026-03-10',
    readTime: '6 min',
  },
  {
    slug: 'managing-subcontractors-effectively',
    title: 'How to Manage Subcontractors Without the Headache',
    excerpt: 'Build reliable sub relationships with clear contracts, milestone tracking, and real-time communication.',
    category: 'Management',
    date: '2026-03-05',
    readTime: '7 min',
  },
  {
    slug: 'client-communication-for-contractors',
    title: 'Client Communication: The Contractor\'s Secret Weapon',
    excerpt: 'How automated updates and client portals can reduce callbacks, disputes, and scope creep.',
    category: 'Growth',
    date: '2026-02-28',
    readTime: '5 min',
  },
  {
    slug: 'construction-project-management-software-comparison',
    title: 'Projex vs Buildertrend vs Jobber: 2026 Comparison',
    excerpt: 'An honest comparison of construction management platforms — features, pricing, and which one fits your business.',
    category: 'Tools',
    date: '2026-02-20',
    readTime: '10 min',
  },
]

const CATEGORY_COLORS: Record<string, string> = {
  Estimating: 'text-blue-400 bg-blue-500/10',
  Permits: 'text-orange-400 bg-orange-500/10',
  Finance: 'text-green-400 bg-green-500/10',
  Management: 'text-purple-400 bg-purple-500/10',
  Growth: 'text-pink-400 bg-pink-500/10',
  Tools: 'text-cyan-400 bg-cyan-500/10',
}

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-[#09090b] text-white">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#09090b]/80 backdrop-blur-xl border-b border-white/[0.04]">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold tracking-[0.15em] uppercase text-white">Projex</Link>
          <div className="flex items-center gap-6">
            <Link href="/#pricing" className="text-sm text-zinc-400 hover:text-white transition-colors">Pricing</Link>
            <Link href="/docs" className="text-sm text-zinc-400 hover:text-white transition-colors">Docs</Link>
            <Link href="/login" className="px-4 py-1.5 bg-white text-black rounded-full text-sm font-medium hover:bg-zinc-200 transition-colors">Sign In</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 pt-28 pb-20">
        <h1 className="text-4xl md:text-5xl font-bold tracking-[-0.03em] mb-3">Blog</h1>
        <p className="text-zinc-400 text-lg mb-12">Tips, guides, and insights for construction professionals.</p>

        <div className="space-y-6">
          {ARTICLES.map(article => (
            <Link key={article.slug} href={`/blog/${article.slug}`}
              className="block bg-[#18181b] border border-[#27272a] rounded-2xl p-6 hover:border-zinc-600 transition-all group">
              <div className="flex items-center gap-3 mb-3">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[article.category] || 'text-zinc-400 bg-zinc-800'}`}>
                  {article.category}
                </span>
                <span className="text-[11px] text-zinc-500">{new Date(article.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                <span className="text-[11px] text-zinc-600">{article.readTime} read</span>
              </div>
              <h2 className="text-xl font-semibold text-white group-hover:text-zinc-200 transition-colors mb-2">{article.title}</h2>
              <p className="text-sm text-zinc-400 leading-relaxed">{article.excerpt}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Footer CTA */}
      <div className="border-t border-white/[0.04] px-6 py-16 text-center">
        <h2 className="text-2xl font-bold text-white mb-3">Ready to streamline your operation?</h2>
        <p className="text-zinc-400 mb-6">Start your 14-day free trial. No credit card required.</p>
        <Link href="/login" className="inline-block px-8 py-3 bg-white text-black rounded-full font-semibold hover:bg-zinc-200 transition-colors">
          Get Started Free →
        </Link>
      </div>
      <div className="border-t border-white/[0.04] px-6 py-8">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-zinc-600">&copy; {new Date().getFullYear()} Projex. All rights reserved.</p>
          <div className="flex items-center gap-6 text-xs text-zinc-500">
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
          </div>
        </div>
      </div>
    </main>
  )
}
