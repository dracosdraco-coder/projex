import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'References — Projex',
  description: 'Companies and contractors who trust Projex to run their operations.',
}

// Add company logos and details here as you onboard clients
const CLIENTS: { name: string; trade: string; location: string }[] = [
  // Example entries — replace with real clients
  // { name: 'Modern Engineering', trade: 'General Contracting', location: 'Miami, FL' },
]

export default function References() {
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
          <p className="text-[11px] text-zinc-400 uppercase tracking-[0.2em] font-medium mb-4">References</p>
          <h1 className="text-4xl md:text-6xl font-bold tracking-[-0.03em] text-zinc-900 mb-6">
            Trusted by real businesses.
          </h1>
          <p className="text-zinc-500 text-xl max-w-xl mx-auto leading-relaxed">
            From solo operators to multi-branch companies — see who&apos;s running on Projex.
          </p>
        </div>
      </section>

      {/* Logo grid — to be filled with real client logos */}
      <section className="px-6 py-20">
        <div className="max-w-5xl mx-auto">
          {CLIENTS.length > 0 ? (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {CLIENTS.map((c) => (
                <div key={c.name} className="bg-zinc-50 rounded-2xl p-6 border border-zinc-200/60 flex flex-col items-center text-center gap-3">
                  {/* Logo placeholder */}
                  <div className="w-16 h-16 rounded-xl bg-zinc-200 flex items-center justify-center">
                    <span className="text-2xl font-bold text-zinc-400">{c.name[0]}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-zinc-900 text-sm">{c.name}</p>
                    <p className="text-[11px] text-zinc-400">{c.trade}</p>
                    <p className="text-[11px] text-zinc-400">{c.location}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-14 h-14 rounded-2xl bg-zinc-100 mx-auto mb-5 flex items-center justify-center">
                <svg className="w-6 h-6 text-zinc-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                  <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
                </svg>
              </div>
              <p className="text-zinc-400 text-sm">Client references coming soon.</p>
              <p className="text-zinc-300 text-[12px] mt-1">We&apos;re onboarding our first partners — check back shortly.</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 border-t border-zinc-100 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-3xl font-bold tracking-[-0.03em] text-zinc-900 mb-4">Want to be featured?</h2>
          <p className="text-zinc-500 mb-8">Join the growing list of businesses running on Projex. Start your free trial today.</p>
          <Link href="/login" className="inline-block px-8 py-3.5 bg-zinc-900 text-white rounded-full text-[15px] font-semibold hover:bg-zinc-700 transition-all">
            Start free trial →
          </Link>
        </div>
      </section>
    </main>
  )
}
