'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

/* ─── Animated counter on scroll ─── */
function Counter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true
        const dur = 1800, steps = 50, inc = target / steps
        let step = 0
        const iv = setInterval(() => { step++; setCount(Math.min(Math.round(inc * step), target)); if (step >= steps) clearInterval(iv) }, dur / steps)
      }
    }, { threshold: 0.5 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [target])
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>
}

/* ─── Reveal on scroll ─── */
function Reveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setTimeout(() => setVisible(true), delay); obs.disconnect() } }, { threshold: 0.1 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [delay])
  return <div ref={ref} className={`transition-all duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'} ${className}`}>{children}</div>
}

/* ─── Data ─── */
const PLANS = [
  { id: 'duo', name: 'Duo', price: 19.99, annual: 16.99, users: 2, desc: 'Solo operators & small partnerships', features: ['Up to 2 users', '5 active projects', 'Estimates & invoices', 'Calendar & scheduling', '2 GB storage', 'Email support'], cta: 'Start free trial', popular: false },
  { id: 'team', name: 'Team', price: 49.99, annual: 41.99, users: 5, desc: 'Growing teams that need coordination', features: ['Up to 5 users', 'Unlimited projects', 'Proposals & contracts', 'Budget tracking & KPIs', 'Team management', '10 GB storage', 'Priority support'], cta: 'Start free trial', popular: true },
  { id: 'business', name: 'Business', price: 99.99, annual: 83.99, users: 10, desc: 'Established companies scaling fast', features: ['Up to 10 users', 'Everything in Team', 'Multi-branch management', 'Advanced analytics', 'Custom templates', '50 GB storage', 'Dedicated support'], cta: 'Start free trial', popular: false },
  { id: 'enterprise', name: 'Enterprise', price: 149.99, annual: 124.99, users: 20, desc: 'Large operations with multiple teams', features: ['Up to 20 users', 'Everything in Business', 'API access', 'Custom integrations', '100 GB storage', 'SSO & security', 'Account manager'], cta: 'Start free trial', popular: false },
]

const ADDONS = [
  { name: 'AI Estimating', price: 19, desc: 'Auto-generate estimates from plans & photos' },
  { name: 'Advanced Reports', price: 12, desc: 'Custom dashboards, profit analysis, Excel export' },
  { name: 'Client Portal', price: 15, desc: 'Branded portal for approvals & payments' },
  { name: 'Storage Plus', price: 9, desc: 'Additional 50 GB document & photo storage' },
  { name: 'GPS Tracking', price: 14, desc: 'Live crew tracking, geofenced clock-in/out' },
  { name: 'QuickBooks Sync', price: 11, desc: 'Two-way sync with QuickBooks Online' },
]

const FEATURES = [
  { title: 'Spatial Canvas', desc: 'Arrange your entire operation on one infinite workspace. Drag, resize, and connect cards your way — no more switching between tabs.', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
  )},
  { title: 'Smart Estimates', desc: 'Build professional estimates with auto-calculated materials, labor, and markup. Generate polished proposals in minutes, not hours.', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6"><path d="M9 7h6m-6 4h6m-6 4h4M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z"/></svg>
  )},
  { title: 'Live Scheduling', desc: 'Calendar, Gantt timeline, and task boards stay in sync. Assign crews, track deadlines, and see who\'s where — all in real time.', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
  )},
  { title: 'Financial Command', desc: 'Track budgets, expenses, change orders, and profitability per project. Know your margins before you finish the job.', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6"><path d="M12 2v20m5-17H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 110 7H7"/></svg>
  )},
]

/* ─── Page ─── */
export default function Home() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [annual, setAnnual] = useState(true)
  const [scrolled, setScrolled] = useState(false)
  const [mobileNav, setMobileNav] = useState(false)

  useEffect(() => { if (!loading && user) router.push('/access') }, [user, loading, router])
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  if (loading) return (
    <main className="min-h-screen bg-[#09090b] flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white tracking-[0.2em] uppercase">Projex</h1>
        <div className="mt-4 w-24 h-[2px] bg-white/20 mx-auto overflow-hidden rounded-full">
          <div className="h-full w-1/3 bg-white rounded-full animate-[shimmer_1s_ease-in-out_infinite]" />
        </div>
      </div>
    </main>
  )

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=JetBrains+Mono:wght@400;500&display=swap');
        :root {
          --font-body: 'DM Sans', system-ui, -apple-system, sans-serif;
          --font-mono: 'JetBrains Mono', monospace;
          --surface: #09090b;
          --surface-raised: #18181b;
          --surface-overlay: #27272a;
          --border: #27272a;
          --border-subtle: #1e1e22;
          --text: #fafafa;
          --text-muted: #a1a1aa;
          --text-faint: #52525b;
          --accent: #e4e4e7;
          --brand: #f0f0f0;
        }
        body { font-family: var(--font-body); }
        @keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(400%)} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes grain { 0%,100%{transform:translate(0,0)} 10%{transform:translate(-5%,-10%)} 30%{transform:translate(3%,-15%)} 50%{transform:translate(12%,9%)} 70%{transform:translate(9%,4%)} 90%{transform:translate(-1%,7%)} }
        .grain::before { content:''; position:fixed; top:-50%;left:-50%;right:-50%;bottom:-50%;width:200%;height:200%;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");animation:grain 8s steps(10) infinite;pointer-events:none;z-index:1000;opacity:0.3; }
      `}</style>

      <main className="min-h-screen bg-[var(--surface)] text-[var(--text)] antialiased overflow-x-hidden relative grain">

        {/* ═══ NAV ═══ */}
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-[#09090b]/90 backdrop-blur-2xl border-b border-white/[0.06]' : 'bg-transparent'}`}>
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <span className="text-sm font-bold tracking-[0.2em] uppercase text-white">Projex</span>
            <div className="hidden md:flex items-center gap-10">
              {['Features', 'Pricing', 'Add-ons'].map(l => (
                <a key={l} href={`#${l.toLowerCase().replace('-', '')}`} className="text-[13px] text-[var(--text-muted)] hover:text-white transition-colors duration-300">{l}</a>
              ))}
            </div>
            <div className="hidden md:flex items-center gap-4">
              <button onClick={() => router.push('/login')} className="text-[13px] text-[var(--text-muted)] hover:text-white transition-colors">Sign in</button>
              <button onClick={() => router.push('/login')} className="text-[13px] bg-white text-[var(--surface)] px-5 py-2 rounded-full font-medium hover:bg-[var(--accent)] transition-all active:scale-[0.97]">Get started</button>
            </div>
            <button onClick={() => setMobileNav(!mobileNav)} className="md:hidden p-2 text-[var(--text-muted)]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={mobileNav ? "M6 6l12 12M6 18L18 6" : "M4 8h16M4 16h16"}/></svg>
            </button>
          </div>
          {/* Mobile nav dropdown */}
          {mobileNav && (
            <div className="md:hidden bg-[var(--surface)]/95 backdrop-blur-2xl border-t border-white/[0.06] px-6 py-6 space-y-4">
              {['Features', 'Pricing', 'Add-ons'].map(l => (
                <a key={l} href={`#${l.toLowerCase().replace('-', '')}`} onClick={() => setMobileNav(false)} className="block text-sm text-[var(--text-muted)] hover:text-white">{l}</a>
              ))}
              <div className="pt-4 border-t border-white/[0.06] flex gap-3">
                <button onClick={() => router.push('/login')} className="text-sm text-[var(--text-muted)]">Sign in</button>
                <button onClick={() => router.push('/login')} className="text-sm bg-white text-black px-4 py-2 rounded-full font-medium">Get started</button>
              </div>
            </div>
          )}
        </nav>

        {/* ═══ HERO ═══ */}
        <section className="relative pt-36 pb-20 md:pt-48 md:pb-32 px-6 text-center overflow-hidden">
          {/* Radial glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-radial from-zinc-800/30 via-transparent to-transparent rounded-full blur-3xl pointer-events-none" />
          {/* Grid background */}
          <div className="absolute inset-0 opacity-[0.03]" style={{backgroundImage:'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Crect width=\'60\' height=\'60\' fill=\'none\' stroke=\'%23fff\' stroke-width=\'0.5\'/%3E%3C/svg%3E")'}} />
          
          <div className="relative max-w-4xl mx-auto">
            <Reveal>
              <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-[11px] font-medium text-[var(--text-muted)] mb-8 tracking-widest uppercase">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                Now in beta
              </div>
            </Reveal>
            <Reveal delay={80}>
              <h1 className="text-[clamp(2.5rem,8vw,5.5rem)] font-bold tracking-[-0.035em] leading-[0.92] text-white mb-8">
                Management,<br />
                <span className="bg-gradient-to-r from-white via-zinc-400 to-zinc-600 bg-clip-text text-transparent">reimagined.</span>
              </h1>
            </Reveal>
            <Reveal delay={160}>
              <p className="text-lg md:text-xl text-[var(--text-muted)] max-w-xl mx-auto leading-relaxed mb-10">
                One spatial workspace for estimates, scheduling, budgets, and team coordination. Built for businesses that move fast.
              </p>
            </Reveal>
            <Reveal delay={240}>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button onClick={() => router.push('/login')} className="group px-8 py-3.5 bg-white text-[var(--surface)] rounded-full text-[15px] font-semibold hover:bg-[var(--accent)] transition-all active:scale-[0.97] shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                  Start free trial
                  <span className="inline-block ml-2 transition-transform group-hover:translate-x-0.5">&rarr;</span>
                </button>
                <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="px-8 py-3.5 text-[var(--text-muted)] rounded-full text-[15px] font-medium border border-white/[0.1] hover:border-white/[0.2] hover:text-white transition-all active:scale-[0.97]">
                  See how it works
                </button>
              </div>
            </Reveal>
            <Reveal delay={320}>
              <p className="mt-5 text-[12px] text-[var(--text-faint)] tracking-wide">14-day free trial &middot; No credit card required</p>
            </Reveal>
          </div>
        </section>

        {/* ═══ APP PREVIEW ═══ */}
        <Reveal>
          <section className="px-6 pb-28 md:pb-36">
            <div className="max-w-5xl mx-auto">
              <div className="relative rounded-2xl md:rounded-3xl overflow-hidden border border-white/[0.06] shadow-[0_0_80px_rgba(0,0,0,0.5)]">
                <div className="bg-gradient-to-br from-zinc-900 via-[#0f0f12] to-black aspect-[16/10] flex items-center justify-center p-6 md:p-12">
                  {/* Simulated app UI */}
                  <div className="w-full max-w-3xl">
                    {/* Title bar */}
                    <div className="flex items-center gap-2 mb-4 md:mb-6">
                      <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                        <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                        <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                      </div>
                      <div className="ml-4 h-5 bg-white/[0.04] rounded-md flex-1 max-w-[200px]" />
                    </div>
                    {/* Cards grid */}
                    <div className="grid grid-cols-3 gap-2.5 md:gap-3.5">
                      {['Dashboard', 'Projects', 'Estimates', 'Schedule', 'Budget', 'Team'].map((label, i) => (
                        <div key={label} className="bg-white/[0.04] border border-white/[0.06] rounded-xl md:rounded-2xl p-3 md:p-5 hover:bg-white/[0.07] transition-all duration-500 group" style={{ animationDelay: `${i * 150}ms` }}>
                          <div className="flex items-center gap-2 mb-2.5 md:mb-3">
                            <div className="w-5 h-5 md:w-7 md:h-7 rounded-lg bg-white/[0.08] group-hover:bg-white/[0.12] transition-colors" />
                            <span className="text-white/50 text-[10px] md:text-xs font-medium tracking-wide">{label}</span>
                          </div>
                          <div className="space-y-1.5 md:space-y-2">
                            <div className="h-[3px] bg-white/[0.06] rounded-full w-full" />
                            <div className="h-[3px] bg-white/[0.06] rounded-full w-4/5" />
                            <div className="h-[3px] bg-white/[0.06] rounded-full w-3/5" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {/* Reflection gradient */}
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[var(--surface)] to-transparent pointer-events-none" />
              </div>
            </div>
          </section>
        </Reveal>

        {/* ═══ STATS ═══ */}
        <section className="px-6 pb-28 md:pb-36">
          <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {[
              { n: 500, s: '+', label: 'Active users' },
              { n: 12000, s: '+', label: 'Projects managed' },
              { n: 99, s: '%', label: 'Uptime' },
              { n: 4, s: '.9', label: 'User rating' },
            ].map((s, i) => (
              <Reveal key={s.label} delay={i * 100}>
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-white tabular-nums" style={{ fontFamily: 'var(--font-mono)' }}>
                    <Counter target={s.n} suffix={s.s} />
                  </div>
                  <div className="text-[11px] text-[var(--text-faint)] mt-2 uppercase tracking-[0.15em] font-medium">{s.label}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ═══ FEATURES ═══ */}
        <section id="features" className="px-6 py-28 md:py-36 border-t border-white/[0.04]">
          <div className="max-w-5xl mx-auto">
            <Reveal>
              <div className="text-center mb-16 md:mb-20">
                <p className="text-[11px] text-[var(--text-faint)] uppercase tracking-[0.2em] font-medium mb-4">Features</p>
                <h2 className="text-3xl md:text-5xl font-bold tracking-[-0.03em] text-white mb-5">
                  Everything you need.<br />Nothing you don&apos;t.
                </h2>
                <p className="text-[var(--text-muted)] text-lg max-w-lg mx-auto">Purpose-built for construction teams. Every feature designed to save time and prevent costly mistakes.</p>
              </div>
            </Reveal>
            <div className="grid md:grid-cols-2 gap-4 md:gap-5">
              {FEATURES.map((f, i) => (
                <Reveal key={f.title} delay={i * 100}>
                  <div className="group relative bg-white/[0.02] rounded-2xl p-8 md:p-10 hover:bg-white/[0.04] transition-all duration-500 border border-white/[0.04] hover:border-white/[0.08]">
                    <div className="w-12 h-12 rounded-xl bg-white/[0.05] border border-white/[0.06] flex items-center justify-center text-[var(--text-muted)] group-hover:text-white group-hover:border-white/[0.12] transition-all duration-500 mb-5">
                      {f.icon}
                    </div>
                    <h3 className="text-xl font-semibold mb-2.5 text-white">{f.title}</h3>
                    <p className="text-[15px] text-[var(--text-muted)] leading-relaxed">{f.desc}</p>
                    <div className="absolute top-8 right-8 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-1 group-hover:translate-x-0 text-[var(--text-faint)]">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17L17 7M17 7H7M17 7V17"/></svg>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ PRICING ═══ */}
        <section id="pricing" className="px-6 py-28 md:py-36 border-t border-white/[0.04]">
          <div className="max-w-5xl mx-auto">
            <Reveal>
              <div className="text-center mb-14">
                <p className="text-[11px] text-[var(--text-faint)] uppercase tracking-[0.2em] font-medium mb-4">Pricing</p>
                <h2 className="text-3xl md:text-5xl font-bold tracking-[-0.03em] text-white mb-5">Simple, honest pricing.</h2>
                <p className="text-[var(--text-muted)] text-lg mb-8">Start free. Scale when you&apos;re ready.</p>
                <div className="inline-flex items-center bg-white/[0.05] rounded-full p-1 border border-white/[0.06]">
                  <button onClick={() => setAnnual(false)} className={`px-5 py-2 rounded-full text-[13px] font-medium transition-all duration-300 ${!annual ? 'bg-white text-[var(--surface)] shadow-sm' : 'text-[var(--text-muted)] hover:text-white'}`}>Monthly</button>
                  <button onClick={() => setAnnual(true)} className={`px-5 py-2 rounded-full text-[13px] font-medium transition-all duration-300 ${annual ? 'bg-white text-[var(--surface)] shadow-sm' : 'text-[var(--text-muted)] hover:text-white'}`}>
                    Annual <span className="text-emerald-400 text-[11px] ml-1 font-semibold">-15%</span>
                  </button>
                </div>
              </div>
            </Reveal>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
              {PLANS.map((plan, i) => (
                <Reveal key={plan.id} delay={i * 80}>
                  <div className={`relative rounded-2xl p-6 md:p-7 transition-all duration-500 border group ${
                    plan.popular
                      ? 'bg-white text-[var(--surface)] border-white shadow-[0_0_60px_rgba(255,255,255,0.08)] md:scale-105 z-10'
                      : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.04]'
                  }`}>
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3.5 py-1 bg-[var(--surface)] text-white rounded-full text-[10px] font-semibold tracking-widest uppercase border border-white/[0.1]">Most popular</div>
                    )}
                    <div className="mb-5">
                      <h3 className={`text-base font-semibold mb-1 ${plan.popular ? 'text-[var(--surface)]' : 'text-white'}`}>{plan.name}</h3>
                      <p className={`text-[12px] leading-relaxed ${plan.popular ? 'text-zinc-500' : 'text-[var(--text-faint)]'}`}>{plan.desc}</p>
                    </div>
                    <div className="mb-6">
                      <span className={`text-3xl font-bold tabular-nums ${plan.popular ? 'text-[var(--surface)]' : 'text-white'}`} style={{ fontFamily: 'var(--font-mono)' }}>${annual ? plan.annual : plan.price}</span>
                      <span className={`text-[12px] ml-0.5 ${plan.popular ? 'text-zinc-500' : 'text-[var(--text-faint)]'}`}>/mo</span>
                      {annual && <div className={`text-[10px] mt-1 ${plan.popular ? 'text-zinc-400' : 'text-[var(--text-faint)]'}`}>billed annually</div>}
                    </div>
                    <button
                      onClick={() => router.push(`/login?plan=${plan.id}&interval=${annual ? 'annual' : 'monthly'}`)}
                      className={`w-full py-2.5 rounded-full text-[13px] font-medium transition-all active:scale-[0.97] ${
                        plan.popular
                          ? 'bg-[var(--surface)] text-white hover:bg-zinc-800'
                          : 'bg-white text-[var(--surface)] hover:bg-[var(--accent)]'
                      }`}
                    >{plan.cta}</button>
                    <ul className="mt-5 space-y-2.5">
                      {plan.features.map((f: string) => (
                        <li key={f} className={`text-[12px] flex items-start gap-2.5 ${plan.popular ? 'text-zinc-600' : 'text-[var(--text-muted)]'}`}>
                          <svg className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${plan.popular ? 'text-emerald-500' : 'text-emerald-400/70'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal delay={400}>
              <div className="text-center mt-10">
                <p className="text-sm text-[var(--text-faint)]">Need more than 20 users? <a href="mailto:sales@projex.live" className="text-white font-medium hover:underline underline-offset-4 decoration-white/30">Contact us for custom pricing</a></p>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ═══ ADD-ONS ═══ */}
        <section id="addons" className="px-6 py-28 md:py-36 border-t border-white/[0.04]">
          <div className="max-w-5xl mx-auto">
            <Reveal>
              <div className="text-center mb-14 md:mb-16">
                <p className="text-[11px] text-[var(--text-faint)] uppercase tracking-[0.2em] font-medium mb-4">Add-ons</p>
                <h2 className="text-3xl md:text-5xl font-bold tracking-[-0.03em] text-white mb-5">Power-ups for your plan.</h2>
                <p className="text-[var(--text-muted)] text-lg max-w-lg mx-auto">Add exactly what you need. Remove anytime. Every add-on works with every plan.</p>
              </div>
            </Reveal>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {ADDONS.map((addon, i) => (
                <Reveal key={addon.name} delay={i * 80}>
                  <div className="group bg-white/[0.02] rounded-2xl p-6 border border-white/[0.04] hover:border-white/[0.1] hover:bg-white/[0.04] transition-all duration-500">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] group-hover:border-white/[0.1] transition-colors" />
                      <span className="text-[13px] font-semibold text-white tabular-nums" style={{ fontFamily: 'var(--font-mono)' }}>+${addon.price}<span className="text-[var(--text-faint)] font-normal">/mo</span></span>
                    </div>
                    <h3 className="font-semibold text-white mb-1.5">{addon.name}</h3>
                    <p className="text-[13px] text-[var(--text-muted)] leading-relaxed">{addon.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ TESTIMONIALS ═══ */}
        <section className="px-6 py-28 md:py-36 border-t border-white/[0.04]">
          <div className="max-w-5xl mx-auto">
            <Reveal>
              <div className="text-center mb-16">
                <p className="text-[12px] font-semibold tracking-[0.2em] uppercase text-[var(--text-faint)] mb-3">What our users say</p>
                <h2 className="text-3xl md:text-4xl font-bold tracking-[-0.03em] text-white">Built for the real world</h2>
              </div>
            </Reveal>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { name: 'Carlos M.', role: 'Roofing Contractor, Miami', quote: 'Projex replaced three apps we were using. Estimates, scheduling, and invoicing — all in one place. My crew actually uses it.' },
                { name: 'Sarah T.', role: 'GC, Fort Lauderdale', quote: 'The client portal alone has saved me hours of back-and-forth emails. Clients can see progress and approve documents instantly.' },
                { name: 'James R.', role: 'Electrical Sub, Palm Beach', quote: 'I was drowning in spreadsheets. Now I create an estimate on my phone at the job site and send it before I leave. Game changer.' },
              ].map((t, i) => (
                <Reveal key={i} delay={i * 100}>
                  <div className="bg-[var(--surface-raised)] border border-[var(--border-subtle)] rounded-2xl p-6 h-full flex flex-col">
                    <p className="text-[15px] text-[var(--text-muted)] leading-relaxed flex-1 mb-5">&ldquo;{t.quote}&rdquo;</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-600 flex items-center justify-center">
                        <span className="text-white text-sm font-bold">{t.name[0]}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{t.name}</p>
                        <p className="text-[11px] text-[var(--text-faint)]">{t.role}</p>
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ COMPARISON ═══ */}
        <section className="px-6 py-28 md:py-36 border-t border-white/[0.04]">
          <div className="max-w-4xl mx-auto">
            <Reveal>
              <div className="text-center mb-16">
                <p className="text-[12px] font-semibold tracking-[0.2em] uppercase text-[var(--text-faint)] mb-3">Why Projex</p>
                <h2 className="text-3xl md:text-4xl font-bold tracking-[-0.03em] text-white">Everything they charge extra for, we include</h2>
              </div>
            </Reveal>
            <Reveal delay={100}>
              <div className="bg-[var(--surface-raised)] border border-[var(--border-subtle)] rounded-2xl overflow-hidden">
                <div className="grid grid-cols-4 text-center border-b border-[var(--border-subtle)]">
                  <div className="p-4 text-left"><span className="text-[12px] text-[var(--text-faint)]">Feature</span></div>
                  <div className="p-4 bg-white/[0.03]"><span className="text-[13px] font-bold text-white">Projex</span></div>
                  <div className="p-4"><span className="text-[12px] text-[var(--text-faint)]">Buildertrend</span></div>
                  <div className="p-4"><span className="text-[12px] text-[var(--text-faint)]">Jobber</span></div>
                </div>
                {[
                  { feature: 'Starting price', projex: '$19.99/mo', bt: '$99/mo', jb: '$49/mo' },
                  { feature: 'Estimates & invoices', projex: '✓', bt: '✓', jb: '✓' },
                  { feature: 'Client portal', projex: '✓', bt: 'Add-on', jb: '✗' },
                  { feature: 'Team management', projex: '✓', bt: '✓', jb: '✓' },
                  { feature: 'Multi-user orgs', projex: '✓', bt: '✓', jb: 'Limited' },
                  { feature: 'Real-time presence', projex: '✓', bt: '✗', jb: '✗' },
                  { feature: 'CSV import/export', projex: '✓', bt: '✗', jb: '✓' },
                  { feature: 'Custom branding', projex: '✓', bt: 'Add-on', jb: 'Add-on' },
                  { feature: 'Photo reports', projex: '✓', bt: '✓', jb: '✗' },
                  { feature: 'No setup fees', projex: '✓', bt: '✗', jb: '✓' },
                ].map((row, i) => (
                  <div key={i} className={`grid grid-cols-4 text-center ${i % 2 === 0 ? '' : 'bg-white/[0.015]'}`}>
                    <div className="p-3 text-left text-[12px] text-[var(--text-muted)] border-r border-[var(--border-subtle)]">{row.feature}</div>
                    <div className="p-3 bg-white/[0.03] text-[12px] font-medium text-white">{row.projex}</div>
                    <div className="p-3 text-[12px] text-[var(--text-faint)]">{row.bt}</div>
                    <div className="p-3 text-[12px] text-[var(--text-faint)]">{row.jb}</div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* ═══ FAQ ═══ */}
        <section className="px-6 py-28 md:py-36 border-t border-white/[0.04]">
          <div className="max-w-3xl mx-auto">
            <Reveal>
              <div className="text-center mb-16">
                <p className="text-[12px] font-semibold tracking-[0.2em] uppercase text-[var(--text-faint)] mb-3">Questions</p>
                <h2 className="text-3xl md:text-4xl font-bold tracking-[-0.03em] text-white">Frequently asked</h2>
              </div>
            </Reveal>
            <div className="space-y-3">
              {[
                { q: 'Is there a free trial?', a: 'Yes — 14 days, no credit card required. You get full access to all features during the trial.' },
                { q: 'Can I upgrade or downgrade anytime?', a: 'Absolutely. Change your plan at any time from Settings. Upgrades take effect immediately, downgrades at the end of your billing cycle.' },
                { q: 'Do my team members need their own subscription?', a: 'No. Your plan includes seats for your team. Invited members join your organization and share your subscription — no separate payment needed.' },
                { q: 'Is my data secure?', a: 'Your data is stored in Supabase (built on AWS) with enterprise-grade encryption at rest and in transit. Row-level security ensures users only see their organization\'s data.' },
                { q: 'Can clients see my project data?', a: 'Only what you choose to share. The client portal shows project progress, documents, and payment status — nothing else. You control visibility.' },
                { q: 'Do you offer refunds?', a: 'Yes. If you\'re not satisfied within the first 30 days, contact us for a full refund. No questions asked.' },
                { q: 'What if I need more than 20 users?', a: 'Contact us for a custom Enterprise plan. We\'ll work with you on pricing, onboarding, and dedicated support.' },
              ].map((faq, i) => (
                <Reveal key={i} delay={i * 50}>
                  <details className="group bg-[var(--surface-raised)] border border-[var(--border-subtle)] rounded-xl overflow-hidden">
                    <summary className="flex items-center justify-between px-5 py-4 cursor-pointer select-none list-none">
                      <span className="text-[14px] font-medium text-white pr-4">{faq.q}</span>
                      <span className="text-[var(--text-faint)] text-lg shrink-0 transition-transform group-open:rotate-45">+</span>
                    </summary>
                    <div className="px-5 pb-4">
                      <p className="text-[13px] text-[var(--text-muted)] leading-relaxed">{faq.a}</p>
                    </div>
                  </details>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ CTA ═══ */}
        <section className="px-6 py-28 md:py-36 border-t border-white/[0.04] relative overflow-hidden">
          {/* Background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gradient-radial from-zinc-800/20 via-transparent to-transparent rounded-full blur-3xl pointer-events-none" />
          <Reveal>
            <div className="relative max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-5xl font-bold tracking-[-0.03em] text-white mb-5">Ready to build smarter?</h2>
              <p className="text-[var(--text-muted)] text-lg mb-10 max-w-md mx-auto">Join hundreds of businesses already running leaner, faster operations with Projex.</p>
              <button onClick={() => router.push('/login')} className="group px-10 py-4 bg-white text-[var(--surface)] rounded-full text-[16px] font-semibold hover:bg-[var(--accent)] transition-all active:scale-[0.97] shadow-[0_0_40px_rgba(255,255,255,0.1)]">
                Start your free trial
                <span className="inline-block ml-2 transition-transform group-hover:translate-x-0.5">&rarr;</span>
              </button>
              <p className="mt-4 text-[12px] text-[var(--text-faint)] tracking-wide">14-day free trial &middot; No credit card &middot; Cancel anytime</p>
            </div>
          </Reveal>
        </section>

        {/* ═══ FOOTER ═══ */}
        <footer className="px-6 py-14 border-t border-white/[0.04]">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
              <div>
                <span className="text-sm font-bold tracking-[0.15em] uppercase text-white block mb-4">Projex</span>
                <p className="text-[12px] text-[var(--text-faint)] leading-relaxed">Construction project management for teams that move fast.</p>
              </div>
              <div>
                <h4 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-faint)] mb-4">Product</h4>
                <div className="space-y-2.5">
                  {['Features', 'Pricing', 'Add-ons', 'Changelog'].map((l) => (
                    <a key={l} href="#" className="block text-[13px] text-[var(--text-muted)] hover:text-white transition-colors duration-300">{l}</a>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-faint)] mb-4">Company</h4>
                <div className="space-y-2.5">
                  <a href="#" className="block text-[13px] text-[var(--text-muted)] hover:text-white transition-colors duration-300">About</a>
                  <a href="/blog" className="block text-[13px] text-[var(--text-muted)] hover:text-white transition-colors duration-300">Blog</a>
                  <a href="/docs" className="block text-[13px] text-[var(--text-muted)] hover:text-white transition-colors duration-300">Docs</a>
                  <a href="#" className="block text-[13px] text-[var(--text-muted)] hover:text-white transition-colors duration-300">Contact</a>
                </div>
              </div>
              <div>
                <h4 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-faint)] mb-4">Legal</h4>
                <div className="space-y-2.5">
                  <a href="/privacy" className="block text-[13px] text-[var(--text-muted)] hover:text-white transition-colors duration-300">Privacy</a>
                  <a href="/terms" className="block text-[13px] text-[var(--text-muted)] hover:text-white transition-colors duration-300">Terms</a>
                  <a href="#" className="block text-[13px] text-[var(--text-muted)] hover:text-white transition-colors duration-300">Security</a>
                </div>
              </div>
            </div>
            <div className="pt-8 border-t border-white/[0.04] flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-[11px] text-[var(--text-faint)] tracking-wide">&copy; 2026 Projex. All rights reserved.</p>
              <div className="flex items-center gap-6">
                {[
                  { name: 'X', href: '#' },
                  { name: 'LinkedIn', href: '#' },
                  { name: 'GitHub', href: '#' },
                ].map((s) => (
                  <a key={s.name} href={s.href} className="text-[11px] text-[var(--text-faint)] hover:text-white transition-colors duration-300 tracking-wide">{s.name}</a>
                ))}
              </div>
            </div>
          </div>
        </footer>
      </main>
    </>
  )
}
