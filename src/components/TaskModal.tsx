'use client'

import { useState, useEffect } from 'react'
import { Task, TaskStatus, TaskPriority, ProjectPhase } from '@/types/project-types-enhanced'

interface TaskModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void
  task?: Task
  phases: ProjectPhase[]
  currentPhaseId: string
}

export default function TaskModal({
  isOpen,
  onClose,
  onSave,
  task,
  phases,
  currentPhaseId,
}: TaskModalProps) {
const [formData, setFormData] = useState({
  title: task?.title || '',
  description: task?.description || '',
  status: task?.status || 'todo' as TaskStatus,
  priority: task?.priority || 'medium' as TaskPriority,
  estimatedHours: task?.estimatedHours || 0,
  actualHours: task?.actualHours || 0,
  estimatedCost: task?.estimatedCost || 0,
  actualCost: task?.actualCost || 0,
  startDate: task?.startDate || '',
  dueDate: task?.dueDate || '',
  completedDate: task?.completedDate || '',
  assignedTo: task?.assignedTo || [],
  dependencies: task?.dependencies || [],
  tags: task?.tags || [],
})

  const [tagInput, setTagInput] = useState('')

useEffect(() => {
  if (task) {
    setFormData({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      estimatedHours: task.estimatedHours,
      actualHours: task.actualHours || 0,
      estimatedCost: task.estimatedCost || 0,
      actualCost: task.actualCost || 0,
      startDate: task.startDate || '',
      dueDate: task.dueDate || '',
      completedDate: task.completedDate || '',
      assignedTo: task.assignedTo || [],
      dependencies: task.dependencies || [],
      tags: task.tags || [],
    })
  }
}, [task])

  useEffect(() => {
  if (formData.status === 'done' && !formData.completedDate) {
    setFormData(prev => ({
      ...prev,
      completedDate: new Date().toISOString().split('T')[0]
    }))
  }
}, [formData.status])

  const handleSubmit = () => {
    if (!formData.title.trim()) return

    onSave({
      ...formData,
      blockers: task?.blockers,
    })
    onClose()
  }

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()],
      })
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(t => t !== tag),
    })
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99998]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-6">
        <div 
          className="bg-white dark:bg-[#1c1c1e] rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-8 py-5 border-b border-gray-200 dark:border-[#2c2c2e]">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              {task ? 'Edit Task' : 'New Task'}
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-[#2c2c2e] transition-colors"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-8">
            <div className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Task Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2.5 bg-white dark:bg-[#000000] border border-gray-300 dark:border-[#2c2c2e] rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
                  placeholder="Install roofing membrane"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2.5 bg-white dark:bg-[#000000] border border-gray-300 dark:border-[#2c2c2e] rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white resize-none"
                  placeholder="Detailed description of the task..."
                />
              </div>

              {/* Status & Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
                    className="w-full px-3 py-2.5 bg-white dark:bg-[#000000] border border-gray-300 dark:border-[#2c2c2e] rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
                  >
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="blocked">Blocked</option>
                    <option value="done">Done</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
                    className="w-full px-3 py-2.5 bg-white dark:bg-[#000000] border border-gray-300 dark:border-[#2c2c2e] rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              {/* Dates & Hours */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Estimated Hours
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={formData.estimatedHours}
                    onChange={(e) => setFormData({ ...formData, estimatedHours: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2.5 bg-white dark:bg-[#000000] border border-gray-300 dark:border-[#2c2c2e] rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2.5 bg-white dark:bg-[#000000] border border-gray-300 dark:border-[#2c2c2e] rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3 py-2.5 bg-white dark:bg-[#000000] border border-gray-300 dark:border-[#2c2c2e] rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
                  />
                </div>
              </div>

{/* Costs Section */}
<div className="grid grid-cols-2 gap-4">
  <div>
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
      Estimated Cost ($)
    </label>
    <input
      type="number"
      min="0"
      step="0.01"
      value={formData.estimatedCost || ''}
      onChange={(e) => setFormData({ ...formData, estimatedCost: parseFloat(e.target.value) || 0 })}
      className="w-full px-3 py-2.5 bg-white dark:bg-[#000000] border border-gray-300 dark:border-[#2c2c2e] rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
    />
  </div>

  <div>
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
      Actual Cost ($)
    </label>
    <input
      type="number"
      min="0"
      step="0.01"
      value={formData.actualCost || ''}
      onChange={(e) => setFormData({ ...formData, actualCost: parseFloat(e.target.value) || 0 })}
      className="w-full px-3 py-2.5 bg-white dark:bg-[#000000] border border-gray-300 dark:border-[#2c2c2e] rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
    />
  </div>
</div>

{/* Actual Hours */}
<div>
  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
    Actual Hours (for completed tasks)
  </label>
  <input
    type="number"
    min="0"
    step="0.5"
    value={formData.actualHours || ''}
    onChange={(e) => setFormData({ ...formData, actualHours: parseFloat(e.target.value) || 0 })}
    className="w-full px-3 py-2.5 bg-white dark:bg-[#000000] border border-gray-300 dark:border-[#2c2c2e] rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
  />
</div>

{/* Completed Date (auto-fill when status = done) */}
{formData.status === 'done' && (
  <div>
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
      Completed Date
    </label>
    <input
      type="date"
      value={formData.completedDate}
      onChange={(e) => setFormData({ ...formData, completedDate: e.target.value })}
      className="w-full px-3 py-2.5 bg-white dark:bg-[#000000] border border-gray-300 dark:border-[#2c2c2e] rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
    />
  </div>
)}

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tags
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    className="flex-1 px-3 py-2.5 bg-white dark:bg-[#000000] border border-gray-300 dark:border-[#2c2c2e] rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
                    placeholder="Add tag..."
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-4 py-2.5 bg-gray-200 dark:bg-[#2c2c2e] text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-[#3c3c3e] transition-colors font-medium"
                  >
                    Add
                  </button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 bg-gray-100 dark:bg-[#2c2c2e] text-gray-700 dark:text-gray-300 text-sm rounded-lg flex items-center gap-2"
                      >
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-8 py-5 border-t border-gray-200 dark:border-[#2c2c2e]">
            <button
              onClick={onClose}
              className="px-5 py-2.5 border border-gray-300 dark:border-[#2c2c2e] text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-[#2c2c2e] transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!formData.title.trim()}
              className="px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {task ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
