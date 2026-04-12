'use client'

import { useState } from 'react'
import { Modal } from './Modal'
import  LoadingSpinner from './Loading'
import { Expense } from '@/types'

interface AddExpenseModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (expense: Omit<Expense, 'id'>) => Promise<void>
  projectName: string
  projectId: string
}

export default function AddExpenseModal({ 
  isOpen, 
  onClose, 
  onSubmit,
  projectName,
  projectId
}: AddExpenseModalProps) {
  const [formData, setFormData] = useState({
    type: 'materials' as Expense['type'],
    description: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const expenseTypes: { value: Expense['type']; label: string }[] = [
    { value: 'labor', label: 'Labor' },
    { value: 'materials', label: 'Materials' },
    { value: 'equipment', label: 'Equipment' },
    { value: 'subcontractor', label: 'Subcontractor' },
    { value: 'other', label: 'Other' },
  ]

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.description.trim()) newErrors.description = 'Description is required'
    if (formData.amount <= 0) newErrors.amount = 'Amount must be greater than 0'
    if (!formData.date) newErrors.date = 'Date is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  if (!validate()) return
  setIsSubmitting(true)
  try {
    // Add timestamps to formData before submitting
    await onSubmit({
      ...formData,
      projectId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    
    // Reset form
    setFormData({
      type: 'materials',
      description: '',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
    })
    onClose()
  } catch (error) {
  } finally {
    setIsSubmitting(false)
  }
}

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Expense" size="md">
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Adding expense to <span className="font-medium text-gray-700 dark:text-gray-300">{projectName}</span>
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Expense Type
          </label>
          <select
            value={formData.type}
            onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as Expense['type'] }))}
            className="w-full px-4 py-2 bg-gray-50 dark:bg-[#222222] border border-gray-200 dark:border-[#333333] rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            {expenseTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Description <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) => {
              setFormData(prev => ({ ...prev, description: e.target.value }))
              if (errors.description) setErrors(prev => ({ ...prev, description: '' }))
            }}
            className={`w-full px-4 py-2 bg-gray-50 dark:bg-[#222222] border rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
              errors.description ? 'border-red-500' : 'border-gray-200 dark:border-[#333333]'
            }`}
            placeholder="What was this expense for?"
          />
          {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
        </div>

        {/* Amount & Date */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Amount <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
              <input
                type="number"
                value={formData.amount || ''}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))
                  if (errors.amount) setErrors(prev => ({ ...prev, amount: '' }))
                }}
                className={`w-full pl-8 pr-4 py-2 bg-gray-50 dark:bg-[#222222] border rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                  errors.amount ? 'border-red-500' : 'border-gray-200 dark:border-[#333333]'
                }`}
                placeholder="0.00"
              />
            </div>
            {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-[#222222] border border-gray-200 dark:border-[#333333] rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-[#2a2a2a]">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-[#2a2a2a] hover:bg-gray-200 dark:hover:bg-[#333333] rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-gray-900 dark:bg-gray-100 dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-300 rounded-lg transition-colors flex items-center gap-2"
          >
            {isSubmitting && <LoadingSpinner size="sm" />}
            Add Expense
          </button>
        </div>
      </form>
    </Modal>
  )
}