import { Project } from '@/types'

interface KPIWidgetProps {
  projects: Project[]
  totalContractAmount: number
  totalExpenses: number
  grossProfit: number
  onOpenKPI: () => void
}

export default function KPIWidget({
  projects,
  totalContractAmount,
  totalExpenses,
  grossProfit,
  onOpenKPI,
}: KPIWidgetProps) {
  const activeProjects = projects.filter(p => p.status === 'active')
  const avgProgress = projects.length > 0
    ? Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / projects.length)
    : 0
  const profitMargin = totalContractAmount > 0
    ? ((grossProfit / totalContractAmount) * 100).toFixed(1)
    : '0.0'

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800/50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Key Performance Indicators
        </h3>
        <button
          onClick={onOpenKPI}
          className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
        >
          View Full KPIs →
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Active Projects */}
        <div className="bg-white/50 dark:bg-[#1e1e1e]/50 backdrop-blur-sm rounded-lg p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Active Projects</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {activeProjects.length}
          </p>
        </div>

        {/* Average Progress */}
        <div className="bg-white/50 dark:bg-[#1e1e1e]/50 backdrop-blur-sm rounded-lg p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Avg Progress</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {avgProgress}%
          </p>
        </div>

        {/* Profit Margin */}
        <div className="bg-white/50 dark:bg-[#1e1e1e]/50 backdrop-blur-sm rounded-lg p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Profit Margin</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {profitMargin}%
          </p>
        </div>

        {/* Total Revenue */}
        <div className="bg-white/50 dark:bg-[#1e1e1e]/50 backdrop-blur-sm rounded-lg p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Revenue</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            ${(totalContractAmount / 1000000).toFixed(1)}M
          </p>
        </div>
      </div>

      {/* Quick Progress Overview */}
      <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800/50">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Top Projects</p>
        <div className="space-y-2">
          {activeProjects.slice(0, 3).map((project) => (
            <div key={project.id} className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
                  {project.name}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-16 bg-gray-200 dark:bg-[#2a2a2a] rounded-full h-1.5">
                  <div 
                    className="bg-blue-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-gray-900 dark:text-gray-100 w-8 text-right">
                  {project.progress}%
                </span>
              </div>
            </div>
          ))}
          {activeProjects.length === 0 && (
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-2">
              No active projects
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
