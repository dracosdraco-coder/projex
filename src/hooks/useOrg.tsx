'use client'

import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { useAuth } from '@/context/AuthContext'
import { createBrowserClient } from '@supabase/ssr'

interface Org {
  id: string
  name: string
  ownerId: string
  logoUrl?: string
  address?: string
  phone?: string
  email?: string
  website?: string
  settings?: Record<string, any>
}

interface OrgMember {
  id: string
  orgId: string
  userId: string | null
  email: string
  name: string
  role: string
  status: string
  joinedAt: string | null
}

interface OrgContextType {
  org: Org | null
  orgId: string | null
  members: OrgMember[]
  myRole: string | null
  loading: boolean
  isOwner: boolean
  isAdmin: boolean
  refreshOrg: () => Promise<void>
  refreshMembers: () => Promise<void>
  updateOrg: (updates: Partial<Org>) => Promise<void>
}

const OrgContext = createContext<OrgContextType>({
  org: null, orgId: null, members: [], myRole: null,
  loading: true, isOwner: false, isAdmin: false,
  refreshOrg: async () => {}, refreshMembers: async () => {},
  updateOrg: async () => {},
})

export function useOrg() {
  return useContext(OrgContext)
}

export function OrgProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [org, setOrg] = useState<Org | null>(null)
  const [members, setMembers] = useState<OrgMember[]>([])
  const [myRole, setMyRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const loadOrg = useCallback(async () => {
    if (!user?.id) { setLoading(false); return }

    try {
      // Get user's org from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('id', user.id)
        .single()

      if (!profile?.org_id) {
        // Fallback: check org_members
        const { data: membership } = await supabase
          .from('org_members')
          .select('org_id, role')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .limit(1)
          .single()

        if (!membership) { setLoading(false); return }

        // Update profile with org_id
        await supabase.from('profiles').update({ org_id: membership.org_id }).eq('id', user.id)
        
        setMyRole(membership.role)
        await loadOrgDetails(membership.org_id)
        return
      }

      // Get my role
      const { data: membership } = await supabase
        .from('org_members')
        .select('role')
        .eq('org_id', profile.org_id)
        .eq('user_id', user.id)
        .single()

      setMyRole(membership?.role || null)
      await loadOrgDetails(profile.org_id)
    } catch (err) {
      console.error('Failed to load org:', err)
      setLoading(false)
    }
  }, [user?.id])

  const loadOrgDetails = async (orgId: string) => {
    const { data: orgData } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', orgId)
      .single()

    if (orgData) {
      setOrg({
        id: orgData.id,
        name: orgData.name,
        ownerId: orgData.owner_id,
        logoUrl: orgData.logo_url,
        address: orgData.address,
        phone: orgData.phone,
        email: orgData.email,
        website: orgData.website,
        settings: orgData.settings,
      })
    }

    await loadMembers(orgId)
    setLoading(false)
  }

  const loadMembers = async (orgId: string) => {
    const { data } = await supabase
      .from('org_members')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: true })

    if (data) {
      setMembers(data.map((m: any) => ({
        id: m.id,
        orgId: m.org_id,
        userId: m.user_id,
        email: m.email,
        name: m.name || '',
        role: m.role,
        status: m.status,
        joinedAt: m.joined_at,
      })))
    }
  }

  const refreshOrg = useCallback(async () => {
    if (org?.id) await loadOrgDetails(org.id)
  }, [org?.id])

  const refreshMembers = useCallback(async () => {
    if (org?.id) await loadMembers(org.id)
  }, [org?.id])

  const updateOrg = useCallback(async (updates: Partial<Org>) => {
    if (!org?.id) return
    const dbUpdates: Record<string, any> = {}
    if (updates.name !== undefined) dbUpdates.name = updates.name
    if (updates.address !== undefined) dbUpdates.address = updates.address
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone
    if (updates.email !== undefined) dbUpdates.email = updates.email
    if (updates.website !== undefined) dbUpdates.website = updates.website
    if (updates.logoUrl !== undefined) dbUpdates.logo_url = updates.logoUrl

    await supabase.from('organizations').update(dbUpdates).eq('id', org.id)
    setOrg(prev => prev ? { ...prev, ...updates } : prev)
  }, [org?.id])

  useEffect(() => { loadOrg() }, [loadOrg])

  const isOwner = myRole === 'owner'
  const isAdmin = myRole === 'owner' || myRole === 'admin'

  return (
    <OrgContext.Provider value={{
      org, orgId: org?.id || null, members, myRole, loading,
      isOwner, isAdmin, refreshOrg, refreshMembers, updateOrg,
    }}>
      {children}
    </OrgContext.Provider>
  )
}
