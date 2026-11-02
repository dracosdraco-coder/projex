'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { FolderOpen, CheckSquare, FileText, Users, UserPlus, MessageSquare, DollarSign, Calendar, Camera, Clock } from 'lucide-react'

interface ActivityItem {
  id: number
  entityType: string
  verb: 'created' | 'updated' | 'deleted'
  summary: string
  actorName: string
  createdAt: string
  data: Record<string, any>
}

const ACTION_ICONS: Record<string, any> = {
  project: FolderOpen,
  phase: FolderOpen,
  task: CheckSquare,
  document: FileText,
  file: FileText,
  photo: Camera,
  member: Users,
  lead: UserPlus,
  message: MessageSquare,
  expense: DollarSign,
  event: Calendar,
  meeting: Calendar,
}

const ENTITY_LABELS: Record<string, string> = {
  project: 'project', phase: 'phase', task: 'task', document: '', file: 'file',
  photo: 'photo', member: 'team member', lead: 'lead', message: 'message',
  expense: 'expense', event: 'event', meeting: 'meeting',
}

interface ActivityFeedProps {
  orgId: string | null
  projectId?: string
  limit?: number
}

// Reads activity_events, which database triggers fill on every change to the core
// tables (see supabase/migrations/20261102000100_org_scoping_and_activity.sql).
export default function ActivityFeed({ orgId, projectId, limit = 20 }: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  const loadActivity = useCallback(async () => {
    if (!orgId) return
    setLoading(true)

    let query = supabase
      .from('activity_events')
      .select('id, entity_type, verb, summary, actor_name, data, created_at')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (projectId) query = query.eq('project_id', projectId)

    const { data } = await query
    setActivities((data || []).map((r: any) => ({
      id: r.id,
      entityType: r.entity_type,
      verb: r.verb,
      summary: r.summary || '',
      actorName: r.actor_name || '',
      createdAt: r.created_at,
      data: r.data || {},
    })))
    setLoading(false)
  }, [orgId, projectId, limit])

  useEffect(() => { loadActivity() }, [loadActivity])

  const formatTime = (date: string) => {
    const d = new Date(date)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days}d ago`
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const describe = (item: ActivityItem) => {
    const status = item.data.status
    if (item.verb === 'updated' && status?.to) {
      return { verb: `moved ${ENTITY_LABELS[item.entityType] || ''}`.trim(), suffix: `to ${String(status.to).replace(/[_-]/g, ' ')}` }
    }
    const what = ENTITY_LABELS[item.entityType]
    const amount = item.entityType === 'expense' && item.data.amount != null
      ? ` ($${Number(item.data.amount).toLocaleString()})` : ''
    return { verb: `${item.verb}${what ? ' ' + what : ''}`, suffix: amount }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1,2,3,4].map(i => (
          <div key={i} className="flex items-start gap-3 animate-pulse">
            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-[#222]" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 bg-gray-100 dark:bg-[#222] rounded w-3/4" />
              <div className="h-2.5 bg-gray-50 dark:bg-[#1a1a1a] rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-6 text-gray-400">
        <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
        <p className="text-xs">No recent activity</p>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {activities.map(item => {
        const Icon = ACTION_ICONS[item.entityType] || FileText
        const { verb, suffix } = describe(item)
        return (
          <div key={item.id} className="flex items-start gap-2.5 px-2 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors">
            <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-[#222] flex items-center justify-center shrink-0 mt-0.5">
              <Icon className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                {item.actorName && <span className="font-medium">{item.actorName} </span>}
                <span className="text-gray-400">{verb}</span>{' '}
                <span className="font-medium">{item.summary}</span>
                {suffix && <span className="text-gray-400"> {suffix}</span>}
              </p>
              <span className="text-[10px] text-gray-400">{formatTime(item.createdAt)}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
