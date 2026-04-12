'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

// ---- Role definitions ----

export type UserRole = 'owner' | 'admin' | 'manager' | 'supervisor' | 'worker' | 'viewer'

export interface Permission {
  projects: { create: boolean; edit: boolean; delete: boolean; view: boolean }
  tasks: { create: boolean; edit: boolean; delete: boolean; view: boolean; assign: boolean }
  documents: { create: boolean; edit: boolean; delete: boolean; view: boolean; send: boolean; viewCost: boolean }
  team: { invite: boolean; remove: boolean; editRoles: boolean; view: boolean }
  finances: { viewBudget: boolean; viewProfit: boolean; addExpense: boolean; viewInvoices: boolean }
  settings: { editCompany: boolean; manageTemplates: boolean; manageBranches: boolean; manageBilling: boolean }
}

const ROLE_PERMISSIONS: Record<UserRole, Permission> = {
  owner: {
    projects: { create: true, edit: true, delete: true, view: true },
    tasks: { create: true, edit: true, delete: true, view: true, assign: true },
    documents: { create: true, edit: true, delete: true, view: true, send: true, viewCost: true },
    team: { invite: true, remove: true, editRoles: true, view: true },
    finances: { viewBudget: true, viewProfit: true, addExpense: true, viewInvoices: true },
    settings: { editCompany: true, manageTemplates: true, manageBranches: true, manageBilling: true },
  },
  admin: {
    projects: { create: true, edit: true, delete: true, view: true },
    tasks: { create: true, edit: true, delete: true, view: true, assign: true },
    documents: { create: true, edit: true, delete: true, view: true, send: true, viewCost: true },
    team: { invite: true, remove: true, editRoles: false, view: true },
    finances: { viewBudget: true, viewProfit: true, addExpense: true, viewInvoices: true },
    settings: { editCompany: true, manageTemplates: true, manageBranches: true, manageBilling: false },
  },
  manager: {
    projects: { create: true, edit: true, delete: false, view: true },
    tasks: { create: true, edit: true, delete: true, view: true, assign: true },
    documents: { create: true, edit: true, delete: false, view: true, send: true, viewCost: true },
    team: { invite: false, remove: false, editRoles: false, view: true },
    finances: { viewBudget: true, viewProfit: false, addExpense: true, viewInvoices: true },
    settings: { editCompany: false, manageTemplates: true, manageBranches: false, manageBilling: false },
  },
  supervisor: {
    projects: { create: false, edit: true, delete: false, view: true },
    tasks: { create: true, edit: true, delete: false, view: true, assign: true },
    documents: { create: true, edit: true, delete: false, view: true, send: false, viewCost: false },
    team: { invite: false, remove: false, editRoles: false, view: true },
    finances: { viewBudget: false, viewProfit: false, addExpense: true, viewInvoices: false },
    settings: { editCompany: false, manageTemplates: false, manageBranches: false, manageBilling: false },
  },
  worker: {
    projects: { create: false, edit: false, delete: false, view: true },
    tasks: { create: false, edit: true, delete: false, view: true, assign: false },
    documents: { create: false, edit: false, delete: false, view: true, send: false, viewCost: false },
    team: { invite: false, remove: false, editRoles: false, view: true },
    finances: { viewBudget: false, viewProfit: false, addExpense: false, viewInvoices: false },
    settings: { editCompany: false, manageTemplates: false, manageBranches: false, manageBilling: false },
  },
  viewer: {
    projects: { create: false, edit: false, delete: false, view: true },
    tasks: { create: false, edit: false, delete: false, view: true, assign: false },
    documents: { create: false, edit: false, delete: false, view: true, send: false, viewCost: false },
    team: { invite: false, remove: false, editRoles: false, view: false },
    finances: { viewBudget: false, viewProfit: false, addExpense: false, viewInvoices: false },
    settings: { editCompany: false, manageTemplates: false, manageBranches: false, manageBilling: false },
  },
}

export function getPermissions(role: UserRole): Permission {
  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.viewer
}

export const ROLE_LABELS: Record<UserRole, { label: string; description: string; color: string }> = {
  owner: { label: 'Owner', description: 'Full access. Manages billing and team.', color: 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/20' },
  admin: { label: 'Admin', description: 'Full access except billing and role changes.', color: 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/20' },
  manager: { label: 'Manager', description: 'Create projects, manage docs, view budgets.', color: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20' },
  supervisor: { label: 'Supervisor', description: 'Edit projects, assign tasks, submit expenses.', color: 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20' },
  worker: { label: 'Worker', description: 'View projects, update assigned tasks.', color: 'text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-800' },
  viewer: { label: 'Viewer', description: 'Read-only access to projects and docs.', color: 'text-gray-400 bg-gray-50 dark:text-gray-500 dark:bg-gray-800' },
}

// ---- Context ----

interface RolesContextType {
  role: UserRole
  permissions: Permission
  loading: boolean
  can: (area: keyof Permission, action: string) => boolean
  setMemberRole: (memberId: string, newRole: UserRole) => Promise<void>
}

const RolesContext = createContext<RolesContextType | undefined>(undefined)

export function RolesProvider({ children, userId }: { children: React.ReactNode; userId?: string }) {
  const [role, setRole] = useState<UserRole>('owner')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) { setLoading(false); return }
    loadRole(userId)
  }, [userId])

  const loadRole = async (uid: string) => {
    setLoading(true)
    try {
      // Get org_id from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('id', uid)
        .single()

      if (profile?.org_id) {
        // Get role from org_members
        const { data: membership } = await supabase
          .from('org_members')
          .select('role')
          .eq('org_id', profile.org_id)
          .eq('user_id', uid)
          .single()

        if (membership?.role && membership.role in ROLE_PERMISSIONS) {
          setRole(membership.role as UserRole)
        } else {
          setRole('owner')
        }
      } else {
        // Fallback to user_roles table (pre-migration)
        const { data } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', uid)
          .single()

        if (data?.role && data.role in ROLE_PERMISSIONS) {
          setRole(data.role as UserRole)
        } else {
          setRole('owner')
        }
      }
    } catch {
      setRole('owner')
    } finally {
      setLoading(false)
    }
  }

  const permissions = ROLE_PERMISSIONS[role]

  const can = useCallback((area: keyof Permission, action: string): boolean => {
    const areaPerms = permissions[area] as Record<string, boolean>
    return areaPerms?.[action] ?? false
  }, [permissions])

  const setMemberRole = useCallback(async (memberId: string, newRole: UserRole) => {
    if (role !== 'owner' && role !== 'admin') throw new Error('Insufficient permissions')
    if (newRole === 'owner' && role !== 'owner') throw new Error('Only owners can transfer ownership')

    const { error } = await supabase
      .from('org_members')
      .update({ role: newRole })
      .eq('id', memberId)

    if (error) throw error
  }, [role])

  return (
    <RolesContext.Provider value={{ role, permissions, loading, can, setMemberRole }}>
      {children}
    </RolesContext.Provider>
  )
}

export function useRoles() {
  const context = useContext(RolesContext)
  if (!context) throw new Error('useRoles must be used within RolesProvider')
  return context
}

// Convenience component for conditional rendering
export function CanDo({ area, action, children, fallback = null }: {
  area: keyof Permission; action: string; children: React.ReactNode; fallback?: React.ReactNode
}) {
  const { can } = useRoles()
  return can(area, action) ? <>{children}</> : <>{fallback}</>
}
