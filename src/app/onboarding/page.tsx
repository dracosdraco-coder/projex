'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'

const INDUSTRIES = [
  'General Contracting', 'Roofing', 'Electrical', 'Plumbing',
  'HVAC / Mechanical', 'Landscaping', 'Property Management',
  'Painting & Finishes', 'Flooring', 'Other',
]

const TEAM_SIZES = [
  { label: 'Just me', value: '1', desc: 'Solo operator' },
  { label: '2 – 5', value: '2-5', desc: 'Small crew' },
  { label: '6 – 15', value: '6-15', desc: 'Growing team' },
  { label: '16 – 50', value: '16-50', desc: 'Mid-size company' },
  { label: '50+', value: '50+', desc: 'Large operation' },
]

const FEATURES = [
  { id: 'estimates', label: 'Estimates & Proposals', icon: '📋' },
  { id: 'projects', label: 'Project Management', icon: '🏗️' },
  { id: 'scheduling', label: 'Scheduling & Calendar', icon: '📅' },
  { id: 'invoicing', label: 'Invoicing & Payments', icon: '💵' },
  { id: 'team', label: 'Team Management', icon: '👥' },
  { id: 'budgeting', label: 'Budgeting & Finances', icon: '📊' },
  { id: 'clients', label: 'Client Communication', icon: '💬' },
  { id: 'documents', label: 'Documents & Forms', icon: '📄' },
]

const TOTAL_STEPS = 5

const FIRST_ACTIONS = [
  {
    id: 'project',
    icon: '🏗️',
    title: 'Create your first project',
    desc: 'Add a job, set a budget, assign phases.',
    href: '/access?open=projects',
  },
  {
    id: 'estimate',
    icon: '📋',
    title: 'Send an estimate',
    desc: 'Build a proposal and send it to a client.',
    href: '/access?open=estimating',
  },
  {
    id: 'calendar',
    icon: '📅',
    title: 'Book an appointment',
    desc: 'Schedule a site visit or client meeting.',
    href: '/access?open=calendar',
  },
  {
    id: 'team',
    icon: '👥',
    title: 'Invite your team',
    desc: 'Add crew members and assign roles.',
    href: '/access?open=team',
  },
]

export default function OnboardingPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [company, setCompany] = useState('')
  const [industry, setIndustry] = useState('')
  const [city, setCity] = useState('')
  const [teamSize, setTeamSize] = useState('')
  const [features, setFeatures] = useState<string[]>([])

  const toggleFeature = (id: string) =>
    setFeatures(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])

  const canContinue = () => {
    if (step === 1) return firstName.trim().length > 0
    if (step === 2) return company.trim().length > 0 && industry.length > 0
    if (step === 3) return teamSize.length > 0
    if (step === 4) return features.length > 0
    return true
  }

  const finish = async () => {
    if (!user) return
    setSaving(true)
    setError('')
    try {
      // 1. Update profile name
      await supabase.from('profiles').update({
        full_name: `${firstName.trim()} ${lastName.trim()}`.trim(),
        company: company.trim(),
      }).eq('id', user.id)

      // 2. Create organization
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: company.trim() || `${firstName}'s Company`,
          owner_id: user.id,
          email: user.email,
          settings: { industry, team_size: teamSize, primary_features: features, city: city.trim() },
        })
        .select('id')
        .single()

      if (orgError) throw orgError

      // 3. Add owner as org member
      await supabase.from('org_members').insert({
        org_id: org.id,
        user_id: user.id,
        email: user.email!,
        name: `${firstName} ${lastName}`.trim(),
        role: 'owner',
        status: 'active',
        joined_at: new Date().toISOString(),
      })

      // 4. Link org to profile
      await supabase.from('profiles').update({ org_id: org.id }).eq('id', user.id)

      setStep(5)
    } catch (err: any) {
      setError(err.message || 'Setup failed. Please try again.')
      setSaving(false)
    }
  }

  const handleNext = () => {
    if (step < TOTAL_STEPS) setStep(s => s + 1)
    else finish()
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Top bar */}
      <div className="px-8 py-6 flex items-center justify-between">
        <span className="text-sm font-bold tracking-[0.18em] uppercase text-zinc-900">Projex</span>
        <button
          onClick={() => finish()}
          className="text-[12px] text-zinc-400 hover:text-zinc-700 transition-colors"
        >
          Skip setup →
        </button>
      </div>

      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 pt-4 pb-2">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div
            key={i}
            className={`rounded-full transition-all duration-300 ${
              i + 1 === step
                ? 'w-6 h-2 bg-zinc-900'
                : i + 1 < step
                ? 'w-2 h-2 bg-zinc-400'
                : 'w-2 h-2 bg-zinc-200'
            }`}
          />
        ))}
      </div>

      {/* Step content */}
      <div className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-[440px]">

          {/* Step 1: Name */}
          {step === 1 && (
            <div>
              <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest mb-3">Step 1 of {TOTAL_STEPS}</p>
              <h2 className="text-[28px] font-bold text-zinc-900 tracking-tight mb-1.5">What's your name?</h2>
              <p className="text-zinc-400 text-[14px] mb-10">We'll use this to personalize your workspace.</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-[12px] font-medium text-zinc-500 mb-2 uppercase tracking-wide">First name</label>
                  <input
                    autoFocus
                    type="text"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    placeholder="Ethan"
                    className="w-full px-4 py-3.5 bg-zinc-100 rounded-xl text-[15px] text-zinc-900 placeholder-zinc-400 outline-none focus:bg-zinc-200 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-zinc-500 mb-2 uppercase tracking-wide">Last name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    placeholder="Robillard"
                    className="w-full px-4 py-3.5 bg-zinc-100 rounded-xl text-[15px] text-zinc-900 placeholder-zinc-400 outline-none focus:bg-zinc-200 transition-colors"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Business */}
          {step === 2 && (
            <div>
              <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest mb-3">Step 2 of {TOTAL_STEPS}</p>
              <h2 className="text-[28px] font-bold text-zinc-900 tracking-tight mb-1.5">Your business</h2>
              <p className="text-zinc-400 text-[14px] mb-10">We'll set up Projex for your trade.</p>
              <div className="space-y-5">
                <div>
                  <label className="block text-[12px] font-medium text-zinc-500 mb-2 uppercase tracking-wide">Company name</label>
                  <input
                    autoFocus
                    type="text"
                    value={company}
                    onChange={e => setCompany(e.target.value)}
                    placeholder="MEC Group"
                    className="w-full px-4 py-3.5 bg-zinc-100 rounded-xl text-[15px] text-zinc-900 placeholder-zinc-400 outline-none focus:bg-zinc-200 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-zinc-500 mb-3 uppercase tracking-wide">Industry / Trade</label>
                  <div className="grid grid-cols-2 gap-2">
                    {INDUSTRIES.map(ind => (
                      <button
                        key={ind}
                        type="button"
                        onClick={() => setIndustry(ind)}
                        className={`px-3.5 py-2.5 rounded-xl text-[12px] font-medium text-left transition-all ${
                          industry === ind
                            ? 'bg-zinc-900 text-white'
                            : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                        }`}
                      >
                        {ind}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-zinc-500 mb-2 uppercase tracking-wide">City (optional)</label>
                  <input
                    type="text"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    placeholder="Miami, FL"
                    className="w-full px-4 py-3.5 bg-zinc-100 rounded-xl text-[15px] text-zinc-900 placeholder-zinc-400 outline-none focus:bg-zinc-200 transition-colors"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Team size */}
          {step === 3 && (
            <div>
              <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest mb-3">Step 3 of {TOTAL_STEPS}</p>
              <h2 className="text-[28px] font-bold text-zinc-900 tracking-tight mb-1.5">How big is your team?</h2>
              <p className="text-zinc-400 text-[14px] mb-10">This helps us recommend the right plan.</p>
              <div className="space-y-2.5">
                {TEAM_SIZES.map(({ label, value, desc }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setTeamSize(value)}
                    className={`w-full flex items-center justify-between px-5 py-4 rounded-xl transition-all text-left ${
                      teamSize === value
                        ? 'bg-zinc-900 text-white'
                        : 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200'
                    }`}
                  >
                    <span className="font-semibold text-[15px]">{label}</span>
                    <span className={`text-[12px] ${teamSize === value ? 'text-zinc-400' : 'text-zinc-400'}`}>{desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Features */}
          {step === 4 && (
            <div>
              <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest mb-3">Step 4 of {TOTAL_STEPS}</p>
              <h2 className="text-[28px] font-bold text-zinc-900 tracking-tight mb-1.5">What do you want to manage?</h2>
              <p className="text-zinc-400 text-[14px] mb-10">Select all that apply — you can always add more later.</p>
              <div className="grid grid-cols-2 gap-2.5">
                {FEATURES.map(({ id, label, icon }) => {
                  const active = features.includes(id)
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => toggleFeature(id)}
                      className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all ${
                        active
                          ? 'bg-zinc-900 text-white'
                          : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                      }`}
                    >
                      <span className="text-lg leading-none">{icon}</span>
                      <span className="text-[12px] font-medium leading-tight">{label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Step 5: Ready — first actions */}
          {step === 5 && (
            <div>
              <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest mb-3">You're all set</p>
              <h2 className="text-[28px] font-bold text-zinc-900 tracking-tight mb-1.5">
                Welcome to Projex{firstName ? `, ${firstName}` : ''}. 👋
              </h2>
              <p className="text-zinc-400 text-[14px] mb-10">
                Your workspace is ready. Where do you want to start?
              </p>
              <div className="space-y-3">
                {FIRST_ACTIONS.map(action => (
                  <a
                    key={action.id}
                    href={action.href}
                    className="flex items-center gap-4 px-5 py-4 bg-zinc-50 hover:bg-zinc-100 rounded-2xl transition-all group border border-transparent hover:border-zinc-200"
                  >
                    <span className="text-2xl leading-none">{action.icon}</span>
                    <div className="flex-1">
                      <p className="text-[14px] font-semibold text-zinc-900">{action.title}</p>
                      <p className="text-[12px] text-zinc-400 mt-0.5">{action.desc}</p>
                    </div>
                    <svg className="w-4 h-4 text-zinc-300 group-hover:text-zinc-600 transition-colors shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                  </a>
                ))}
              </div>
              <button
                onClick={() => { window.location.href = '/access' }}
                className="w-full mt-6 py-3 text-[13px] text-zinc-400 hover:text-zinc-700 transition-colors"
              >
                Go to my workspace →
              </button>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 px-4 py-3 bg-red-50 rounded-xl text-[12px] text-red-700 border border-red-100">
              {error}
            </div>
          )}

          {/* CTA — hidden on step 5 which has its own action links */}
          {step < 5 && <div className="mt-10 flex items-center gap-4">
            {step > 1 && (
              <button
                onClick={() => setStep(s => s - 1)}
                className="px-5 py-3.5 text-[13px] font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
              >
                ← Back
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={!canContinue() || saving}
              className="flex-1 py-3.5 bg-zinc-900 text-white rounded-xl text-[14px] font-semibold hover:bg-zinc-700 transition-colors disabled:opacity-40 active:scale-[0.99]"
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Setting up your workspace...
                </span>
              ) : step === 4 ? (
                'Finish setup →'
              ) : (
                'Continue →'
              )}
            </button>
          </div>}
        </div>
      </div>
    </div>
  )
}
