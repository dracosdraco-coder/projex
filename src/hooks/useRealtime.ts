'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'

type TableName = 'projects' | 'tasks' | 'phases' | 'generated_documents' | 'expenses' | 
  'team_members' | 'messages' | 'events' | 'meetings' | 'branches' | 'documents' |
  'line_item_templates' | 'form_templates' | 'notifications' | 'org_members' |
  'leads' | 'photos'

interface RealtimeEvent {
  table: TableName
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: any
  old: any
}

interface UseRealtimeOptions {
  userId?: string
  orgId?: string | null
  tables: TableName[]
  onEvent: (event: RealtimeEvent) => void
  enabled?: boolean
}

export function useRealtime({ userId, orgId, tables, onEvent, enabled = true }: UseRealtimeOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null)
  const onEventRef = useRef(onEvent)
  onEventRef.current = onEvent

  useEffect(() => {
    if (!userId || !enabled || tables.length === 0) return

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }

    const channelName = orgId ? `projex-org-${orgId}` : `projex-${userId}`
    const channel = supabase.channel(channelName, {
      config: { broadcast: { self: false } },
    })

    tables.forEach(table => {
      // Use org_id filter if available (org-scoped), else user_id
      const filter = orgId ? `org_id=eq.${orgId}` : `user_id=eq.${userId}`
      
      channel.on(
        'postgres_changes' as any,
        { event: '*', schema: 'public', table, filter },
        (payload: any) => {
          onEventRef.current({
            table,
            eventType: payload.eventType,
            new: payload.new,
            old: payload.old,
          })
        }
      )
    })

    channel.subscribe((status: string) => {
      if (status === 'SUBSCRIBED') {
        console.log('[Realtime] Connected to', tables.length, 'tables', orgId ? `(org: ${orgId.slice(0,8)})` : '')
      }
    })

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [userId, orgId, enabled, tables.join(',')])
}

// Org-scoped message realtime
export function useRealtimeMessages(orgId: string | undefined | null, onNewMessage: (msg: any) => void) {
  const callbackRef = useRef(onNewMessage)
  callbackRef.current = onNewMessage

  useEffect(() => {
    if (!orgId) return

    const channel = supabase.channel(`messages-org-${orgId}`)
      .on(
        'postgres_changes' as any,
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `org_id=eq.${orgId}` },
        (payload: any) => { callbackRef.current(payload.new) }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [orgId])
}

// Presence — tracks which org members are online
export interface PresenceUser {
  userId: string
  email: string
  name: string
  onlineAt: string
}

export function usePresence(orgId: string | null | undefined, userId: string | undefined, userEmail?: string, userName?: string) {
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([])
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!orgId || !userId) return

    const channel = supabase.channel(`presence-${orgId}`, {
      config: { presence: { key: userId } },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const users: PresenceUser[] = []
        Object.entries(state).forEach(([key, presences]: [string, any]) => {
          if (presences?.[0]) {
            users.push({
              userId: key,
              email: presences[0].email || '',
              name: presences[0].name || '',
              onlineAt: presences[0].online_at || new Date().toISOString(),
            })
          }
        })
        setOnlineUsers(users)
      })
      .subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            email: userEmail || '',
            name: userName || '',
            online_at: new Date().toISOString(),
          })
        }
      })

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [orgId, userId])

  const isOnline = useCallback((uid: string) => {
    return onlineUsers.some(u => u.userId === uid)
  }, [onlineUsers])

  return { onlineUsers, isOnline, onlineCount: onlineUsers.length }
}
