'use client'

import { useState, useEffect, useRef } from 'react'
import { Branch } from '@/types'

export interface FilterState {
  userRole: ('admin' | 'team-member' | 'manager' | 'all')[]
  branches: string[]
  workspace: ('default' | 'custom-1' | 'custom-2' | 'custom-3')[]
  dateRange: ('today' | 'week' | 'month' | 'quarter' | 'ytd' | 'year' | 'all-time')[]
  dateCategory: ('any' | 'proposal' | 'contract' | 'start' | 'completion')[]
  months: string[] // ['01', '02', '03', etc.]
  years: string[] // ['2024', '2025', etc.]
}

interface FilterBarProps {
  branches: Branch[]
  currentFilters: FilterState
  onFilterChange: (filters: FilterState) => void
  className?: string
}

const USER_ROLES = [
  { value: 'all', label: 'All Views' },
  { value: 'admin', label: 'Admin View' },
  { value: 'manager', label: 'Manager View' },
  { value: 'team-member', label: 'Team View' },
] as const

const WORKSPACES = [
  { value: 'default', label: 'Default Workspace' },
  { value: 'custom-1', label: 'Workspace 1' },
  { value: 'custom-2', label: 'Workspace 2' },
  { value: 'custom-3', label: 'Workspace 3' },
] as const

const DATE_RANGES = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'quarter', label: 'This Quarter' },
  { value: 'ytd', label: 'Year to Date' },
  { value: 'year', label: 'This Year' },
  { value: 'all-time', label: 'All Time' },
] as const

const DATE_CATEGORIES = [
  { value: 'any', label: 'Any Date' },
  { value: 'proposal', label: 'Proposal Date' },
  { value: 'contract', label: 'Contract Date' },
  { value: 'start', label: 'Start Date' },
  { value: 'completion', label: 'Completion Date' },
] as const

const MONTHS = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
] as const

// Generate years (current year - 5 to current year + 2)
const generateYears = () => {
  const currentYear = new Date().getFullYear()
  const years = []
  for (let i = currentYear - 5; i <= currentYear + 2; i++) {
    years.push({ value: i.toString(), label: i.toString() })
  }
  return years
}

const YEARS = generateYears()

export default function FilterBar({ 
  branches, 
  currentFilters, 
  onFilterChange,
  className = ''
}: FilterBarProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [filters, setFilters] = useState<FilterState>(currentFilters)
  
  // Dropdown states
  const [showUserRoleDropdown, setShowUserRoleDropdown] = useState(false)
  const [showBranchDropdown, setShowBranchDropdown] = useState(false)
  const [showWorkspaceDropdown, setShowWorkspaceDropdown] = useState(false)
  const [showDateRangeDropdown, setShowDateRangeDropdown] = useState(false)
  const [showDateCategoryDropdown, setShowDateCategoryDropdown] = useState(false)
  const [showMonthDropdown, setShowMonthDropdown] = useState(false)
  const [showYearDropdown, setShowYearDropdown] = useState(false)

  // Update local state when props change
useEffect(() => {
  // Only call if filters actually changed
  if (JSON.stringify(filters) !== JSON.stringify(currentFilters)) {
    onFilterChange(filters)
  }
}, [filters])  // Remove onFilterChange from deps

  const handleArrayFilterChange = (key: keyof FilterState, value: string) => {
    const currentArray = filters[key] as string[]
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value]
    
    const newFilters = { ...filters, [key]: newArray }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const selectAll = (key: keyof FilterState) => {
    const newFilters = { ...filters, [key]: [] }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.userRole.length > 0) count++
    if (filters.branches.length > 0) count++
    if (filters.workspace.length > 0) count++
    if (filters.dateRange.length > 0) count++
    if (filters.dateCategory.length > 0) count++
    if (filters.months.length > 0) count++
    if (filters.years.length > 0) count++
    return count
  }

  const resetFilters = () => {
    const defaultFilters: FilterState = {
      userRole: [],
      branches: [],
      workspace: [],
      dateRange: [],
      dateCategory: [],
      months: [],
      years: []
    }
    setFilters(defaultFilters)
    onFilterChange(defaultFilters)
    
    // Close all dropdowns
    setShowUserRoleDropdown(false)
    setShowBranchDropdown(false)
    setShowWorkspaceDropdown(false)
    setShowDateRangeDropdown(false)
    setShowDateCategoryDropdown(false)
    setShowMonthDropdown(false)
    setShowYearDropdown(false)
  }

  const activeCount = getActiveFiltersCount()

  // Reusable dropdown component
  const FilterDropdown = ({
    label,
    isOpen,
    setIsOpen,
    items,
    selectedItems,
    onToggle,
    onSelectAll,
    filterKey
  }: {
    label: string
    isOpen: boolean
    setIsOpen: (open: boolean) => void
    items: readonly { value: string; label: string }[]
    selectedItems: string[]
    onToggle: (value: string) => void
    onSelectAll: () => void
    filterKey: keyof FilterState
  }) => {
    const btnRef = useRef<HTMLButtonElement>(null)
    const [pos, setPos] = useState({ top: 0, left: 0, width: 0 })

    useEffect(() => {
      if (isOpen && btnRef.current) {
        const r = btnRef.current.getBoundingClientRect()
        setPos({ top: r.bottom + 4, left: r.left, width: r.width })
      }
    }, [isOpen])

    return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
      </label>
      <div>
        <button
          ref={btnRef}
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-3 py-2 text-sm text-left bg-white dark:bg-[#222222] border border-gray-300 dark:border-[#333333] rounded-lg text-gray-900 dark:text-gray-100 hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between transition-colors"
        >
          <span>
            {selectedItems.length === 0 
              ? `All ${label}` 
              : `${selectedItems.length} selected`}
          </span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-[400]" 
              onClick={() => setIsOpen(false)}
            />
            <div
              className="fixed z-[401] bg-white dark:bg-[#222222] border border-gray-300 dark:border-[#333333] rounded-lg shadow-xl max-h-60 overflow-y-auto"
              style={{ top: pos.top, left: pos.left, width: Math.max(pos.width, 180) }}
            >
              <button
                onClick={() => {
                  onSelectAll()
                  setIsOpen(false)
                }}
                className="w-full px-3 py-2 text-sm text-left hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium border-b border-gray-200 dark:border-[#333333]"
              >
                All {label}
              </button>
              {items.map(item => (
                <label
                  key={item.value}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.value)}
                    onChange={() => onToggle(item.value)}
                    className="rounded text-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-900 dark:text-gray-100">
                    {item.label}
                  </span>
                </label>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
  }

  return (
    <div className={className}>
      {/* Compact Filter Button — stays inline in header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-gray-100 dark:bg-[#2a2a2a] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#333333] rounded-lg transition-colors border border-gray-200 dark:border-[#333333]"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filters
          {activeCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-blue-500 text-white text-xs font-semibold rounded-full">
              {activeCount}
            </span>
          )}
        </button>

        {/* Active filter pills — inline summary */}
        {activeCount > 0 && (
          <div className="flex items-center gap-1.5 text-xs">
            {filters.userRole.length > 0 && (
              <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded font-medium">
                {filters.userRole.length} role{filters.userRole.length !== 1 ? 's' : ''}
              </span>
            )}
            {filters.branches.length > 0 && (
              <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded font-medium">
                {filters.branches.length} branch{filters.branches.length !== 1 ? 'es' : ''}
              </span>
            )}
            <button
              onClick={() => onFilterChange({
                userRole: [], branches: [], workspace: [], dateRange: [],
                dateCategory: [], months: [], years: [],
              })}
              className="px-1.5 py-0.5 text-gray-400 hover:text-red-500 transition-colors"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Expanded Filter Panel — fixed overlay below header */}
      {isExpanded && (
        <>
          <div className="fixed inset-0 z-[300]" onClick={() => setIsExpanded(false)} />
          <div className="fixed left-0 right-0 top-14 z-[301] bg-white dark:bg-[#1e1e1e] border-b border-gray-200 dark:border-[#2a2a2a] shadow-xl">
            <div className="px-8 py-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Filters</h3>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onFilterChange({
                      userRole: [], branches: [], workspace: [], dateRange: [],
                      dateCategory: [], months: [], years: [],
                    })}
                    className="text-xs text-red-500 hover:text-red-600 font-medium"
                  >
                    Clear All
                  </button>
                  <button onClick={() => setIsExpanded(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            
            {/* User Role Filter */}
            <FilterDropdown
              label="User Role"
              isOpen={showUserRoleDropdown}
              setIsOpen={setShowUserRoleDropdown}
              items={USER_ROLES}
              selectedItems={filters.userRole}
              onToggle={(value) => handleArrayFilterChange('userRole', value)}
              onSelectAll={() => selectAll('userRole')}
              filterKey="userRole"
            />

            {/* Branches Filter */}
            <FilterDropdown
              label="Branches"
              isOpen={showBranchDropdown}
              setIsOpen={setShowBranchDropdown}
              items={branches.map(b => ({ value: b.id, label: b.name }))}
              selectedItems={filters.branches}
              onToggle={(value) => handleArrayFilterChange('branches', value)}
              onSelectAll={() => selectAll('branches')}
              filterKey="branches"
            />

            {/* Workspace Filter */}
            <FilterDropdown
              label="Workspace"
              isOpen={showWorkspaceDropdown}
              setIsOpen={setShowWorkspaceDropdown}
              items={WORKSPACES}
              selectedItems={filters.workspace}
              onToggle={(value) => handleArrayFilterChange('workspace', value)}
              onSelectAll={() => selectAll('workspace')}
              filterKey="workspace"
            />

            {/* Date Range Filter */}
            <FilterDropdown
              label="Date Range"
              isOpen={showDateRangeDropdown}
              setIsOpen={setShowDateRangeDropdown}
              items={DATE_RANGES}
              selectedItems={filters.dateRange}
              onToggle={(value) => handleArrayFilterChange('dateRange', value)}
              onSelectAll={() => selectAll('dateRange')}
              filterKey="dateRange"
            />

            {/* Date Category Filter */}
            <FilterDropdown
              label="Filter By Date"
              isOpen={showDateCategoryDropdown}
              setIsOpen={setShowDateCategoryDropdown}
              items={DATE_CATEGORIES}
              selectedItems={filters.dateCategory}
              onToggle={(value) => handleArrayFilterChange('dateCategory', value)}
              onSelectAll={() => selectAll('dateCategory')}
              filterKey="dateCategory"
            />

            {/* Month Filter */}
            <FilterDropdown
              label="Months"
              isOpen={showMonthDropdown}
              setIsOpen={setShowMonthDropdown}
              items={MONTHS}
              selectedItems={filters.months}
              onToggle={(value) => handleArrayFilterChange('months', value)}
              onSelectAll={() => selectAll('months')}
              filterKey="months"
            />

            {/* Year Filter */}
            <FilterDropdown
              label="Years"
              isOpen={showYearDropdown}
              setIsOpen={setShowYearDropdown}
              items={YEARS}
              selectedItems={filters.years}
              onToggle={(value) => handleArrayFilterChange('years', value)}
              onSelectAll={() => selectAll('years')}
              filterKey="years"
            />

              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}