'use client'

import { useState } from 'react'
import { Modal } from './Modal'

export interface CustomKPI {
  id: string
  name: string
  metric: 'contracts' | 'revenue' | 'progress-100' | 'projects-completed' | 'expenses' | 'profit'
  timeframe: 'week' | 'month' | 'quarter' | 'year'
  target?: number
  color: string
  createdAt: string
}

interface AddCustomKPIModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (kpi: Omit<CustomKPI, 'id' | 'createdAt'>) => void
}

const METRIC_OPTIONS = [
  { value: 'contracts', label: 'Contracts Signed', description: 'Track new contracts signed' },
  { value: 'revenue', label: 'Revenue Generated', description: 'Track total revenue in period' },
  { value: 'progress-100', label: 'Projects at 100%', description: 'Track projects reaching 100% completion' },
  { value: 'projects-completed', label: 'Projects Completed', description: 'Track projects with completed status' },
  { value: 'expenses', label: 'Total Expenses', description: 'Track expenses in period' },
  { value: 'profit', label: 'Profit Margin', description: 'Track profit percentage' },
]

const TIMEFRAME_OPTIONS = [
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'quarter', label: 'This Quarter' },
  { value: 'year', label: 'This Year' },
]

const COLOR_OPTIONS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Orange
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#F97316', // Orange
]

export default function AddCustomKPIModal({ isOpen, onClose, onAdd }: AddCustomKPIModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    metric: 'contracts' as CustomKPI['metric'],
    timeframe: 'month' as CustomKPI['timeframe'],
    target: '',
    color: COLOR_OPTIONS[0],
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    onAdd({
      name: formData.name,
      metric: formData.metric,
      timeframe: formData.timeframe,
      target: formData.target ? parseFloat(formData.target) : undefined,
      color: formData.color,
    })

    // Reset form
    setFormData({
      name: '',
      metric: 'contracts',
      timeframe: 'month',
      target: '',
      color: COLOR_OPTIONS[0],
    })
    
    onClose()
  }

  const selectedMetric = METRIC_OPTIONS.find(m => m.value === formData.metric)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Custom KPI" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* KPI Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            KPI Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-4 py-2 bg-gray-50 dark:bg-[#222222] border border-gray-200 dark:border-[#333333] rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            placeholder="e.g., Q4 Revenue Target"
            required
          />
        </div>

        {/* Metric Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            What to Track <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.metric}
            onChange={(e) => setFormData(prev => ({ ...prev, metric: e.target.value as CustomKPI['metric'] }))}
            className="w-full px-4 py-2 bg-gray-50 dark:bg-[#222222] border border-gray-200 dark:border-[#333333] rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            {METRIC_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {selectedMetric && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {selectedMetric.description}
            </p>
          )}
        </div>

        {/* Timeframe */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Time Period <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {TIMEFRAME_OPTIONS.map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, timeframe: option.value as CustomKPI['timeframe'] }))}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  formData.timeframe === option.value
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-[#222222] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#2a2a2a]'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Target (Optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Target Value <span className="text-gray-400">(Optional)</span>
          </label>
          <input
            type="number"
            value={formData.target}
            onChange={(e) => setFormData(prev => ({ ...prev, target: e.target.value }))}
            className="w-full px-4 py-2 bg-gray-50 dark:bg-[#222222] border border-gray-200 dark:border-[#333333] rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            placeholder="e.g., 10 contracts or $500,000"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Set a goal to track progress against
          </p>
        </div>

        {/* Color Picker */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Color
          </label>
          <div className="flex gap-2">
            {COLOR_OPTIONS.map(color => (
              <button
                key={color}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, color }))}
                className={`w-8 h-8 rounded-lg transition-transform ${
                  formData.color === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-[#2a2a2a]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-[#2a2a2a] hover:bg-gray-200 dark:hover:bg-[#333333] rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
          >
            Add KPI
          </button>
        </div>
      </form>
    </Modal>
  )
}
