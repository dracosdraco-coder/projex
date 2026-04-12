'use client'

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface Lead {
  id: string
  name: string
  email: string
  phone: string
  company: string
  source: string
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost'
  value: number
  notes: string
  address: string
  projectType: string
  createdAt: string
  lastContactAt: string
}

export function useLeads(userId: string | undefined, orgId?: string | null) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(false)

  const loadLeads = useCallback(async () => {
    if (!userId) return []
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq(orgId ? 'org_id' : 'user_id', orgId || userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      const mapped: Lead[] = (data || []).map((l: any) => ({
        id: l.id,
        name: l.name,
        email: l.email || '',
        phone: l.phone || '',
        company: l.company || '',
        source: l.source || 'Website',
        status: l.status as Lead['status'],
        value: l.value || 0,
        notes: l.notes || '',
        address: l.address || '',
        projectType: l.project_type || '',
        createdAt: l.created_at,
        lastContactAt: l.last_contact_at || '',
      }))

      setLeads(mapped)
      return mapped
    } catch (err) {
      console.error('Failed to load leads:', err)
      return []
    } finally {
      setLoading(false)
    }
  }, [userId, orgId])

  const createLead = useCallback(async (data: Omit<Lead, 'id' | 'createdAt' | 'lastContactAt'>) => {
    if (!userId) return null
    try {
      const { data: row, error } = await supabase
        .from('leads')
        .insert({
          user_id: userId,
          ...(orgId ? { org_id: orgId } : {}),
          name: data.name,
          email: data.email,
          phone: data.phone,
          company: data.company,
          source: data.source,
          status: data.status,
          value: data.value,
          notes: data.notes,
          address: data.address,
          project_type: data.projectType,
        })
        .select()
        .single()

      if (error) throw error

      const newLead: Lead = {
        id: row.id,
        name: row.name,
        email: row.email || '',
        phone: row.phone || '',
        company: row.company || '',
        source: row.source || 'Website',
        status: row.status,
        value: row.value || 0,
        notes: row.notes || '',
        address: row.address || '',
        projectType: row.project_type || '',
        createdAt: row.created_at,
        lastContactAt: row.last_contact_at || '',
      }

      setLeads(prev => [newLead, ...prev])
      return newLead
    } catch (err) {
      console.error('Failed to create lead:', err)
      return null
    }
  }, [userId, orgId])

  const updateLead = useCallback(async (id: string, updates: Partial<Lead>) => {
    try {
      const dbUpdates: any = {}
      if (updates.name !== undefined) dbUpdates.name = updates.name
      if (updates.email !== undefined) dbUpdates.email = updates.email
      if (updates.phone !== undefined) dbUpdates.phone = updates.phone
      if (updates.company !== undefined) dbUpdates.company = updates.company
      if (updates.source !== undefined) dbUpdates.source = updates.source
      if (updates.status !== undefined) {
        dbUpdates.status = updates.status
        dbUpdates.last_contact_at = new Date().toISOString()
      }
      if (updates.value !== undefined) dbUpdates.value = updates.value
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes
      if (updates.address !== undefined) dbUpdates.address = updates.address
      if (updates.projectType !== undefined) dbUpdates.project_type = updates.projectType
      dbUpdates.updated_at = new Date().toISOString()

      const { error } = await supabase.from('leads').update(dbUpdates).eq('id', id)
      if (error) throw error

      setLeads(prev => prev.map(l =>
        l.id === id
          ? { ...l, ...updates, lastContactAt: dbUpdates.last_contact_at || l.lastContactAt }
          : l
      ))
    } catch (err) {
      console.error('Failed to update lead:', err)
    }
  }, [])

  const deleteLead = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from('leads').delete().eq('id', id)
      if (error) throw error
      setLeads(prev => prev.filter(l => l.id !== id))
    } catch (err) {
      console.error('Failed to delete lead:', err)
    }
  }, [])

  return { leads, setLeads, loading, loadLeads, createLead, updateLead, deleteLead }
}
