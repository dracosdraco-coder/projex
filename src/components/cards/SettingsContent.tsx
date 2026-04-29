'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useSubscription } from '@/hooks/useSubscription'
import { PlanId } from '@/lib/stripe-plans'
import { createBrowserClient } from '@supabase/ssr'
import { User, CreditCard, Package, Bell, Shield, LogOut, ChevronRight, Check, Plus, Minus, ExternalLink, Building2, Gift, Copy } from 'lucide-react'

const PLANS = [
  { id: 'duo', name: 'Duo', price: 19.99, annual: 16.99, users: 2, features: ['Up to 2 users', '5 active projects', 'Estimates & invoices', 'Calendar & scheduling'], current: false },
  { id: 'team', name: 'Team', price: 49.99, annual: 41.99, users: 5, features: ['Up to 5 users', 'Unlimited projects', 'Proposal builder', 'Budget tracking & KPIs', 'Team management'], current: true },
  { id: 'business', name: 'Business', price: 99.99, annual: 83.99, users: 10, features: ['Up to 10 users', 'Multi-branch management', 'Advanced reporting', 'Custom templates'], current: false },
  { id: 'enterprise', name: 'Enterprise', price: 149.99, annual: 124.99, users: 20, features: ['Up to 20 users', 'API access', 'Custom integrations', 'SSO & advanced security'], current: false },
]

const ADDONS = [
  { id: 'ai-estimating', name: 'AI Estimating', price: 19, desc: 'Auto-generate estimates from plans & photos', active: false },
  { id: 'advanced-reports', name: 'Advanced Reports', price: 12, desc: 'Custom dashboards, profit analysis, export to Excel', active: true },
  { id: 'client-portal', name: 'Client Portal', price: 15, desc: 'Branded portal for approvals, payments & updates', active: false },
  { id: 'storage-plus', name: 'Storage Plus', price: 9, desc: 'Additional 50 GB document & photo storage', active: false },
  { id: 'gps-tracking', name: 'GPS Tracking', price: 14, desc: 'Live crew tracking, geofenced clock-in/out', active: false },
  { id: 'quickbooks', name: 'Quickbooks Sync', price: 11, desc: 'Two-way sync with QuickBooks Online', active: false },
]

type Tab = 'account' | 'organization' | 'subscription' | 'addons' | 'billing' | 'notifications' | 'security' | 'referral'

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: 'account', label: 'Account', icon: User },
  { id: 'organization', label: 'Organization', icon: Building2 },
  { id: 'subscription', label: 'Subscription', icon: Package },
  { id: 'addons', label: 'Add-ons', icon: Plus },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'referral', label: 'Refer & Earn', icon: Gift },
]

function UsageDashboard({ plan }: { plan: string }) {
  const { user } = useAuth()
  const [usage, setUsage] = useState({ projects: 0, members: 0, documents: 0, maxProjects: 0, maxMembers: 0 })

  useEffect(() => {
    if (!user?.id) return
    const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const limits: Record<string, { p: number; m: number }> = {
      free: { p: 1, m: 1 }, duo: { p: 5, m: 2 }, team: { p: 25, m: 5 },
      business: { p: 100, m: 10 }, enterprise: { p: 999, m: 20 },
    }
    const lim = limits[plan] || limits.free

    Promise.all([
      sb.from('projects').select('id', { count: 'exact', head: true }),
      sb.from('org_members').select('id', { count: 'exact', head: true }),
      sb.from('documents').select('id', { count: 'exact', head: true }),
    ]).then(([p, m, d]) => {
      setUsage({ projects: p.count || 0, members: m.count || 0, documents: d.count || 0, maxProjects: lim.p, maxMembers: lim.m })
    })
  }, [user?.id, plan])

  const bars = [
    { label: 'Projects', used: usage.projects, max: usage.maxProjects },
    { label: 'Team Members', used: usage.members, max: usage.maxMembers },
    { label: 'Documents', used: usage.documents, max: null as number | null },
  ]

  return (
    <div className="space-y-3">
      {bars.map(b => (
        <div key={b.label}>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-600 dark:text-gray-400">{b.label}</span>
            <span className="text-gray-900 dark:text-gray-100 font-medium">{b.used}{b.max ? ` / ${b.max}` : ''}</span>
          </div>
          {b.max && (
            <div className="h-1.5 bg-gray-100 dark:bg-[#222] rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${b.used / b.max > 0.8 ? 'bg-red-500' : 'bg-gray-900 dark:bg-gray-100'}`}
                style={{ width: `${Math.min(100, (b.used / b.max) * 100)}%` }} />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default function SettingsContent() {
  const { user, signOut } = useAuth()
  const subscription = useSubscription()
  const [tab, setTab] = useState<Tab>('account')
  const [annual, setAnnual] = useState(true)
  const [addons, setAddons] = useState(ADDONS)
  const [notifSettings, setNotifSettings] = useState({ email: true, push: true, sms: false, marketing: false })

  // Load notification prefs from profile
  useEffect(() => {
    if (!user?.id) return
    const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    supabase.from('profiles').select('notification_prefs').eq('id', user.id).single()
      .then(({ data }) => {
        if (data?.notification_prefs) {
          try { setNotifSettings(typeof data.notification_prefs === 'string' ? JSON.parse(data.notification_prefs) : data.notification_prefs) } catch {}
        }
      })
  }, [user?.id])

  // Save notification prefs on change
  const updateNotifSetting = (key: string, value: boolean) => {
    const updated = { ...notifSettings, [key]: value }
    setNotifSettings(updated)
    if (!user?.id) return
    const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    supabase.from('profiles').update({ notification_prefs: updated }).eq('id', user.id)
  }

  const toggleAddon = async (id: string) => {
    const addon = addons.find((a: typeof ADDONS[0]) => a.id === id)
    if (!addon) return

    if (addon.active) {
      // Deactivating — just toggle locally (cancellation handled via Stripe portal)
      setAddons((prev: typeof ADDONS) => prev.map((a: typeof ADDONS[0]) => a.id === id ? { ...a, active: false } : a))
      return
    }

    // Activating — start checkout
    try {
      const res = await fetch('/api/addon-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, userEmail: user?.email, addonId: id }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else if (data.code === 'ADDON_NOT_CONFIGURED') {
        // Not yet in Stripe — toggle locally as preview
        setAddons((prev: typeof ADDONS) => prev.map((a: typeof ADDONS[0]) => a.id === id ? { ...a, active: true } : a))
      } else {
        console.error('Addon checkout error:', data.error)
      }
    } catch (err) {
      console.error('Addon checkout failed:', err)
    }
  }
  const activeAddons = addons.filter((a: typeof ADDONS[0]) => a.active)
  const addonTotal = activeAddons.reduce((s: number, a: typeof ADDONS[0]) => s + a.price, 0)
  const currentPlan = PLANS.find((p: typeof PLANS[0]) => p.id === subscription.plan) || PLANS.find((p: typeof PLANS[0]) => p.current) || PLANS[0]
  const planPrice = annual ? currentPlan.annual : currentPlan.price

  // Profile state
  const [fullName, setFullName] = useState('')
  const [company, setCompany] = useState('')
  const [phone, setPhone] = useState('')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  // Load profile from Supabase
  useEffect(() => {
    if (!user?.id) return
    const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    supabase.from('profiles').select('full_name, company, phone').eq('id', user.id).single()
      .then(({ data }) => {
        if (data) {
          setFullName(data.full_name || '')
          setCompany(data.company || '')
          setPhone(data.phone || '')
        }
      })
  }, [user?.id])

  const handleSave = async () => {
    if (!user?.id) return
    setSaveStatus('saving')
    try {
      const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      const { error } = await supabase.from('profiles').update({
        full_name: fullName, company, phone, updated_at: new Date().toISOString()
      }).eq('id', user.id)
      setSaveStatus(error ? 'error' : 'saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch {
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 2000)
    }
  }

  // Organization settings
  const [orgName, setOrgName] = useState('')
  const [orgAddress, setOrgAddress] = useState('')
  const [orgPhone, setOrgPhone] = useState('')
  const [orgEmail, setOrgEmail] = useState('')
  const [orgWebsite, setOrgWebsite] = useState('')
  const [orgSaveStatus, setOrgSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  // Brand color — persisted in localStorage, read by DocumentEditor + PDF generator
  const [brandColor, setBrandColor] = useState('#2563eb')
  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('projex_brand_color') : null
    if (stored) setBrandColor(stored)
  }, [])
  const handleBrandColor = (color: string) => {
    setBrandColor(color)
    if (typeof window !== 'undefined') localStorage.setItem('projex_brand_color', color)
  }
  const [copiedReferral, setCopiedReferral] = useState(false)
  const referralLink = typeof window !== 'undefined' ? `${window.location.origin}/login?ref=${user?.id?.slice(0, 8)}` : ''
  const [referralStats, setReferralStats] = useState({ sent: 0, joined: 0, converted: 0 })

  // Load referral stats
  useEffect(() => {
    if (!user?.id) return
    fetch(`/api/referrals?userId=${user.id}`)
      .then(r => r.json())
      .then(data => { if (data.sent !== undefined) setReferralStats(data) })
      .catch(() => {})
  }, [user?.id])
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(null)
  const [allOrgs, setAllOrgs] = useState<{ id: string; name: string; role: string }[]>([])
  const [switchingOrg, setSwitchingOrg] = useState(false)

  // Load org data + all orgs for switcher
  useEffect(() => {
    if (!user?.id) return
    const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

    // Get current org + org details
    supabase.from('profiles').select('org_id').eq('id', user.id).single()
      .then(({ data: profile }) => {
        if (profile?.org_id) {
          setCurrentOrgId(profile.org_id)
          supabase.from('organizations').select('name, address, phone, email, website').eq('id', profile.org_id).single()
            .then(({ data: org }) => {
              if (org) {
                setOrgName(org.name || '')
                setOrgAddress(org.address || '')
                setOrgPhone(org.phone || '')
                setOrgEmail(org.email || '')
                setOrgWebsite(org.website || '')
              }
            })
        }
      })

    // Get all orgs this user belongs to
    supabase.from('org_members').select('org_id, role, organizations(id, name)').eq('user_id', user.id).eq('status', 'active')
      .then(({ data: memberships }) => {
        if (memberships) {
          setAllOrgs(memberships.map((m: any) => ({
            id: m.org_id,
            name: (m.organizations as any)?.name || 'Unknown',
            role: m.role,
          })))
        }
      })
  }, [user?.id])

  const handleSwitchOrg = async (newOrgId: string) => {
    if (!user?.id || newOrgId === currentOrgId) return
    setSwitchingOrg(true)
    try {
      const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      await supabase.from('profiles').update({ org_id: newOrgId }).eq('id', user.id)
      // Hard reload to re-fetch all data under new org
      window.location.reload()
    } catch {
      setSwitchingOrg(false)
    }
  }

  const handleSaveOrg = async () => {
    if (!user?.id) return
    setOrgSaveStatus('saving')
    try {
      const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', user.id).single()
      if (!profile?.org_id) throw new Error('No org')
      const { error } = await supabase.from('organizations').update({
        name: orgName, address: orgAddress, phone: orgPhone, email: orgEmail, website: orgWebsite,
      }).eq('id', profile.org_id)
      setOrgSaveStatus(error ? 'error' : 'saved')
      setTimeout(() => setOrgSaveStatus('idle'), 2000)
    } catch {
      setOrgSaveStatus('error')
      setTimeout(() => setOrgSaveStatus('idle'), 2000)
    }
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#111] overflow-hidden">
      {/* Header */}
      <div className="px-4 md:px-6 py-4 border-b border-gray-200 dark:border-[#2a2a2a] shrink-0">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Settings</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Manage your account, subscription, and preferences</p>
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Sidebar */}
        <div className="md:w-52 shrink-0 border-b md:border-b-0 md:border-r border-gray-100 dark:border-[#222] bg-gray-50/50 dark:bg-[#0d0d0d]">
          <div className="flex md:flex-col overflow-x-auto md:overflow-x-visible p-2 gap-0.5">
            {TABS.map((t: typeof TABS[0]) => {
              const Icon = t.icon
              return (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium whitespace-nowrap transition-colors ${
                    tab === t.id ? 'bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}>
                  <Icon className="w-4 h-4 shrink-0" />
                  {t.label}
                </button>
              )
            })}
            <div className="hidden md:block mt-auto pt-4">
              <button onClick={() => signOut()} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors w-full">
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {/* ACCOUNT TAB */}
          {tab === 'account' && (
            <div className="max-w-lg space-y-6">
              <div>
                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Profile</h2>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-gray-900 dark:bg-gray-700 flex items-center justify-center text-white text-xl font-bold shrink-0">
                    {(user?.email?.[0] || 'U').toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{user?.email || 'user@email.com'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{currentPlan.name} Plan{subscription.isTrialing ? ' (Trial)' : ''}</p>
                    <button className="text-[12px] text-blue-600 dark:text-blue-400 hover:underline mt-0.5">Change photo</button>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Full name</label>
                    <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your name" className="w-full px-3 py-2 bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-gray-400 dark:focus:border-[#444]" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Email</label>
                    <input type="email" defaultValue={user?.email || ''} disabled className="w-full px-3 py-2 bg-gray-100 dark:bg-[#111] border border-gray-200 dark:border-[#2a2a2a] rounded-lg text-sm text-gray-500 dark:text-gray-400 cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Company</label>
                    <input type="text" value={company} onChange={e => setCompany(e.target.value)} placeholder="Company name" className="w-full px-3 py-2 bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-gray-400 dark:focus:border-[#444]" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Phone</label>
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(555) 000-0000" className="w-full px-3 py-2 bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-gray-400 dark:focus:border-[#444]" />
                  </div>
                </div>
                <button onClick={handleSave} className={`mt-4 px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  saveStatus === 'saved' ? 'bg-green-600 text-white' : saveStatus === 'error' ? 'bg-red-600 text-white' : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-200'
                }`}>
                  {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved ✓' : saveStatus === 'error' ? 'Error — retry' : 'Save changes'}
                </button>
              </div>
            </div>
          )}

          {/* ORGANIZATION TAB */}
          {tab === 'organization' && (
            <div className="max-w-lg space-y-6">
              <div>
                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Organization</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Your organization is the shared workspace where your team collaborates. All projects, documents, and data belong to the organization.</p>

                {/* Org Switcher */}
                {allOrgs.length > 1 && (
                  <div className="mb-6 p-3 bg-gray-50 dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#2a2a2a]">
                    <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Switch Organization</label>
                    <div className="space-y-1.5">
                      {allOrgs.map(org => (
                        <button key={org.id} onClick={() => handleSwitchOrg(org.id)} disabled={switchingOrg}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                            org.id === currentOrgId
                              ? 'bg-white dark:bg-[#222] border border-gray-300 dark:border-[#444] shadow-sm'
                              : 'hover:bg-white dark:hover:bg-[#222] border border-transparent'
                          }`}>
                          <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-[#333] flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300">
                            {org.name?.[0]?.toUpperCase() || 'O'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{org.name}</p>
                            <p className="text-[10px] text-gray-400 capitalize">{org.role}</p>
                          </div>
                          {org.id === currentOrgId && (
                            <Check className="w-4 h-4 text-green-500 shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                    {switchingOrg && <p className="text-[10px] text-gray-400 mt-2 text-center">Switching...</p>}
                  </div>
                )}
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Organization Name</label>
                    <input type="text" value={orgName} onChange={e => setOrgName(e.target.value)} placeholder="My Company"
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-gray-400 dark:focus:border-[#444]" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Business Address</label>
                    <input type="text" value={orgAddress} onChange={e => setOrgAddress(e.target.value)} placeholder="123 Main St, Miami, FL"
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-gray-400 dark:focus:border-[#444]" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Business Phone</label>
                    <input type="tel" value={orgPhone} onChange={e => setOrgPhone(e.target.value)} placeholder="(305) 555-0100"
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-gray-400 dark:focus:border-[#444]" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Business Email</label>
                    <input type="email" value={orgEmail} onChange={e => setOrgEmail(e.target.value)} placeholder="info@company.com"
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-gray-400 dark:focus:border-[#444]" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Website</label>
                    <input type="url" value={orgWebsite} onChange={e => setOrgWebsite(e.target.value)} placeholder="https://company.com"
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-gray-400 dark:focus:border-[#444]" />
                  </div>
                </div>
                <button onClick={handleSaveOrg} className={`mt-4 px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  orgSaveStatus === 'saved' ? 'bg-green-600 text-white' : orgSaveStatus === 'error' ? 'bg-red-600 text-white' : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-200'
                }`}>
                  {orgSaveStatus === 'saving' ? 'Saving...' : orgSaveStatus === 'saved' ? 'Saved ✓' : orgSaveStatus === 'error' ? 'Error — retry' : 'Save Organization'}
                </button>
              </div>

              {/* Document Branding */}
              <div className="pt-4 border-t border-gray-100 dark:border-[#222]">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Document Branding</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Choose an accent color applied to your document headers, section highlights, and PDF exports.</p>
                <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Accent Color</label>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {['#2563eb', '#7c3aed', '#dc2626', '#16a34a', '#d97706', '#0891b2', '#be185d', '#374151'].map(c => (
                    <button key={c} onClick={() => handleBrandColor(c)} title={c}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${brandColor === c ? 'scale-110' : 'border-transparent hover:scale-105'}`}
                      style={{ backgroundColor: c, borderColor: brandColor === c ? '#111' : 'transparent' }} />
                  ))}
                  <label className="relative w-7 h-7 rounded-full overflow-hidden cursor-pointer border border-gray-200 dark:border-[#333] hover:scale-105 transition-all" title="Custom color">
                    <div className="absolute inset-0 rounded-full" style={{ background: 'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)' }} />
                    <input type="color" value={brandColor} onChange={e => handleBrandColor(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                  </label>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a]">
                  <div className="w-4 h-full min-h-[40px] rounded-sm" style={{ backgroundColor: brandColor }} />
                  <div>
                    <p className="text-xs font-medium text-gray-900 dark:text-gray-100">Preview</p>
                    <p className="text-[10px] font-mono text-gray-500 dark:text-gray-400">{brandColor}</p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: brandColor }}>ESTIMATE</p>
                    <p className="text-[15px] font-black tabular-nums" style={{ color: brandColor }}>$4,200.00</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUBSCRIPTION TAB */}
          {tab === 'subscription' && (
            <div className="max-w-2xl space-y-6">
              <div>
                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Current Plan</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">You&apos;re on the <strong className="text-gray-900 dark:text-gray-100">{currentPlan.name}</strong> plan, billed {annual ? 'annually' : 'monthly'}.</p>
                {subscription.isTrialing && subscription.trialDaysLeft > 0 && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mb-4">{subscription.trialDaysLeft} day{subscription.trialDaysLeft !== 1 ? 's' : ''} remaining in your free trial</p>
                )}
                {subscription.status === 'past_due' && (
                  <p className="text-xs text-red-600 dark:text-red-400 mb-4">Payment past due — please update your payment method</p>
                )}
                <div className="flex items-center gap-3 mb-6">
                  <div className="inline-flex items-center bg-gray-100 dark:bg-[#1a1a1a] rounded-full p-0.5">
                    <button onClick={() => setAnnual(false)} className={`px-4 py-1.5 rounded-full text-[12px] font-medium transition-all ${!annual ? 'bg-white dark:bg-[#2a2a2a] shadow-sm text-gray-900 dark:text-gray-100' : 'text-gray-500'}`}>Monthly</button>
                    <button onClick={() => setAnnual(true)} className={`px-4 py-1.5 rounded-full text-[12px] font-medium transition-all ${annual ? 'bg-white dark:bg-[#2a2a2a] shadow-sm text-gray-900 dark:text-gray-100' : 'text-gray-500'}`}>Annual</button>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {PLANS.map((plan: typeof PLANS[0]) => (
                  <div key={plan.id} className={`relative rounded-xl p-5 border-2 transition-all ${
                    plan.id === subscription.plan ? 'border-gray-900 dark:border-gray-100 bg-gray-50 dark:bg-[#1a1a1a]' : 'border-gray-200 dark:border-[#2a2a2a] hover:border-gray-300 dark:hover:border-[#333]'
                  }`}>
                    {plan.id === subscription.plan && <div className="absolute -top-2 right-3 px-2 py-0.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded text-[10px] font-semibold uppercase tracking-wide">Current</div>}
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{plan.name}</h3>
                    <div className="mb-3">
                      <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">${annual ? plan.annual : plan.price}</span>
                      <span className="text-xs text-gray-500">/mo</span>
                    </div>
                    <ul className="space-y-1.5 mb-4">
                      {plan.features.map((f: string) => (
                        <li key={f} className="text-[12px] text-gray-600 dark:text-gray-400 flex items-start gap-1.5">
                          <Check className="w-3 h-3 mt-0.5 text-green-600 shrink-0" />{f}
                        </li>
                      ))}
                    </ul>
                    {plan.id !== subscription.plan && (
                      <button 
                        onClick={() => subscription.startCheckout(plan.id as PlanId, annual ? 'annual' : 'monthly')}
                        className="w-full py-2 rounded-lg text-[12px] font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-200 transition-colors">
                        {PLANS.indexOf(plan) > PLANS.indexOf(currentPlan) ? 'Upgrade' : 'Downgrade'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className="pt-4 border-t border-gray-100 dark:border-[#222]">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Plan: {currentPlan.name}</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">${planPrice}/mo</span>
                </div>
                {addonTotal > 0 && (
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-gray-500 dark:text-gray-400">Add-ons ({activeAddons.length})</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">+${addonTotal}/mo</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm mt-2 pt-2 border-t border-gray-100 dark:border-[#222]">
                  <span className="font-medium text-gray-900 dark:text-gray-100">Total</span>
                  <span className="text-lg font-bold text-gray-900 dark:text-gray-100">${planPrice + addonTotal}/mo</span>
                </div>
              </div>

              {/* Usage Dashboard */}
              <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#2a2a2a] p-5">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Usage</h3>
                <UsageDashboard plan={subscription.plan} />
              </div>
            </div>
          )}

          {/* ADDONS TAB */}
          {tab === 'addons' && (
            <div className="max-w-2xl space-y-6">
              <div>
                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Add-ons</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Extend your plan with powerful extras. Toggle on/off anytime.</p>
              </div>
              <div className="space-y-3">
                {addons.map((addon: typeof ADDONS[0]) => (
                  <div key={addon.id} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                    addon.active ? 'border-gray-900 dark:border-gray-400 bg-gray-50 dark:bg-[#1a1a1a]' : 'border-gray-200 dark:border-[#2a2a2a]'
                  }`}>
                    <div className="min-w-0 mr-4">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">{addon.name}</h3>
                        <span className="text-[11px] font-semibold text-gray-500 tabular-nums">+${addon.price}/mo</span>
                      </div>
                      <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-0.5">{addon.desc}</p>
                    </div>
                    <button onClick={() => toggleAddon(addon.id)} className={`shrink-0 w-11 h-6 rounded-full transition-colors relative ${addon.active ? 'bg-green-500' : 'bg-gray-200 dark:bg-[#333]'}`}>
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${addon.active ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                ))}
              </div>
              {activeAddons.length > 0 && (
                <div className="pt-3 border-t border-gray-100 dark:border-[#222] flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">{activeAddons.length} add-on{activeAddons.length !== 1 ? 's' : ''} active</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">+${addonTotal}/mo</span>
                </div>
              )}
            </div>
          )}

          {/* BILLING TAB */}
          {tab === 'billing' && (
            <div className="max-w-lg space-y-6">
              <div>
                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Payment Method</h2>
                <div className="p-4 bg-gray-50 dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#2a2a2a] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-7 bg-gray-900 dark:bg-[#333] rounded flex items-center justify-center text-white text-[10px] font-bold">VISA</div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">&bull;&bull;&bull;&bull; &bull;&bull;&bull;&bull; &bull;&bull;&bull;&bull; 4242</p>
                      <p className="text-[11px] text-gray-500">Expires 12/27</p>
                    </div>
                  </div>
                  <button className="text-[12px] text-blue-600 dark:text-blue-400 hover:underline">Update</button>
                </div>
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Billing History</h2>
                <div className="space-y-2">
                  {[
                    { date: 'Mar 1, 2026', amount: '$78.00', status: 'Paid' },
                    { date: 'Feb 1, 2026', amount: '$78.00', status: 'Paid' },
                    { date: 'Jan 1, 2026', amount: '$78.00', status: 'Paid' },
                  ].map((inv: { date: string; amount: string; status: string }) => (
                    <div key={inv.date} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors">
                      <div>
                        <p className="text-sm text-gray-900 dark:text-gray-100">{inv.date}</p>
                        <p className="text-[11px] text-gray-500">{currentPlan.name} Plan + Add-ons</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{inv.amount}</span>
                        <span className="text-[10px] px-2 py-0.5 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full font-medium">{inv.status}</span>
                        <ExternalLink className="w-3.5 h-3.5 text-gray-400 cursor-pointer hover:text-gray-600" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={async () => {
                try {
                  const res = await fetch('/api/billing-portal', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: user?.id }),
                  })
                  const data = await res.json()
                  if (data.url) window.location.href = data.url
                } catch {}
              }}
                className="w-full py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl text-sm font-medium hover:bg-gray-700 dark:hover:bg-gray-200 transition-colors">
                Manage Billing on Stripe
              </button>
            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {tab === 'notifications' && (
            <div className="max-w-lg space-y-6">
              <div>
                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Notification Preferences</h2>
                <div className="space-y-3">
                  {([
                    { key: 'email' as const, label: 'Email notifications', desc: 'Project updates, task assignments, and reminders' },
                    { key: 'push' as const, label: 'Push notifications', desc: 'Real-time alerts in your browser' },
                    { key: 'sms' as const, label: 'SMS notifications', desc: 'Critical alerts via text message' },
                    { key: 'marketing' as const, label: 'Product updates', desc: 'New features, tips, and company news' },
                  ]).map((n) => (
                    <div key={n.key} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-[#222]">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{n.label}</p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">{n.desc}</p>
                      </div>
                      <button onClick={() => updateNotifSetting(n.key, !notifSettings[n.key])}
                        className={`shrink-0 w-11 h-6 rounded-full transition-colors relative ${notifSettings[n.key] ? 'bg-green-500' : 'bg-gray-200 dark:bg-[#333]'}`}>
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${notifSettings[n.key] ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SECURITY TAB */}
          {tab === 'security' && (
            <div className="max-w-lg space-y-6">
              <div>
                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Security</h2>
                <div className="space-y-3">
                  <div className="p-4 rounded-xl border border-gray-200 dark:border-[#2a2a2a]">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Password</p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">Last changed 30 days ago</p>
                      </div>
                      <button className="text-[12px] text-blue-600 dark:text-blue-400 hover:underline">Change</button>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl border border-gray-200 dark:border-[#2a2a2a]">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Two-factor authentication</p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">Add an extra layer of security</p>
                      </div>
                      <button className="text-[12px] px-3 py-1 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-200 transition-colors">Enable</button>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl border border-gray-200 dark:border-[#2a2a2a]">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Active sessions</p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">1 device currently signed in</p>
                      </div>
                      <button className="text-[12px] text-red-500 hover:underline">Sign out all</button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-100 dark:border-[#222]">
                <h2 className="text-sm font-semibold text-red-600 mb-2">Danger Zone</h2>
                <p className="text-[12px] text-gray-500 dark:text-gray-400 mb-3">Permanently delete your account and all data. This cannot be undone.</p>
                <button className="px-4 py-2 border border-red-200 dark:border-red-900/30 text-red-600 rounded-lg text-[12px] font-medium hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">
                  Delete account
                </button>
              </div>
            </div>
          )}

          {/* REFERRAL TAB */}
          {tab === 'referral' && (
            <div className="max-w-lg space-y-6">
              <div>
                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Refer & Earn</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">Share Projex with other contractors. When they subscribe, you both get rewarded.</p>

                <div className="bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-100 dark:to-gray-200 rounded-2xl p-6 mb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Gift className="w-8 h-8 text-amber-400 dark:text-amber-600" />
                    <div>
                      <p className="text-lg font-bold text-white dark:text-gray-900">1 Month Free</p>
                      <p className="text-xs text-gray-400 dark:text-gray-600">For every friend who subscribes to a paid plan</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    <div className="bg-white/10 dark:bg-gray-900/10 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold text-white dark:text-gray-900">{referralStats.sent}</p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-600">Invites Sent</p>
                    </div>
                    <div className="bg-white/10 dark:bg-gray-900/10 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold text-white dark:text-gray-900">{referralStats.joined}</p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-600">Signed Up</p>
                    </div>
                    <div className="bg-white/10 dark:bg-gray-900/10 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold text-amber-400 dark:text-amber-600">{referralStats.converted}</p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-600">Subscribed</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#2a2a2a] p-5">
                  <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Your Referral Link</label>
                  <div className="flex gap-2">
                    <input type="text" readOnly value={referralLink}
                      className="flex-1 px-3 py-2 bg-gray-50 dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-lg text-xs text-gray-700 dark:text-gray-300" />
                    <button onClick={() => { navigator.clipboard.writeText(referralLink); setCopiedReferral(true); setTimeout(() => setCopiedReferral(false), 2000) }}
                      className="px-3 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-xs font-medium hover:bg-gray-700 dark:hover:bg-gray-200 transition-colors flex items-center gap-1.5">
                      {copiedReferral ? <><Check className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                    </button>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="text-xs font-semibold text-gray-900 dark:text-gray-100 mb-3">How it works</h3>
                  <div className="space-y-3">
                    {[
                      { step: '1', title: 'Share your link', desc: 'Send your unique referral link to other contractors or GCs.' },
                      { step: '2', title: 'They sign up', desc: 'Your friend creates a Projex account using your link.' },
                      { step: '3', title: 'They subscribe', desc: 'When they choose a paid plan, you both get 1 month free.' },
                    ].map(s => (
                      <div key={s.step} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{s.step}</div>
                        <div>
                          <p className="text-xs font-medium text-gray-900 dark:text-gray-100">{s.title}</p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400">{s.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
