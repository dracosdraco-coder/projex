'use client'

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface CommsLog {
  id: string
  type: 'sms_sent' | 'sms_received' | 'call_outgoing' | 'call_incoming'
  contactName: string
  contactPhone: string
  body: string
  durationSeconds: number
  twilioSid: string
  status: string
  notes: string
  createdAt: string
}

export function useCommsLogs(userId: string | undefined, orgId?: string | null) {
  const [logs, setLogs] = useState<CommsLog[]>([])
  const [loading, setLoading] = useState(false)

  const loadLogs = useCallback(async () => {
    if (!userId) return []
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('comms_logs')
        .select('*')
        .eq(orgId ? 'org_id' : 'user_id', orgId || userId)
        .order('created_at', { ascending: false })
        .limit(200)

      if (error) throw error

      const mapped: CommsLog[] = (data || []).map((l: any) => ({
        id: l.id,
        type: l.type as CommsLog['type'],
        contactName: l.contact_name || '',
        contactPhone: l.contact_phone || '',
        body: l.body || '',
        durationSeconds: l.duration_seconds || 0,
        twilioSid: l.twilio_sid || '',
        status: l.status || '',
        notes: l.notes || '',
        createdAt: l.created_at,
      }))

      setLogs(mapped)
      return mapped
    } catch (err) {
      console.error('Failed to load comms logs:', err)
      return []
    } finally {
      setLoading(false)
    }
  }, [userId, orgId])

  const addLog = useCallback(async (data: Omit<CommsLog, 'id' | 'createdAt'>): Promise<CommsLog | null> => {
    if (!userId) return null
    try {
      const { data: row, error } = await supabase
        .from('comms_logs')
        .insert({
          user_id: userId,
          ...(orgId ? { org_id: orgId } : {}),
          type: data.type,
          contact_name: data.contactName,
          contact_phone: data.contactPhone,
          body: data.body,
          duration_seconds: data.durationSeconds,
          twilio_sid: data.twilioSid,
          status: data.status,
          notes: data.notes,
        })
        .select()
        .single()

      if (error) throw error

      const newLog: CommsLog = {
        id: row.id,
        type: row.type,
        contactName: row.contact_name || '',
        contactPhone: row.contact_phone || '',
        body: row.body || '',
        durationSeconds: row.duration_seconds || 0,
        twilioSid: row.twilio_sid || '',
        status: row.status || '',
        notes: row.notes || '',
        createdAt: row.created_at,
      }

      setLogs(prev => [newLog, ...prev])
      return newLog
    } catch (err) {
      console.error('Failed to add comms log:', err)
      return null
    }
  }, [userId, orgId])

  const deleteLog = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from('comms_logs').delete().eq('id', id)
      if (error) throw error
      setLogs(prev => prev.filter(l => l.id !== id))
    } catch (err) {
      console.error('Failed to delete comms log:', err)
    }
  }, [])

  return { logs, setLogs, loading, loadLogs, addLog, deleteLog }
}
