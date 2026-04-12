'use client'

import { useState, useMemo } from 'react'
import { Project } from '@/types'
import { formatCurrency } from '@/lib/utils'

interface BudgetingContentProps {
  projects: Project[]
  onAddExpense?: (projectId: string, expense: {
    type: string
    description: string
    amount: number
    date: string
  }) => Promise<void>
  onDeleteExpense?: (projectId: string, expenseId: string) => Promise<void>
  onUpdateExpense?: (projectId: string, expenseId: string, updates: {
    type?: string
    description?: string
    amount?: number
    date?: string
  }) => Promise<void>
}

type CategoryFilter = 'all' | 'materials' | 'labor' | 'equipment' | 'permits' | 'subcontractor' | 'other'

const EXPENSE_CATEGORIES = [
  { value: 'materials', label: 'Materials', color: 'bg-blue-500' },
  { value: 'labor', label: 'Labor', color: 'bg-green-500' },
  { value: 'equipment', label: 'Equipment', color: 'bg-purple-500' },
  { value: 'permits', label: 'Permits', color: 'bg-orange-500' },
  { value: 'subcontractor', label: 'Subcontractor', color: 'bg-pink-500' },
  { value: 'other', label: 'Other', color: 'bg-gray-500' },
]

export default function BudgetingContent({
  projects = [],
  onAddExpense,
  onDeleteExpense,
  onUpdateExpense,
}: BudgetingContentProps) {
  const [selectedProject, setSelectedProject] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [editingExpense, setEditingExpense] = useState<string | null>(null)
  
  // New expense form
  const [newExpense, setNewExpense] = useState({
    type: 'materials',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
  })

  // Filter projects
  const filteredProjects = useMemo(() => {
    if (selectedProject === 'all') return projects
    return projects.filter(p => p.id === selectedProject)
  }, [projects, selectedProject])

  // Calculate totals
  const totals = useMemo(() => {
    const allExpenses = filteredProjects.flatMap(p => p.expenses || [])
    const filteredExpenses = categoryFilter === 'all' 
      ? allExpenses 
      : allExpenses.filter(e => e.type === categoryFilter)

    const totalBudget = filteredProjects.reduce((sum, p) => sum + (p.contractAmount || 0), 0)
    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0)
    const totalProfit = totalBudget - filteredProjects.reduce((sum, p) => 
      (p.expenses || []).reduce((s, e) => s + e.amount, 0), 0
    )
    
    // By category
    const byCategory: Record<string, number> = {}
    EXPENSE_CATEGORIES.forEach(cat => {
      byCategory[cat.value] = allExpenses
        .filter(e => e.type === cat.value)
        .reduce((sum, e) => sum + e.amount, 0)
    })

    return {
      totalBudget,
      totalExpenses,
      totalProfit,
      profitMargin: totalBudget > 0 ? ((totalProfit / totalBudget) * 100) : 0,
      byCategory,
      expenseCount: filteredExpenses.length
    }
  }, [filteredProjects, categoryFilter])

  const handleAddExpense = async () => {
    if (!selectedProject || selectedProject === 'all' || !newExpense.description || !newExpense.amount) {
      alert('Please select a project and fill in all fields')
      return
    }

    try {
      await onAddExpense?.(selectedProject, {
        type: newExpense.type,
        description: newExpense.description,
        amount: parseFloat(newExpense.amount),
        date: newExpense.date,
      })

      // Reset form
      setNewExpense({
        type: 'materials',
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
      })
      setShowAddExpense(false)
    } catch (error) {
      alert('Failed to add expense')
    }
  }

  const handleDeleteExpense = async (projectId: string, expenseId: string) => {
    if (!confirm('Delete this expense?')) return
    
    try {
      await onDeleteExpense?.(projectId, expenseId)
    } catch (error) {
      alert('Failed to delete expense')
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-[#2a2a2a] flex-shrink-0">
        <div className="flex items-center gap-4">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Budget & Expenses</h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {totals.expenseCount} expenses
          </span>
        </div>

        <button
          onClick={() => setShowAddExpense(!showAddExpense)}
          disabled={selectedProject === 'all'}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm rounded-lg transition-colors font-medium"
        >
          + Add Expense
        </button>
      </div>

      {/* Filters */}
      <div className="p-4 border-b border-gray-200 dark:border-[#2a2a2a] flex-shrink-0 space-y-3">
        {/* Project Filter */}
        <div>
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">
            Project
          </label>
          <select
            value={selectedProject}
            onChange={(e) => {
              setSelectedProject(e.target.value)
              setShowAddExpense(false)
            }}
            className="w-full px-3 py-2 border border-gray-300 dark:border-[#333] rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 text-sm"
          >
            <option value="all">All Projects</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              categoryFilter === 'all'
                ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                : 'bg-gray-200 dark:bg-[#252525] text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-[#333]'
            }`}
          >
            All
          </button>
          {EXPENSE_CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => setCategoryFilter(cat.value as CategoryFilter)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                categoryFilter === cat.value
                  ? `${cat.color} text-white`
                  : 'bg-gray-200 dark:bg-[#252525] text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-[#333]'
              }`}
            >
              {cat.label} ({totals.byCategory[cat.value] > 0 ? formatCurrency(totals.byCategory[cat.value]) : '$0'})
            </button>
          ))}
        </div>
      </div>

      {/* Add Expense Form */}
      {showAddExpense && selectedProject !== 'all' && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 flex-shrink-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <select
              value={newExpense.type}
              onChange={(e) => setNewExpense({ ...newExpense, type: e.target.value })}
              className="px-3 py-2 border border-gray-300 dark:border-[#333] rounded-lg bg-white dark:bg-[#1a1a1a] text-sm"
            >
              {EXPENSE_CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Description"
              value={newExpense.description}
              onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
              className="px-3 py-2 border border-gray-300 dark:border-[#333] rounded-lg bg-white dark:bg-[#1a1a1a] text-sm"
            />

            <input
              type="number"
              placeholder="Amount"
              value={newExpense.amount}
              onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
              className="px-3 py-2 border border-gray-300 dark:border-[#333] rounded-lg bg-white dark:bg-[#1a1a1a] text-sm"
            />

            <input
              type="date"
              value={newExpense.date}
              onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
              className="px-3 py-2 border border-gray-300 dark:border-[#333] rounded-lg bg-white dark:bg-[#1a1a1a] text-sm"
            />
          </div>

          <div className="flex gap-2 mt-3">
            <button
              onClick={handleAddExpense}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg font-medium"
            >
              Add Expense
            </button>
            <button
              onClick={() => setShowAddExpense(false)}
              className="px-4 py-2 bg-gray-200 dark:bg-[#252525] hover:bg-gray-300 dark:hover:bg-[#333] text-gray-900 dark:text-gray-100 text-sm rounded-lg font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 flex-shrink-0 bg-gray-50 dark:bg-[#111]">
        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-4 border border-gray-200 dark:border-[#2a2a2a]">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Budget</div>
          <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {formatCurrency(totals.totalBudget)}
          </div>
        </div>

        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-4 border border-gray-200 dark:border-[#2a2a2a]">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Expenses</div>
          <div className="text-xl font-bold text-red-600 dark:text-red-400">
            {formatCurrency(totals.totalExpenses)}
          </div>
        </div>

        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-4 border border-gray-200 dark:border-[#2a2a2a]">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Profit</div>
          <div className={`text-xl font-bold ${
            totals.totalProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          }`}>
            {formatCurrency(totals.totalProfit)}
          </div>
        </div>

        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-4 border border-gray-200 dark:border-[#2a2a2a]">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Profit Margin</div>
          <div className={`text-xl font-bold ${
            totals.profitMargin >= 20 ? 'text-green-600 dark:text-green-400' : 
            totals.profitMargin >= 10 ? 'text-yellow-600 dark:text-yellow-400' : 
            'text-red-600 dark:text-red-400'
          }`}>
            {totals.profitMargin.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Expenses List */}
      <div className="flex-1 overflow-auto p-4">
        {filteredProjects.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-12">
            No projects found
          </div>
        ) : (
          <div className="space-y-6">
            {filteredProjects.map(project => {
              const projectExpenses = (project.expenses || []).filter(e =>
                categoryFilter === 'all' || e.type === categoryFilter
              )
              
              if (projectExpenses.length === 0 && categoryFilter !== 'all') return null

              const projectTotal = (project.expenses || []).reduce((sum, e) => sum + e.amount, 0)
              const projectProfit = (project.contractAmount || 0) - projectTotal
              const budgetUsed = project.contractAmount > 0 
                ? ((projectTotal / project.contractAmount) * 100) 
                : 0

              return (
                <div key={project.id} className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-[#2a2a2a]">
                  {/* Project Header */}
                  <div className="p-4 border-b border-gray-200 dark:border-[#2a2a2a]">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                        {project.name}
                      </h4>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="text-gray-600 dark:text-gray-400">
                          Budget: <span className="font-medium text-gray-900 dark:text-gray-100">
                            {formatCurrency(project.contractAmount || 0)}
                          </span>
                        </div>
                        <div className="text-gray-600 dark:text-gray-400">
                          Spent: <span className="font-medium text-red-600 dark:text-red-400">
                            {formatCurrency(projectTotal)}
                          </span>
                        </div>
                        <div className={`font-medium ${
                          projectProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        }`}>
                          {formatCurrency(projectProfit)}
                        </div>
                      </div>
                    </div>

                    {/* Budget Bar */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-gray-200 dark:bg-[#252525] rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-full transition-all ${
                            budgetUsed > 100 ? 'bg-red-500' :
                            budgetUsed > 80 ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(budgetUsed, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400 min-w-[3rem] text-right">
                        {budgetUsed.toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  {/* Expenses Table */}
                  {projectExpenses.length === 0 ? (
                    <div className="p-6 text-center text-gray-500 dark:text-gray-400 text-sm">
                      No expenses yet
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-[#111]/50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400">Date</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400">Category</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400">Description</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-600 dark:text-gray-400">Amount</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-600 dark:text-gray-400">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-[#2a2a2a]">
                          {projectExpenses.map(expense => (
                            <tr key={expense.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                              <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                                {new Date(expense.date).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  EXPENSE_CATEGORIES.find(c => c.value === expense.type)?.color || 'bg-gray-500'
                                } text-white`}>
                                  {EXPENSE_CATEGORIES.find(c => c.value === expense.type)?.label || expense.type}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                                {expense.description}
                              </td>
                              <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 dark:text-gray-100">
                                {formatCurrency(expense.amount)}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <button
                                  onClick={() => handleDeleteExpense(project.id, expense.id)}
                                  className="text-red-600 hover:text-red-800 dark:text-red-400 text-sm font-medium"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}