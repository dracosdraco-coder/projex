'use client'

import { useState } from 'react'
import { Project, Meeting } from '@/types'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface CollapsibleKPISectionProps {
  projects: Project[]
  meetings: Meeting[]
  totalContractAmount: number
  totalExpenses: number
  grossProfit: number
  onOpenFullKPI?: () => void
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B']

export default function CollapsibleKPISection({
  projects,
  meetings,
  totalContractAmount,
  totalExpenses,
  grossProfit,
  onOpenFullKPI,
}: CollapsibleKPISectionProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Calculate KPIs
  const activeProjects = projects.filter(p => p.status === 'active')
  const completedProjects = projects.filter(p => p.status === 'completed')
  const onHoldProjects = projects.filter(p => p.status === 'on-hold')
  
  const avgProgress = projects.length > 0
    ? Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / projects.length)
    : 0

  const profitMargin = totalContractAmount > 0
    ? ((grossProfit / totalContractAmount) * 100).toFixed(1)
    : '0.0'

  const upcomingMeetings = meetings.filter(m => {
    const meetingDate = new Date(m.date)
    const today = new Date()
    const sevenDaysFromNow = new Date()
    sevenDaysFromNow.setDate(today.getDate() + 7)
    return meetingDate >= today && meetingDate <= sevenDaysFromNow
  }).length

  // Project status data for pie chart
  const projectStatusData = [
    { name: 'Active', value: activeProjects.length, color: '#3B82F6' },
    { name: 'Completed', value: completedProjects.length, color: '#10B981' },
    { name: 'On Hold', value: onHoldProjects.length, color: '#F59E0B' },
  ].filter(item => item.value > 0)

  // Top 5 projects by progress
  const topProjectsData = activeProjects
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 5)
    .map(p => ({
      name: p.name.length > 20 ? p.name.substring(0, 20) + '...' : p.name,
      progress: p.progress,
    }))

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-xl border border-blue-200 dark:border-blue-800/30 overflow-hidden">
      {/* Header - Always Visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-blue-100/50 dark:hover:bg-blue-900/20 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div className="text-left">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Key Performance Indicators
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isExpanded ? 'Hide detailed metrics' : 'View performance metrics and charts'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {onOpenFullKPI && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onOpenFullKPI()
              }}
              className="px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
            >
              Full Dashboard →
            </button>
          )}
          <svg 
            className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Quick Metrics - Always Visible */}
      <div className="px-6 pb-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white/60 dark:bg-[#1a1a1a]/60 backdrop-blur-sm rounded-lg p-3 border border-blue-100 dark:border-blue-800/30">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Active Projects</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{activeProjects.length}</p>
          </div>
          <div className="bg-white/60 dark:bg-[#1a1a1a]/60 backdrop-blur-sm rounded-lg p-3 border border-blue-100 dark:border-blue-800/30">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Avg Progress</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{avgProgress}%</p>
          </div>
          <div className="bg-white/60 dark:bg-[#1a1a1a]/60 backdrop-blur-sm rounded-lg p-3 border border-blue-100 dark:border-blue-800/30">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Profit Margin</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{profitMargin}%</p>
          </div>
          <div className="bg-white/60 dark:bg-[#1a1a1a]/60 backdrop-blur-sm rounded-lg p-3 border border-blue-100 dark:border-blue-800/30">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Meetings (7d)</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{upcomingMeetings}</p>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-6 pb-6 space-y-6 border-t border-blue-200 dark:border-blue-800/30 pt-6">
          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Project Status Chart */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-4 border border-gray-200 dark:border-[#2a2a2a]">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Project Status Distribution
              </h4>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={projectStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={(entry) => `${entry.value}`}
                  >
                    {projectStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-2">
                {projectStatusData.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs text-gray-600 dark:text-gray-400">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Projects Progress */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-4 border border-gray-200 dark:border-[#2a2a2a]">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Top Active Projects
              </h4>
              {topProjectsData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={topProjectsData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                    <XAxis type="number" domain={[0, 100]} stroke="#9CA3AF" />
                    <YAxis dataKey="name" type="category" stroke="#9CA3AF" width={120} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                    />
                    <Bar dataKey="progress" fill="#8B5CF6" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-gray-400 dark:text-gray-500">
                  No active projects
                </div>
              )}
            </div>
          </div>

          {/* Milestones */}
          <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-4 border border-gray-200 dark:border-[#2a2a2a]">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Project Milestones
            </h4>
            <div className="space-y-3">
              {activeProjects.slice(0, 5).map((project) => (
                <div key={project.id} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{project.name}</p>
                    <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                      {project.progress}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-[#252525] rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        project.progress >= 75 ? 'bg-green-500' :
                        project.progress >= 50 ? 'bg-blue-500' :
                        project.progress >= 25 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>
              ))}
              {activeProjects.length === 0 && (
                <p className="text-center text-gray-400 dark:text-gray-500 py-4 text-sm">
                  No active projects to display
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
