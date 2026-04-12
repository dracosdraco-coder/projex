'use client'

import { useState, useEffect } from 'react'
import { Project } from '@/types'
import { Modal } from './Modal'
import LoadingSpinner from './Loading'

interface EditProjectModalProps {
  project: Project | null
  isOpen: boolean
  onClose: () => void
  onSubmit: (projectId: string, updates: Partial<Project>) => Promise<void>
  branches: { id: string; name: string }[]
}

export default function EditProjectModal({ 
  project, isOpen, onClose, onSubmit, branches 
}: EditProjectModalProps) {
  const isCreate = !project
  const [formData, setFormData] = useState({
    name: '', description: '', client: '', branch: '', address: '',
    startDate: '', dueDate: '', contractAmount: 0,
    status: 'active' as 'active' | 'on-hold' | 'completed', progress: 0,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || '', description: project.description || '',
        client: project.client || '', branch: project.branch || '',
        address: project.address || '', startDate: project.startDate || '',
        dueDate: project.dueDate || '', contractAmount: project.contractAmount || 0,
        status: project.status, progress: project.progress || 0,
      })
    } else {
      setFormData({
        name: '', description: '', client: '', branch: '', address: '',
        startDate: '', dueDate: '', contractAmount: 0, status: 'active', progress: 0,
      })
    }
  }, [project])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return
    setIsSubmitting(true)
    try {
      await onSubmit(project?.id || '', formData)
      onClose()
    } catch (error) {
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isCreate ? 'New Project' : 'Edit Project'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project Name</label>
          <input type="text" value={formData.name} onChange={(e) => handleChange('name', e.target.value)}
            className="w-full px-4 py-2 bg-gray-50 dark:bg-[#222222] border border-gray-200 dark:border-[#333333] rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20" required />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
          <textarea value={formData.description} onChange={(e) => handleChange('description', e.target.value)} rows={3}
            className="w-full px-4 py-2 bg-gray-50 dark:bg-[#222222] border border-gray-200 dark:border-[#333333] rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Client</label>
            <input type="text" value={formData.client} onChange={(e) => handleChange('client', e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-[#222222] border border-gray-200 dark:border-[#333333] rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Branch</label>
            <select value={formData.branch} onChange={(e) => handleChange('branch', e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-[#222222] border border-gray-200 dark:border-[#333333] rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
              <option value="">Select Branch</option>
              {branches.map(branch => (<option key={branch.id} value={branch.name}>{branch.name}</option>))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
          <input type="text" value={formData.address} onChange={(e) => handleChange('address', e.target.value)}
            className="w-full px-4 py-2 bg-gray-50 dark:bg-[#222222] border border-gray-200 dark:border-[#333333] rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
            <input type="date" value={formData.startDate} onChange={(e) => handleChange('startDate', e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-[#222222] border border-gray-200 dark:border-[#333333] rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due Date</label>
            <input type="date" value={formData.dueDate} onChange={(e) => handleChange('dueDate', e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-[#222222] border border-gray-200 dark:border-[#333333] rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contract Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
              <input type="number" value={formData.contractAmount} onChange={(e) => handleChange('contractAmount', parseFloat(e.target.value) || 0)}
                className="w-full pl-8 pr-4 py-2 bg-gray-50 dark:bg-[#222222] border border-gray-200 dark:border-[#333333] rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
            <select value={formData.status} onChange={(e) => handleChange('status', e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-[#222222] border border-gray-200 dark:border-[#333333] rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
              <option value="active">Active</option>
              <option value="on-hold">On Hold</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Progress (%)</label>
            <input type="number" min="0" max="100" value={formData.progress}
              onChange={(e) => handleChange('progress', Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-[#222222] border border-gray-200 dark:border-[#333333] rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-[#2a2a2a]">
          <button type="button" onClick={onClose} disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-[#2a2a2a] hover:bg-gray-200 dark:hover:bg-[#333333] rounded-lg transition-colors">Cancel</button>
          <button type="submit" disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-gray-900 dark:bg-gray-100 dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-300 rounded-lg transition-colors flex items-center gap-2">
            {isSubmitting && <LoadingSpinner size="sm" />}
            {isCreate ? 'Create Project' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
