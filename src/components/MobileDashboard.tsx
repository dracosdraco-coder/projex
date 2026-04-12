'use client'

import { useMemo } from 'react'
import { formatCurrency } from '@/lib/utils'
import {
  TrendingUp, TrendingDown, DollarSign, FolderOpen, CheckSquare,
  Clock, AlertTriangle, Users, ChevronRight, ArrowUpRight, ArrowDownRight,
  FileText, MessageCircle, Camera, Phone, Plus
} from 'lucide-react'

interface MobileDashboardProps {
  projects: any[]
  tasks: any[]
  documents: any[]
  teamMembers: any[]
  totalContractAmount: number
  totalExpenses: number
  grossProfit: number
  onlineUsers: { userId: string; name: string; email: string }[]
  recentActivity: { id: string; type: string; title: string; subtitle: string; time: string }[]
  onNavigate: (cardId: string) => void
}

export default function MobileDashboard({
  projects, tasks, documents, teamMembers,
  totalContractAmount, totalExpenses, grossProfit,
  onlineUsers, recentActivity, onNavigate,
}: MobileDashboardProps) {
  const stats = useMemo(() => {
    const activeProjects = projects.filter((p: any) => p.status === 'active').length
    const pendingTasks = tasks.filter((t: any) => t.status === 'todo' || t.status === 'in-progress').length
    const invoices = documents.filter((d: any) => d.type === 'invoice')
    const paidRevenue = invoices.filter((d: any) => d.status === 'paid').reduce((s: number, d: any) => s + (d.total || 0), 0)
    const outstanding = invoices.filter((d: any) => d.status === 'sent').reduce((s: number, d: any) => s + (d.total || 0), 0)
    const overdue = invoices.filter((d: any) => d.status === 'sent' && d.dateDue && new Date(d.dateDue) < new Date()).reduce((s: number, d: any) => s + (d.total || 0), 0)
    return { activeProjects, pendingTasks, paidRevenue, outstanding, overdue }
  }, [projects, tasks, documents])

  const formatTime = (ts: string) => {
    const d = new Date(ts)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'now'
    if (mins < 60) return `${mins}m`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h`
    return `${Math.floor(hrs / 24)}d`
  }

  const FEED_ICONS: Record<string, any> = {
    project: FolderOpen, task: CheckSquare, document: FileText,
    message: MessageCircle, expense: DollarSign, team: Users,
  }

  return (
    <div className="min-h-full bg-[#f2f2f7] dark:bg-[#000] pb-4">
      {/* Greeting */}
      <div className="px-5 pt-4 pb-2">
        <p className="text-[13px] text-gray-500 dark:text-gray-400">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Financial Summary Card */}
      <div className="px-4 mb-4">
        <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-semibold text-gray-900 dark:text-gray-100">Financial Summary</h2>
            <button onClick={() => onNavigate('accounting')} className="text-[13px] text-[#007AFF] font-medium">Details</button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[11px] text-gray-500 uppercase tracking-wide">Revenue</p>
              <p className="text-[22px] font-bold text-gray-900 dark:text-gray-100 tracking-tight">{formatCurrency(stats.paidRevenue)}</p>
              {stats.outstanding > 0 && (
                <p className="text-[11px] text-blue-600 flex items-center gap-0.5 mt-0.5">
                  <Clock className="w-3 h-3" /> {formatCurrency(stats.outstanding)} pending
                </p>
              )}
            </div>
            <div>
              <p className="text-[11px] text-gray-500 uppercase tracking-wide">Profit</p>
              <p className={`text-[22px] font-bold tracking-tight ${grossProfit >= 0 ? 'text-[#34C759]' : 'text-[#FF3B30]'}`}>
                {formatCurrency(grossProfit)}
              </p>
              <p className="text-[11px] text-gray-400 flex items-center gap-0.5 mt-0.5">
                {grossProfit >= 0 ? <ArrowUpRight className="w-3 h-3 text-[#34C759]" /> : <ArrowDownRight className="w-3 h-3 text-[#FF3B30]" />}
                {totalContractAmount > 0 ? Math.round((grossProfit / totalContractAmount) * 100) : 0}% margin
              </p>
            </div>
          </div>
          {stats.overdue > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-[#2c2c2e] flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-[#FF3B30]" />
              <span className="text-[12px] text-[#FF3B30] font-medium">{formatCurrency(stats.overdue)} overdue</span>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="px-4 mb-4">
        <div className="flex gap-2.5">
          <button onClick={() => onNavigate('projects')}
            className="flex-1 bg-white dark:bg-[#1c1c1e] rounded-2xl p-4 shadow-sm active:scale-[0.98] transition-transform">
            <FolderOpen className="w-5 h-5 text-[#007AFF] mb-2" />
            <p className="text-[22px] font-bold text-gray-900 dark:text-gray-100">{stats.activeProjects}</p>
            <p className="text-[11px] text-gray-500">Active Projects</p>
          </button>
          <button onClick={() => onNavigate('tasks')}
            className="flex-1 bg-white dark:bg-[#1c1c1e] rounded-2xl p-4 shadow-sm active:scale-[0.98] transition-transform">
            <CheckSquare className="w-5 h-5 text-[#FF9500] mb-2" />
            <p className="text-[22px] font-bold text-gray-900 dark:text-gray-100">{stats.pendingTasks}</p>
            <p className="text-[11px] text-gray-500">Pending Tasks</p>
          </button>
          <button onClick={() => onNavigate('team')}
            className="flex-1 bg-white dark:bg-[#1c1c1e] rounded-2xl p-4 shadow-sm active:scale-[0.98] transition-transform">
            <Users className="w-5 h-5 text-[#34C759] mb-2" />
            <p className="text-[22px] font-bold text-gray-900 dark:text-gray-100">{teamMembers.length}</p>
            <p className="text-[11px] text-gray-500">Team Members</p>
          </button>
        </div>
      </div>

      {/* Online Team */}
      {onlineUsers.length > 0 && (
        <div className="px-4 mb-4">
          <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[13px] font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#34C759]" />
                Online Now
              </h3>
              <span className="text-[12px] text-gray-400">{onlineUsers.length}</span>
            </div>
            <div className="flex -space-x-2">
              {onlineUsers.slice(0, 8).map((u, i) => (
                <div key={u.userId} className="w-9 h-9 rounded-full bg-gradient-to-br from-[#007AFF] to-[#5856D6] flex items-center justify-center border-2 border-white dark:border-[#1c1c1e]"
                  style={{ zIndex: 10 - i }}>
                  <span className="text-white text-[10px] font-bold">{(u.name?.[0] || u.email?.[0] || '?').toUpperCase()}</span>
                </div>
              ))}
              {onlineUsers.length > 8 && (
                <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-[#2c2c2e] flex items-center justify-center border-2 border-white dark:border-[#1c1c1e]">
                  <span className="text-gray-600 text-[9px] font-bold">+{onlineUsers.length - 8}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Activity Feed */}
      <div className="px-4">
        <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <h3 className="text-[13px] font-semibold text-gray-900 dark:text-gray-100">Activity</h3>
          </div>

          {recentActivity.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-[13px] text-gray-400">No recent activity</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-[#2c2c2e]">
              {recentActivity.slice(0, 15).map(item => {
                const Icon = FEED_ICONS[item.type] || FileText
                return (
                  <div key={item.id} className="flex items-start gap-3 px-4 py-3">
                    <div className="w-8 h-8 rounded-full bg-[#f2f2f7] dark:bg-[#2c2c2e] flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-gray-900 dark:text-gray-100 leading-snug">{item.title}</p>
                      {item.subtitle && <p className="text-[11px] text-gray-500 mt-0.5">{item.subtitle}</p>}
                    </div>
                    <span className="text-[11px] text-gray-400 shrink-0 mt-0.5">{formatTime(item.time)}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
