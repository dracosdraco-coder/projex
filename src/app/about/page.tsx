import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About — Projex',
  description: 'We build software for the people who build everything else.',
}

export default function About() {
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
          <p className="text-[11px] text-zinc-400 uppercase tracking-[0.2em] font-medium mb-4">About</p>
          <h1 className="text-4xl md:text-6xl font-bold tracking-[-0.03em] text-zinc-900 mb-6">
            We build for the<br />people who build everything.
          </h1>
          <p className="text-zinc-500 text-xl max-w-xl mx-auto leading-relaxed">
            Projex started because the tools field service businesses were using hadn&apos;t changed in years — clunky, disconnected, and built by people who&apos;d never been on a job site.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="px-6 py-20 border-b border-zinc-100">
        <div className="max-w-3xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-bold text-zinc-900 mb-4 tracking-tight">Our mission</h2>
              <p className="text-zinc-500 leading-relaxed text-[15px]">
                Give every contractor — from the one-person operation to the 50-person firm — the same tools that enterprise companies pay thousands for. Modern, fast, and actually usable from a truck.
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-zinc-900 mb-4 tracking-tight">Where we&apos;re based</h2>
              <p className="text-zinc-500 leading-relaxed text-[15px]">
                South Florida. We built Projex in the market we know best — one of the fastest-growing construction markets in the country. Our users are our neighbors.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="px-6 py-20 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-3xl font-bold tracking-[-0.03em] text-zinc-900 mb-4">Get in touch</h2>
          <p className="text-zinc-500 mb-8">Have questions, partnership ideas, or just want to talk shop? We&apos;re easy to reach.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="mailto:hello@projex.live" className="px-8 py-3.5 bg-zinc-900 text-white rounded-full text-[15px] font-semibold hover:bg-zinc-700 transition-all">
              Email us →
            </a>
            <Link href="/login" className="px-8 py-3.5 border border-zinc-200 text-zinc-700 rounded-full text-[15px] font-medium hover:border-zinc-400 transition-all">
              Try Projex free
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
