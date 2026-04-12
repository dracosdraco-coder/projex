'use client'

import { useState, useMemo } from 'react'
import { Project, Meeting } from '@/types'
import { Task, Phase } from '@/types/data'
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock, DollarSign, BarChart3, Target } from 'lucide-react'

interface KPIContentProps {
  projects: Project[]
  meetings: Meeting[]
  tasks?: Task[]
  phases?: Phase[]
  totalContractAmount: number
  totalExpenses: number
  grossProfit: number
}

export default function KPIContent({
  projects = [], meetings = [], tasks = [], phases = [],
  totalContractAmount, totalExpenses, grossProfit,
}: KPIContentProps) {
  const m = useMemo(() => {
    const now = new Date()
    const active = projects.filter(p => p.status === 'active')
    const completed = projects.filter(p => p.status === 'completed')
    const onHold = projects.filter(p => p.status === 'on-hold')
    const avgProgress = projects.length > 0 ? Math.round(projects.reduce((s, p) => s + (p.progress || 0), 0) / projects.length) : 0
    const profitMargin = totalContractAmount > 0 ? (grossProfit / totalContractAmount) * 100 : 0
    const completedTasks = tasks.filter(t => t.status === 'completed').length
    const inProgress = tasks.filter(t => t.status === 'in-progress').length
    const todoTasks = tasks.filter(t => t.status === 'todo').length
    const reviewTasks = tasks.filter(t => t.status === 'review').length
    const overdue = tasks.filter(t => t.dueDate && t.status !== 'completed' && new Date(t.dueDate) < now).length
    const taskRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0
    const sevenDays = new Date(now.getTime() + 7 * 86400000)
    const upcomingDue = tasks.filter(t => t.dueDate && t.status !== 'completed' && new Date(t.dueDate) >= now && new Date(t.dueDate) <= sevenDays).length
    const upcomingMeetings = meetings.filter(m => { const d = new Date(m.date); return d >= now && d <= sevenDays }).length
    const activePhases = phases.filter(p => p.status === 'in-progress').length
    const completedPhases = phases.filter(p => p.status === 'completed').length
    const avgRevenue = projects.length > 0 ? totalContractAmount / projects.length : 0

    const expensesByType: Record<string, number> = {}
    projects.forEach(p => (p.expenses || []).forEach(e => { expensesByType[e.type || 'other'] = (expensesByType[e.type || 'other'] || 0) + (e.amount || 0) }))

    return {
      active: active.length, completed: completed.length, onHold: onHold.length, total: projects.length,
      avgProgress, profitMargin, completedTasks, inProgress, todoTasks, reviewTasks, overdue,
      taskRate, totalTasks: tasks.length, upcomingDue, upcomingMeetings,
      activePhases, completedPhases, totalPhases: phases.length, avgRevenue, expensesByType,
    }
  }, [projects, tasks, phases, meetings, totalContractAmount, totalExpenses, grossProfit])

  const StatCard = ({ label, value, sub, icon: Icon, trend }: { label: string; value: string | number; sub?: string; icon?: any; trend?: 'up' | 'down' | 'warn' | 'ok' }) => (
    <div className="bg-white dark:bg-[#1e1e1e] rounded-xl p-5 border border-gray-100 dark:border-[#2a2a2a] hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
        {Icon && <Icon className={`w-4 h-4 ${trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : trend === 'warn' ? 'text-amber-500' : 'text-gray-400'}`} />}
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 tabular-nums">{value}</p>
      {sub && <p className="text-[10px] text-gray-500 mt-1">{sub}</p>}
    </div>
  )

  const Bar = ({ label, value, max, color }: { label: string; value: number; max: number; color: string }) => {
    const pct = max > 0 ? Math.round((value / max) * 100) : 0
    return (
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-500 dark:text-gray-400 w-20 truncate">{label}</span>
        <div className="flex-1 h-2 bg-gray-100 dark:bg-[#2a2a2a] rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
        </div>
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 w-8 text-right tabular-nums">{value}</span>
      </div>
    )
  }

  const MiniStat = ({ value, label, color }: { value: number; label: string; color: string }) => (
    <div className={`text-center p-3 rounded-lg ${color}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
    </div>
  )

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">KPI Dashboard</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Real-time project and task performance</p>
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard label="Contract Value" value={`$${totalContractAmount.toLocaleString()}`} sub={`${m.total} projects`} icon={DollarSign} />
        <StatCard label="Total Expenses" value={`$${totalExpenses.toLocaleString()}`} sub="all projects" icon={TrendingDown} trend="down" />
        <StatCard label="Gross Profit" value={`$${grossProfit.toLocaleString()}`} sub={`${m.profitMargin.toFixed(1)}% margin`} icon={TrendingUp} trend={grossProfit > 0 ? 'up' : 'down'} />
        <StatCard label="Avg / Project" value={`$${Math.round(m.avgRevenue).toLocaleString()}`} sub="contract value" icon={BarChart3} />
      </div>

      {/* Project & Task */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-[#1e1e1e] rounded-xl p-5 border border-gray-100 dark:border-[#2a2a2a]">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Project Status</h3>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <MiniStat value={m.active} label="Active" color="bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400" />
            <MiniStat value={m.completed} label="Completed" color="bg-green-50 dark:bg-green-900/10 text-green-600 dark:text-green-400" />
            <MiniStat value={m.onHold} label="On Hold" color="bg-amber-50 dark:bg-amber-900/10 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <div className="flex justify-between mb-1.5"><span className="text-[10px] text-gray-500">Avg Progress</span><span className="text-[10px] font-medium text-gray-700 dark:text-gray-300">{m.avgProgress}%</span></div>
            <div className="w-full h-2.5 bg-gray-100 dark:bg-[#2a2a2a] rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${m.avgProgress}%` }} /></div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1e1e1e] rounded-xl p-5 border border-gray-100 dark:border-[#2a2a2a]">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Task Performance</h3>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <MiniStat value={m.completedTasks} label="Done" color="bg-green-50 dark:bg-green-900/10 text-green-600 dark:text-green-400" />
            <MiniStat value={m.inProgress} label="Active" color="bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400" />
            <MiniStat value={m.overdue} label="Overdue" color="bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400" />
          </div>
          <div className="space-y-2">
            <Bar label="Completed" value={m.completedTasks} max={m.totalTasks} color="#10B981" />
            <Bar label="In Progress" value={m.inProgress} max={m.totalTasks} color="#3B82F6" />
            <Bar label="In Review" value={m.reviewTasks} max={m.totalTasks} color="#8B5CF6" />
            <Bar label="To Do" value={m.todoTasks} max={m.totalTasks} color="#9CA3AF" />
          </div>
        </div>
      </div>

      {/* Alerts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard label="Overdue Tasks" value={m.overdue} sub={m.overdue > 0 ? 'Needs attention' : 'All on track'} icon={m.overdue > 0 ? AlertTriangle : CheckCircle} trend={m.overdue > 0 ? 'warn' : 'ok'} />
        <StatCard label="Due This Week" value={m.upcomingDue} sub="task deadlines" icon={Clock} />
        <StatCard label="Meetings (7d)" value={m.upcomingMeetings} sub="upcoming" icon={Target} />
        <StatCard label="Completion Rate" value={`${m.taskRate}%`} sub={`${m.completedTasks}/${m.totalTasks} tasks`} icon={CheckCircle} trend={m.taskRate >= 70 ? 'up' : m.taskRate >= 40 ? 'ok' : 'warn'} />
      </div>

      {/* Expenses */}
      {Object.keys(m.expensesByType).length > 0 && (
        <div className="bg-white dark:bg-[#1e1e1e] rounded-xl p-5 border border-gray-100 dark:border-[#2a2a2a]">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Expense Breakdown</h3>
          <div className="space-y-2">
            {Object.entries(m.expensesByType).sort(([, a], [, b]) => b - a).map(([type, amount]) => (
              <div key={type} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-[#2a2a2a] last:border-0">
                <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{type}</span>
                <div className="flex items-center gap-3">
                  <div className="w-28 h-2 bg-gray-100 dark:bg-[#2a2a2a] rounded-full overflow-hidden">
                    <div className="h-full bg-red-400 dark:bg-red-500 rounded-full" style={{ width: `${totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0}%` }} />
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100 tabular-nums w-24 text-right">${amount.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Phases */}
      {m.totalPhases > 0 && (
        <div className="bg-white dark:bg-[#1e1e1e] rounded-xl p-5 border border-gray-100 dark:border-[#2a2a2a]">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Phase Progress</h3>
          <div className="grid grid-cols-3 gap-3">
            <MiniStat value={m.totalPhases - m.activePhases - m.completedPhases} label="Not Started" color="bg-gray-50 dark:bg-[#222] text-gray-600 dark:text-gray-300" />
            <MiniStat value={m.activePhases} label="In Progress" color="bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400" />
            <MiniStat value={m.completedPhases} label="Completed" color="bg-green-50 dark:bg-green-900/10 text-green-600 dark:text-green-400" />
          </div>
        </div>
      )}
    </div>
  )
}
