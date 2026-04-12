'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { FolderOpen, CheckSquare, FileText, Users, MessageSquare, DollarSign, Calendar, Clock } from 'lucide-react'

interface ActivityItem {
  id: string
  type: string
  action: string
  entityName: string
  actorName: string
  actorEmail: string
  createdAt: string
  metadata?: Record<string, any>
}

const ACTION_ICONS: Record<string, any> = {
  project: FolderOpen,
  task: CheckSquare,
  document: FileText,
  team: Users,
  message: MessageSquare,
  expense: DollarSign,
  event: Calendar,
}

const ACTION_VERBS: Record<string, string> = {
  INSERT: 'created',
  UPDATE: 'updated',
  DELETE: 'deleted',
  sent: 'sent',
  invited: 'invited',
}

interface ActivityFeedProps {
  orgId: string | null
  limit?: number
}

export default function ActivityFeed({ orgId, limit = 20 }: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  const loadActivity = useCallback(async () => {
    if (!orgId) return
    setLoading(true)

    // Build activity from recent changes across tables
    const results: ActivityItem[] = []
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // Last 7 days

    // Recent projects
    const { data: projects } = await supabase
      .from('projects')
      .select('id, name, created_at, updated_at, user_id')
      .eq('org_id', orgId)
      .gte('updated_at', since)
      .order('updated_at', { ascending: false })
      .limit(10)

    projects?.forEach(p => {
      // Compare created_at and updated_at to determine if new or updated
      const created = new Date(p.created_at).getTime()
      const updated = new Date(p.updated_at || p.created_at).getTime()
      const isNew = (updated - created) < 5000 // within 5s = likely new
      results.push({
        id: `project-${p.id}`, type: 'project',
        action: isNew ? 'INSERT' : 'UPDATE',
        entityName: p.name, actorName: '', actorEmail: '',
        createdAt: p.updated_at || p.created_at,
      })
    })

    // Recent tasks
    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, title, created_at, updated_at, status, assignee')
      .eq('org_id', orgId)
      .gte('updated_at', since)
      .order('updated_at', { ascending: false })
      .limit(10)

    tasks?.forEach(t => {
      const created = new Date(t.created_at).getTime()
      const updated = new Date(t.updated_at || t.created_at).getTime()
      const isNew = (updated - created) < 5000
      results.push({
        id: `task-${t.id}`, type: 'task',
        action: isNew ? 'INSERT' : 'UPDATE',
        entityName: t.title, actorName: t.assignee || '', actorEmail: '',
        createdAt: t.updated_at || t.created_at,
        metadata: { status: t.status },
      })
    })

    // Recent documents
    const { data: docs } = await supabase
      .from('generated_documents')
      .select('id, document_number, type, status, created_at, updated_at')
      .eq('org_id', orgId)
      .gte('updated_at', since)
      .order('updated_at', { ascending: false })
      .limit(10)

    docs?.forEach(d => {
      results.push({
        id: `doc-${d.id}`, type: 'document',
        action: d.status === 'sent' ? 'sent' : 'INSERT',
        entityName: `${d.type} ${d.document_number}`, actorName: '', actorEmail: '',
        createdAt: d.updated_at || d.created_at,
        metadata: { status: d.status, docType: d.type },
      })
    })

    // Recent messages
    const { data: msgs } = await supabase
      .from('messages')
      .select('id, sender_name, content, created_at')
      .eq('org_id', orgId)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(10)

    msgs?.forEach(m => {
      results.push({
        id: `msg-${m.id}`, type: 'message',
        action: 'INSERT',
        entityName: (m.content || '').substring(0, 60), actorName: m.sender_name || '', actorEmail: '',
        createdAt: m.created_at,
      })
    })

    // Recent expenses
    const { data: expenses } = await supabase
      .from('expenses')
      .select('id, description, amount, created_at')
      .eq('org_id', orgId)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(10)

    expenses?.forEach(e => {
      results.push({
        id: `exp-${e.id}`, type: 'expense',
        action: 'INSERT',
        entityName: `${e.description || 'Expense'} ($${(e.amount || 0).toLocaleString()})`,
        actorName: '', actorEmail: '',
        createdAt: e.created_at,
      })
    })

    // Recent team changes
    const { data: orgMembers } = await supabase
      .from('org_members')
      .select('id, name, email, status, created_at, joined_at')
      .eq('org_id', orgId)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(5)

    orgMembers?.forEach(m => {
      results.push({
        id: `member-${m.id}`, type: 'team',
        action: m.status === 'pending' ? 'invited' : 'INSERT',
        entityName: m.name || m.email, actorName: '', actorEmail: '',
        createdAt: m.joined_at || m.created_at,
      })
    })

    // Sort by date, take top N
    results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    setActivities(results.slice(0, limit))
    setLoading(false)
  }, [orgId, limit])

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

  const getActionText = (item: ActivityItem) => {
    if (item.action === 'sent') return 'sent'
    return ACTION_VERBS[item.action] || 'updated'
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
        const Icon = ACTION_ICONS[item.type] || FileText
        return (
          <div key={item.id} className="flex items-start gap-2.5 px-2 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors">
            <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-[#222] flex items-center justify-center shrink-0 mt-0.5">
              <Icon className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                {item.actorName && <span className="font-medium">{item.actorName} </span>}
                <span className="text-gray-400">{getActionText(item)}</span>{' '}
                <span className="font-medium">{item.entityName}</span>
              </p>
              <span className="text-[10px] text-gray-400">{formatTime(item.createdAt)}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
