'use client'

import { Project } from '@/types'
import { CustomKPI } from './AddCustomKPIModal'

interface CustomKPICardsProps {
  customKPIs: CustomKPI[]
  projects: Project[]
  onDelete: (id: string) => void
}

export default function CustomKPICards({ customKPIs, projects, onDelete }: CustomKPICardsProps) {
  const calculateKPIValue = (kpi: CustomKPI): { current: number; percentage?: number; label: string } => {
    const now = new Date()
    let startDate = new Date()

    // Calculate start date based on timeframe
    switch (kpi.timeframe) {
      case 'week':
        startDate.setDate(now.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(now.getMonth() - 1)
        break
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3)
        break
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1)
        break
    }

    let current = 0
    let label = ''

    // Calculate based on metric type
    switch (kpi.metric) {
      case 'contracts':
        // Count projects created in timeframe
        current = projects.filter(p => new Date(p.createdAt) >= startDate).length
        label = `${current} contract${current !== 1 ? 's' : ''}`
        break

      case 'revenue':
        // Sum contract amounts in timeframe
        current = projects
          .filter(p => new Date(p.createdAt) >= startDate)
          .reduce((sum, p) => sum + p.contractAmount, 0)
        label = `$${(current / 1000000).toFixed(2)}M`
        break

      case 'progress-100':
        // Count projects that reached 100% in timeframe
        current = projects.filter(p => 
          p.progress === 100 && 
          new Date(p.updatedAt) >= startDate
        ).length
        label = `${current} project${current !== 1 ? 's' : ''}`
        break

      case 'projects-completed':
        // Count projects completed in timeframe
        current = projects.filter(p => 
          p.status === 'completed' && 
          new Date(p.updatedAt) >= startDate
        ).length
        label = `${current} project${current !== 1 ? 's' : ''}`
        break

      case 'expenses':
        // Sum expenses in timeframe
        current = projects.reduce((sum, p) => {
          const projectExpenses = p.expenses
            .filter(e => new Date(e.createdAt) >= startDate)
            .reduce((expSum, e) => expSum + e.amount, 0)
          return sum + projectExpenses
        }, 0)
        label = `$${(current / 1000000).toFixed(2)}M`
        break

      case 'profit':
        // Calculate profit margin for projects in timeframe
        const projectsInTimeframe = projects.filter(p => new Date(p.createdAt) >= startDate)
        const totalRevenue = projectsInTimeframe.reduce((sum, p) => sum + p.contractAmount, 0)
        const totalExpenses = projectsInTimeframe.reduce((sum, p) => {
return sum + (p.expenses || []).reduce((expSum, e) => expSum + e.amount, 0)
        }, 0)
        current = totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0
        label = `${current.toFixed(1)}%`
        break
    }

    // Calculate percentage if target is set
    const percentage = kpi.target ? (current / kpi.target) * 100 : undefined

    return { current, percentage, label }
  }

  if (customKPIs.length === 0) return null

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {customKPIs.map(kpi => {
        const { current, percentage, label } = calculateKPIValue(kpi)

        return (
          <div
            key={kpi.id}
            className="bg-white dark:bg-[#1e1e1e] rounded-xl p-4 border border-gray-200 dark:border-[#2a2a2a] hover:shadow-lg transition-shadow relative group"
          >
            {/* Delete Button */}
            <button
              onClick={() => onDelete(kpi.id)}
              className="absolute top-2 right-2 w-6 h-6 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200 dark:hover:bg-red-900/40 flex items-center justify-center"
              title="Delete KPI"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Icon with custom color */}
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
              style={{ backgroundColor: `${kpi.color}20` }}
            >
              <svg className="w-5 h-5" style={{ color: kpi.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>

            {/* KPI Name */}
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              {kpi.name}
            </h3>

            {/* Current Value */}
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
              {label}
            </p>

            {/* Timeframe */}
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">
              {kpi.timeframe === 'week' && 'This Week'}
              {kpi.timeframe === 'month' && 'This Month'}
              {kpi.timeframe === 'quarter' && 'This Quarter'}
              {kpi.timeframe === 'year' && 'This Year'}
            </p>

            {/* Progress Bar (if target is set) */}
            {kpi.target && percentage !== undefined && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">
                    Target: {kpi.metric === 'revenue' || kpi.metric === 'expenses' 
                      ? `$${(kpi.target / 1000000).toFixed(2)}M` 
                      : kpi.metric === 'profit'
                      ? `${kpi.target}%`
                      : kpi.target}
                  </span>
                  <span className="font-semibold" style={{ color: kpi.color }}>
                    {percentage.toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-[#2a2a2a] rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, percentage)}%`,
                      backgroundColor: kpi.color,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Status Badge */}
            {kpi.target && percentage !== undefined && (
              <div className="mt-2">
                {percentage >= 100 ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs font-medium rounded">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Target Reached
                  </span>
                ) : percentage >= 75 ? (
                  <span className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-xs font-medium rounded">
                    On Track
                  </span>
                ) : percentage >= 50 ? (
                  <span className="inline-flex items-center px-2 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 text-xs font-medium rounded">
                    Behind
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-xs font-medium rounded">
                    At Risk
                  </span>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
