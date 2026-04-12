'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

export interface Notification {
  id: string
  type: 'task_assigned' | 'task_completed' | 'document_approved' | 'document_rejected' |
        'document_sent' | 'payment_received' | 'comment_added' | 'mention' |
        'deadline_approaching' | 'inspection_failed' | 'phase_completed' | 'message' | 'system'
  title: string
  body: string
  read: boolean
  projectId?: string
  documentId?: string
  taskId?: string
  actionUrl?: string
  createdAt: string
}

export function useNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  // Load notifications from Supabase
  const loadNotifications = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)

      const mapped: Notification[] = (data || []).map((n: any) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        read: n.read,
        projectId: n.project_id,
        documentId: n.document_id,
        taskId: n.task_id,
        actionUrl: n.action_url,
        createdAt: n.created_at,
      }))

      setNotifications(mapped)
      setUnreadCount(mapped.filter(n => !n.read).length)
    } catch {
      // Table might not exist yet — silent fail
    } finally {
      setLoading(false)
    }
  }, [userId])

  // Subscribe to realtime notifications
  useEffect(() => {
    if (!userId) return

    loadNotifications()

    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes' as any,
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload: any) => {
          const n = payload.new
          const notif: Notification = {
            id: n.id, type: n.type, title: n.title, body: n.body,
            read: false, projectId: n.project_id, documentId: n.document_id,
            taskId: n.task_id, actionUrl: n.action_url, createdAt: n.created_at,
          }
          setNotifications(prev => [notif, ...prev])
          setUnreadCount(prev => prev + 1)

          // Browser notification if permitted
          if (typeof window !== 'undefined' && Notification.permission === 'granted') {
            new window.Notification(notif.title, { body: notif.body })
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId, loadNotifications])

  // Mark one as read
  const markRead = useCallback(async (notifId: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', notifId)
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }, [])

  // Mark all as read
  const markAllRead = useCallback(async () => {
    if (!userId) return
    await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
  }, [userId])

  // Delete a notification
  const dismiss = useCallback(async (notifId: string) => {
    await supabase.from('notifications').delete().eq('id', notifId)
    setNotifications(prev => {
      const n = prev.find(x => x.id === notifId)
      if (n && !n.read) setUnreadCount(c => Math.max(0, c - 1))
      return prev.filter(x => x.id !== notifId)
    })
  }, [])

  // Create a notification (for triggering from client — e.g. task assigned)
  const notify = useCallback(async (data: {
    type: Notification['type']; title: string; body: string
    targetUserId?: string; projectId?: string; documentId?: string; taskId?: string
  }) => {
    const targetId = data.targetUserId || userId
    if (!targetId) return

    await supabase.from('notifications').insert({
      user_id: targetId,
      type: data.type,
      title: data.title,
      body: data.body,
      project_id: data.projectId,
      document_id: data.documentId,
      task_id: data.taskId,
      read: false,
    })
  }, [userId])

  // Request browser notification permission
  const requestPermission = useCallback(async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      await window.Notification.requestPermission()
    }
  }, [])

  return {
    notifications, unreadCount, loading,
    markRead, markAllRead, dismiss, notify,
    requestPermission, refresh: loadNotifications,
  }
}

// ---- SQL for the notifications table (run in Supabase SQL editor) ----
//
// CREATE TABLE IF NOT EXISTS notifications (
//   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
//   user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
//   type text NOT NULL,
//   title text NOT NULL,
//   body text NOT NULL DEFAULT '',
//   read boolean NOT NULL DEFAULT false,
//   project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
//   document_id uuid REFERENCES generated_documents(id) ON DELETE SET NULL,
//   task_id uuid REFERENCES tasks(id) ON DELETE SET NULL,
//   action_url text,
//   created_at timestamptz DEFAULT now()
// );
//
// CREATE INDEX idx_notifications_user ON notifications(user_id, read, created_at DESC);
// ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
// CREATE POLICY "Users can read own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
// CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
// CREATE POLICY "Users can delete own notifications" ON notifications FOR DELETE USING (auth.uid() = user_id);
// CREATE POLICY "Authenticated can create notifications" ON notifications FOR INSERT WITH CHECK (true);
