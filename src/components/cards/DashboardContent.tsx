'use client'

import { useState, useMemo, useEffect } from 'react'
import { Project } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts'

import ActivityFeed from '@/components/ActivityFeed'
import { GeneratedDocument } from '@/types/data'
import { Meeting, Branch } from '@/types'

interface DashboardContentProps {
  projects: Project[]
  totalContractAmount: number
  totalExpenses: number
  grossProfit: number
  orgId?: string | null
  onlineUsers?: { userId: string; name: string; email: string }[]
  onEditProject?: (project: Project) => void
  onDeleteProject?: (projectId: string, projectName: string) => void
  // from commonProps spread
  documents?: GeneratedDocument[]
  meetings?: Meeting[]
  branches?: Branch[]
  updateTimeline?: (...args: any[]) => any
  updateProjectDates?: (...args: any[]) => any
}

type TimePeriod = 'daily' | 'monthly' | 'yearly'
type ViewMode = 'production' | 'accounting' | 'operations'

export default function DashboardContent({ 
  projects = [],
  totalContractAmount,
  totalExpenses,
  grossProfit,
  orgId,
  onlineUsers = [],
  onEditProject,
  onDeleteProject,
  documents = [],
  meetings: _meetings,
  branches: _branches,
  updateTimeline: _updateTimeline,
  updateProjectDates: _updateProjectDates
}: DashboardContentProps) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('monthly')
  const [viewMode, setViewMode] = useState<ViewMode>('production')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // Debug: Log projects data
  useEffect(() => {
    if (projects.length > 0) {
    }
  }, [projects])

  // Filter projects by date range based on time period
  const filteredByPeriod = useMemo(() => {
    const now = new Date()
    const filtered = projects.filter(project => {
      const createdDate = new Date(project.createdAt)
      
      switch (timePeriod) {
        case 'daily':
          const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
          return createdDate >= yesterday
        case 'monthly':
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
          return createdDate >= monthStart
        case 'yearly':
          const yearStart = new Date(now.getFullYear(), 0, 1)
          return createdDate >= yearStart
        default:
          return true
      }
    })
    return filtered
  }, [projects, timePeriod])

  // Apply search and filters
  const filteredProjects = useMemo(() => {
    return filteredByPeriod
      .filter(project => {
        const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (project.client || '').toLowerCase().includes(searchQuery.toLowerCase())
        const matchesStatus = statusFilter === 'all' || project.status === statusFilter
        return matchesSearch && matchesStatus
      })
      .sort((a, b) => {
        const aVal = a[sortBy as keyof Project] ?? ''
        const bVal = b[sortBy as keyof Project] ?? ''
        const multiplier = sortOrder === 'asc' ? 1 : -1
        if (aVal === bVal) return 0
        return aVal > bVal ? multiplier : -multiplier
      })
  }, [filteredByPeriod, searchQuery, statusFilter, sortBy, sortOrder])

  // Calculate KPI metrics
  const metrics = useMemo(() => {
    const active = filteredProjects.filter(p => p.status === 'active')
    const completed = filteredProjects.filter(p => p.status === 'completed')
    const totalRevenue = filteredProjects.reduce((sum, p) => sum + (p.contractAmount || 0), 0)
    const totalExp = filteredProjects.reduce((sum, p) => 
      sum + ((p.expenses || []).reduce((s, e) => s + e.amount, 0)), 0
    )
    const avgProgress = active.length > 0 
      ? active.reduce((sum, p) => sum + (p.progress || 0), 0) / active.length 
      : 0

    // Invoice-based revenue
    const invoices = documents.filter((d: any) => d.type === 'invoice')
    const paidRevenue = invoices.filter((d: any) => d.status === 'paid').reduce((s: number, d: any) => s + (d.total || 0), 0)
    const outstanding = invoices.filter((d: any) => d.status === 'sent').reduce((s: number, d: any) => s + (d.total || 0), 0)
    const overdue = invoices.filter((d: any) => d.status === 'sent' && d.dateDue && new Date(d.dateDue) < new Date()).reduce((s: number, d: any) => s + (d.total || 0), 0)

    return {
      totalRevenue,
      totalExpenses: totalExp,
      netProfit: totalRevenue - totalExp,
      activeProjects: active.length,
      completedProjects: completed.length,
      avgProgress: Math.round(avgProgress),
      budgetUtilization: totalRevenue > 0 ? Math.round((totalExp / totalRevenue) * 100) : 0,
      paidRevenue,
      outstanding,
      overdue,
    }
  }, [filteredProjects, documents])

  // Chart data - Revenue over time
  const revenueChartData = useMemo(() => {
    const data: { [key: string]: number } = {}
    
    filteredProjects.forEach(project => {
      const date = new Date(project.createdAt)
      let key: string
      
      switch (timePeriod) {
        case 'daily':
          key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          break
        case 'monthly':
          key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          break
        case 'yearly':
          key = date.toLocaleDateString('en-US', { month: 'short' })
          break
        default:
          key = date.toLocaleDateString()
      }
      
      data[key] = (data[key] || 0) + (project.contractAmount || 0)
    })
    
    return Object.entries(data).map(([date, revenue]) => ({ date, revenue }))
  }, [filteredProjects, timePeriod])

  // Expense breakdown by type
  const expenseChartData = useMemo(() => {
    const byType: { [key: string]: number } = {}
    
    filteredProjects.forEach(project => {
      (project.expenses || []).forEach(expense => {
        byType[expense.type] = (byType[expense.type] || 0) + expense.amount
      })
    })
    
    return Object.entries(byType).map(([type, amount]) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      value: amount
    }))
  }, [filteredProjects])

  // Progress data
  const progressData = filteredProjects
    .filter(p => p.status === 'active')
    .slice(0, 10)
    .map(p => ({
      name: p.name.length > 20 ? p.name.substring(0, 20) + '...' : p.name,
      progress: p.progress || 0
    }))

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#6b7280']

  // Table columns based on view mode
  const getColumns = () => {
    switch (viewMode) {
      case 'production':
        return ['Project', 'Client', 'Status', 'Progress', 'Start Date', 'Due Date', 'Team Size', 'Actions']
      case 'accounting':
        return ['Project', 'Contract', 'Expenses', 'Revenue', 'Profit', 'Budget %', 'Actions']
      case 'operations':
        return ['Project', 'Status', 'Team', 'Branch', 'Manager', 'Actions']
      default:
        return []
    }
  }

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  const renderTableCell = (project: Project, column: string) => {
    switch (column) {
      case 'Project':
        return (
          <span 
            onClick={() => onEditProject?.(project)}
            className="cursor-pointer hover:underline font-medium"
          >
            {project.name}
          </span>
        )
      
      case 'Client':
        return <span>{project.client || '-'}</span>
      
      case 'Status':
        const statusColors = {
          active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
          completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
          'on-hold': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
        }
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[project.status]}`}>
            {project.status}
          </span>
        )
      
      case 'Progress':
        return (
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-200 dark:bg-[#252525] rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${project.progress || 0}%` }}
              />
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[3rem] text-right">
              {project.progress || 0}%
            </span>
          </div>
        )
      
      case 'Start Date':
        return <span>{project.startDate ? new Date(project.startDate).toLocaleDateString() : '-'}</span>
      
      case 'Due Date':
        return <span>{project.dueDate ? new Date(project.dueDate).toLocaleDateString() : '-'}</span>
      
      case 'Team Size':
        return <span>{(project.team || []).length}</span>
      
      case 'Contract':
        return <span className="font-medium">{formatCurrency(project.contractAmount || 0)}</span>
      
      case 'Expenses':
        const expenses = (project.expenses || []).reduce((sum, e) => sum + e.amount, 0)
        return <span>{formatCurrency(expenses)}</span>
      
      case 'Revenue':
        return <span className="text-green-600 dark:text-green-400">{formatCurrency(project.contractAmount || 0)}</span>
      
      case 'Profit':
        const profit = (project.contractAmount || 0) - (project.expenses || []).reduce((sum, e) => sum + e.amount, 0)
        return (
          <span className={profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
            {formatCurrency(profit)}
          </span>
        )
      
      case 'Budget %':
        const budgetUsed = project.contractAmount > 0 
          ? ((project.expenses || []).reduce((sum, e) => sum + e.amount, 0) / project.contractAmount) * 100 
          : 0
        return <span>{Math.round(budgetUsed)}%</span>
      
      case 'Team':
        return <span>{(project.team || []).map(m => m.name).join(', ') || '-'}</span>
      
      case 'Branch':
        return <span>{project.branch || '-'}</span>
      
      case 'Manager':
        return <span>-</span>
      
      case 'Actions':
        return (
          <div className="flex gap-2">
            <button
              onClick={() => onEditProject?.(project)}
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 text-sm font-medium"
            >
              Edit
            </button>
            <button
              onClick={() => onDeleteProject?.(project.id, project.name)}
              className="text-red-600 hover:text-red-800 dark:text-red-400 text-sm font-medium"
            >
              Delete
            </button>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header with Time Period and View Mode */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-[#2a2a2a] flex-shrink-0">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Dashboard</h2>
          
          {/* Time Period Toggle */}
          <div className="flex gap-1 bg-gray-100 dark:bg-[#1a1a1a] rounded-lg p-1">
            {(['daily', 'monthly', 'yearly'] as TimePeriod[]).map(period => (
              <button
                key={period}
                onClick={() => setTimePeriod(period)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  timePeriod === period
                    ? 'bg-white dark:bg-[#252525] text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex gap-1 bg-gray-100 dark:bg-[#1a1a1a] rounded-lg p-1">
          {(['production', 'accounting', 'operations'] as ViewMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === mode
                  ? 'bg-white dark:bg-[#252525] text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-auto">
        {/* Charts Section - HORIZONTAL SCROLL */}
        <div className="p-6 space-y-6 bg-gray-50 dark:bg-[#111]">
          {/* KPI Cards - Horizontal scroll */}
          <div className="overflow-x-auto pb-2">
            <div className="flex gap-4 min-w-max">
              <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-4 border border-gray-200 dark:border-[#2a2a2a] min-w-[160px] md:min-w-[200px]">
                <div className="text-sm text-gray-600 dark:text-gray-400">Contract Value</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                  {formatCurrency(metrics.totalRevenue)}
                </div>
              </div>
              <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-4 border border-gray-200 dark:border-[#2a2a2a] min-w-[160px] md:min-w-[200px]">
                <div className="text-sm text-green-600 dark:text-green-400">Revenue Collected</div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                  {formatCurrency(metrics.paidRevenue)}
                </div>
              </div>
              <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-4 border border-gray-200 dark:border-[#2a2a2a] min-w-[160px] md:min-w-[200px]">
                <div className="text-sm text-blue-600 dark:text-blue-400">Outstanding</div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                  {formatCurrency(metrics.outstanding)}
                </div>
              </div>
              {metrics.overdue > 0 && (
                <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-4 border border-red-200 dark:border-red-900/30 min-w-[160px] md:min-w-[200px]">
                  <div className="text-sm text-red-600 dark:text-red-400">Overdue</div>
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                    {formatCurrency(metrics.overdue)}
                  </div>
                </div>
              )}
              <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-4 border border-gray-200 dark:border-[#2a2a2a] min-w-[160px] md:min-w-[200px]">
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Expenses</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                  {formatCurrency(metrics.totalExpenses)}
                </div>
              </div>
              <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-4 border border-gray-200 dark:border-[#2a2a2a] min-w-[160px] md:min-w-[200px]">
                <div className={`text-sm ${metrics.netProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>Net Profit</div>
                <div className={`text-2xl font-bold mt-1 ${
                  metrics.netProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {formatCurrency(metrics.netProfit)}
                </div>
              </div>
              <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-4 border border-gray-200 dark:border-[#2a2a2a] min-w-[160px] md:min-w-[200px]">
                <div className="text-sm text-gray-600 dark:text-gray-400">Active Projects</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                  {metrics.activeProjects}
                </div>
              </div>
            </div>
          </div>

          {/* Charts Grid - Horizontal scroll */}
          <div className="overflow-x-auto pb-2">
            <div className="flex gap-6 min-w-max">
              {/* Revenue Chart */}
              <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-4 border border-gray-200 dark:border-[#2a2a2a] min-w-[280px] md:min-w-[400px]">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">Revenue Over Time</h3>
                <ResponsiveContainer width={380} height={200}>
                  <AreaChart data={revenueChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                      formatter={(value) => formatCurrency(value as number)}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Expense Breakdown */}
              <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-4 border border-gray-200 dark:border-[#2a2a2a] min-w-[280px] md:min-w-[400px]">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">Expense Breakdown</h3>
                <ResponsiveContainer width={380} height={200}>
                  <PieChart>
                    <Pie
                      data={expenseChartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label
                    >
                      {expenseChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Progress Chart */}
              <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-4 border border-gray-200 dark:border-[#2a2a2a] min-w-[280px] md:min-w-[400px]">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">Project Progress</h3>
                <ResponsiveContainer width={380} height={200}>
                  <BarChart data={progressData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis type="number" domain={[0, 100]} stroke="#9CA3AF" />
                    <YAxis dataKey="name" type="category" width={100} stroke="#9CA3AF" />
                    <Tooltip formatter={(value) => `${value}%`} />
                    <Bar dataKey="progress" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Data Table Section */}
        <div className="p-6">
          {/* Table Toolbar */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-[#333] rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-[#333] rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="on-hold">On Hold</option>
              </select>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {filteredProjects.length} projects
            </div>
          </div>

          {/* Table - Horizontal scroll */}
          <div className="border border-gray-200 dark:border-[#2a2a2a] rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px]">
                <thead className="bg-gray-50 dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-[#2a2a2a]">
                  <tr>
                    {getColumns().map(column => (
                      <th
                        key={column}
                        onClick={() => column !== 'Actions' && handleSort(column.toLowerCase())}
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-[#252525] whitespace-nowrap"
                      >
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-[#1a1a1a] divide-y divide-gray-200 dark:divide-[#2a2a2a]">
                  {filteredProjects.length === 0 ? (
                    <tr>
                      <td colSpan={getColumns().length} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                        No projects found
                      </td>
                    </tr>
                  ) : (
                    filteredProjects.map(project => (
                      <tr key={project.id} className="hover:bg-gray-50 dark:hover:bg-[#252525]">
                        {getColumns().map(column => (
                          <td key={column} className="px-4 py-4 text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap">
                            {renderTableCell(project, column)}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Activity Feed + Online Members */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="md:col-span-2 bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#2a2a2a] p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Recent Activity</h3>
              <ActivityFeed orgId={orgId || null} limit={15} />
            </div>
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#2a2a2a] p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                Team Online
                {onlineUsers.length > 0 && (
                  <span className="text-[10px] font-medium text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 px-1.5 py-0.5 rounded-full">
                    {onlineUsers.length}
                  </span>
                )}
              </h3>
              {onlineUsers.length === 0 ? (
                <p className="text-xs text-gray-400 py-4 text-center">No one else online</p>
              ) : (
                <div className="space-y-2">
                  {onlineUsers.map(u => (
                    <div key={u.userId} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg">
                      <div className="relative">
                        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-[#222] flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300">
                          {(u.name?.[0] || u.email?.[0] || '?').toUpperCase()}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-[#1a1a1a]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">{u.name || u.email?.split('@')[0]}</p>
                        <p className="text-[10px] text-gray-400 truncate">{u.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}