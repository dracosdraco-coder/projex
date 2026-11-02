'use client'

import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'

interface Membership { orgId: string; name: string; role: string }

export default function UserProfileDropdown() {
  const { user, signOut } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [orgs, setOrgs] = useState<Membership[]>([])
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null)
  const [switching, setSwitching] = useState<string | null>(null)

  // Orgs this user belongs to, for the switcher (only shown with 2+)
  useEffect(() => {
    if (!user?.id) return
    Promise.all([
      supabase.from('org_members').select('org_id, role, organizations(name)')
        .eq('user_id', user.id).eq('status', 'active'),
      supabase.from('profiles').select('org_id').eq('id', user.id).single(),
    ]).then(([{ data: rows }, { data: profile }]) => {
      setOrgs((rows || []).map((r: any) => ({ orgId: r.org_id, name: r.organizations?.name || 'Organization', role: r.role })))
      setActiveOrgId(profile?.org_id || null)
    })
  }, [user?.id])

  const switchOrg = async (orgId: string) => {
    if (orgId === activeOrgId) return
    setSwitching(orgId)
    const res = await fetch('/api/org/switch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orgId }),
    })
    if (res.ok) {
      // All data hooks key off the active org — reload to refetch everything cleanly
      window.location.href = '/access'
    } else {
      const data = await res.json().catch(() => ({}))
      alert(data.error || 'Could not switch organization')
      setSwitching(null)
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!user) return null

  // Get user's name from metadata or use email
  const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
  const userEmail = user.email || ''
  
  const initials = userName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase() || userEmail[0]?.toUpperCase() || 'U'

  const handleSignOut = async () => {
    setIsOpen(false)
    await signOut()
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-3 py-2 hover:bg-gray-200 dark:hover:bg-[#2a2a2a] rounded-lg transition-colors"
      >
        {/* Avatar */}
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
          {initials}
        </div>
        
        {/* Name (hidden on mobile) */}
        <div className="hidden md:block text-left">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {userName}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {userEmail}
          </p>
        </div>

        {/* Chevron */}
        <svg 
          className={`w-4 h-4 text-gray-600 dark:text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white/95 dark:bg-[#1e1e1e]/95 backdrop-blur-md rounded-xl shadow-xl border border-gray-200 dark:border-[#2a2a2a] z-50 overflow-hidden">
          {/* User Info Header */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-[#2a2a2a]">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {userName}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {userEmail}
            </p>
          </div>

          {/* Org switcher */}
          {orgs.length > 1 && (
            <div className="py-2 border-b border-gray-200 dark:border-[#2a2a2a]">
              <p className="px-4 pb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">Organizations</p>
              {orgs.map(o => (
                <button key={o.orgId} onClick={() => switchOrg(o.orgId)} disabled={!!switching}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors flex items-center gap-3 disabled:opacity-60">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${o.orgId === activeOrgId ? 'bg-green-500' : 'bg-gray-300 dark:bg-[#444]'}`} />
                  <span className="flex-1 min-w-0">
                    <span className="block truncate text-gray-900 dark:text-gray-100">{o.name}</span>
                    <span className="block text-[10px] text-gray-400 capitalize">{o.role}</span>
                  </span>
                  {switching === o.orgId && <span className="text-[10px] text-gray-400">Switching…</span>}
                </button>
              ))}
            </div>
          )}

          {/* Menu Items */}
          <div className="py-2">
            <button
              onClick={() => {
                setIsOpen(false)
                window.location.href = '/access?card=settings'
              }}
              className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors flex items-center gap-3"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </button>

            <button
              onClick={() => {
                setIsOpen(false)
                window.location.href = '/profile'
              }}
              className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors flex items-center gap-3"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Profile
            </button>
          </div>

          {/* Logout */}
          <div className="border-t border-gray-200 dark:border-[#2a2a2a] py-2">
            <button
              onClick={handleSignOut}
              className="w-full px-4 py-2.5 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-3"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
