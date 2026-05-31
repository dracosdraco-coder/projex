import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Solutions — Projex',
  description: 'Projex for roofing, electrical, general contractors, and every service business in between.',
}

const SOLUTIONS = [
  { title: 'General Contractors', desc: 'Manage multiple subcontractors, phases, and budgets across complex builds. Keep everything coordinated on one canvas.', icon: '🏗️' },
  { title: 'Roofing Companies', desc: 'Estimate jobs, schedule crews, and invoice clients — all from the job site. Photo reports included.', icon: '🏠' },
  { title: 'Electrical & Plumbing', desc: 'Track change orders, manage labor costs, and keep clients updated with real-time project portals.', icon: '⚡' },
  { title: 'Landscaping', desc: 'Schedule recurring work, route crews efficiently, and generate professional quotes in minutes.', icon: '🌿' },
  { title: 'Property Management', desc: 'Manage maintenance requests, vendors, and multiple properties from a single workspace.', icon: '🏢' },
  { title: 'HVAC & Mechanical', desc: 'Dispatch technicians, track parts inventory, and invoice on completion — paperless from start to finish.', icon: '🔧' },
]

export default function Solutions() {
  return (
    <main className="min-h-screen bg-white text-zinc-900">
      {/* Nav */}
      <nav className="border-b border-zinc-100 px-6 h-16 flex items-center">
        <div className="max-w-5xl mx-auto w-full flex items-center justify-between">
          <Link href="/" className="text-sm font-bold tracking-[0.18em] uppercase text-zinc-900">Projex</Link>
          <Link href="/login" className="text-[13px] bg-zinc-900 text-white px-5 py-2 rounded-full font-medium hover:bg-zinc-700 transition-all">
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-24 text-center border-b border-zinc-100">
        <div className="max-w-3xl mx-auto">
          <p className="text-[11px] text-zinc-400 uppercase tracking-[0.2em] font-medium mb-4">Solutions</p>
          <h1 className="text-4xl md:text-6xl font-bold tracking-[-0.03em] text-zinc-900 mb-6">
            Built for every trade.
          </h1>
          <p className="text-zinc-500 text-xl max-w-xl mx-auto leading-relaxed">
            Whether you run a two-person roofing crew or a 50-person general contracting firm, Projex adapts to how you work.
          </p>
        </div>
      </section>

      {/* Solutions grid */}
      <section className="px-6 py-20">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {SOLUTIONS.map((s) => (
            <div key={s.title} className="bg-zinc-50 rounded-2xl p-7 border border-zinc-200/60 hover:border-zinc-300 hover:bg-white transition-all duration-300">
              <div className="text-3xl mb-4">{s.icon}</div>
              <h3 className="text-lg font-semibold text-zinc-900 mb-2">{s.title}</h3>
              <p className="text-[14px] text-zinc-500 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 border-t border-zinc-100 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-3xl font-bold tracking-[-0.03em] text-zinc-900 mb-4">Don&apos;t see your trade?</h2>
          <p className="text-zinc-500 mb-8">Projex is flexible enough to fit any field service business. Try it free — no credit card needed.</p>
          <Link href="/login" className="inline-block px-8 py-3.5 bg-zinc-900 text-white rounded-full text-[15px] font-semibold hover:bg-zinc-700 transition-all">
            Start free trial →
          </Link>
        </div>
      </section>
    </main>
  )
}
