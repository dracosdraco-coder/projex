'use client'

import { useEffect } from 'react'
import { Task, TaskStatus, TaskPriority, ProjectPhase } from '@/types/project-types-enhanced'
import { useFormDraft } from '@/hooks/useFormDraft'
import { RotateCcw } from 'lucide-react'

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
  const draftKey = task ? `edit_task_${task.id}` : 'create_task'

  const initial = {
    title: task?.title || '',
    description: task?.description || '',
    status: (task?.status || 'todo') as TaskStatus,
    priority: (task?.priority || 'medium') as TaskPriority,
    estimatedHours: task?.estimatedHours || 0,
    actualHours: task?.actualHours || 0,
    estimatedCost: task?.estimatedCost || 0,
    actualCost: task?.actualCost || 0,
    startDate: task?.startDate || '',
    dueDate: task?.dueDate || '',
    completedDate: task?.completedDate || '',
    assignedTo: task?.assignedTo || ([] as string[]),
    dependencies: task?.dependencies || ([] as string[]),
    tags: task?.tags || ([] as string[]),
    tagInput: '',
  }

  const { values: formData, update, setValues, clearDraft, hasDraft } = useFormDraft(draftKey, initial)

  // Sync when editing an existing task
  useEffect(() => {
    if (task) {
      setValues({
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
        tagInput: '',
      })
    }
  }, [task])

  // Auto-fill completed date when status = done
  useEffect(() => {
    if (formData.status === 'done' && !formData.completedDate) {
      update({ completedDate: new Date().toISOString().split('T')[0] })
    }
  }, [formData.status])

  const handleSubmit = () => {
    if (!formData.title.trim()) return
    onSave({
      title: formData.title,
      description: formData.description,
      status: formData.status,
      priority: formData.priority,
      estimatedHours: formData.estimatedHours,
      actualHours: formData.actualHours,
      estimatedCost: formData.estimatedCost,
      actualCost: formData.actualCost,
      startDate: formData.startDate,
      dueDate: formData.dueDate,
      completedDate: formData.completedDate,
      assignedTo: formData.assignedTo,
      dependencies: formData.dependencies,
      tags: formData.tags,
      blockers: task?.blockers,
    })
    clearDraft()
    onClose()
  }

  const addTag = () => {
    const tag = formData.tagInput.trim()
    if (tag && !formData.tags.includes(tag)) {
      update({ tags: [...formData.tags, tag], tagInput: '' })
    }
  }

  const removeTag = (tag: string) => {
    update({ tags: formData.tags.filter((t: string) => t !== tag) })
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99998]"
        onClick={onClose}
      />

      {/* Modal — bottom sheet on mobile, centered on desktop */}
      <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center sm:p-6">
        <div
          className="bg-white dark:bg-[#1c1c1e] rounded-t-3xl sm:rounded-xl shadow-2xl w-full sm:max-w-2xl max-h-[92dvh] flex flex-col overflow-hidden pb-[env(safe-area-inset-bottom)]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1 sm:hidden shrink-0">
            <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-8 py-5 border-b border-gray-200 dark:border-[#2c2c2e] shrink-0">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white tracking-[-0.03em]">
                {task ? 'Edit Task' : 'New Task'}
              </h2>
              {!task && hasDraft && (
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[10px] text-amber-600 dark:text-amber-400">Draft restored</span>
                  <button
                    type="button"
                    onClick={clearDraft}
                    className="text-[10px] text-gray-400 hover:text-gray-600 flex items-center gap-0.5"
                  >
                    <RotateCcw className="w-2.5 h-2.5" /> Clear
                  </button>
                </div>
              )}
            </div>
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
                  onChange={(e) => update({ title: e.target.value })}
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
                  onChange={(e) => update({ description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2.5 bg-white dark:bg-[#000000] border border-gray-300 dark:border-[#2c2c2e] rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white resize-none"
                  placeholder="Detailed description of the task..."
                />
              </div>

              {/* Status & Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => update({ status: e.target.value as TaskStatus })}
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => update({ priority: e.target.value as TaskPriority })}
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
                    onChange={(e) => update({ estimatedHours: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2.5 bg-white dark:bg-[#000000] border border-gray-300 dark:border-[#2c2c2e] rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => update({ startDate: e.target.value })}
                    className="w-full px-3 py-2.5 bg-white dark:bg-[#000000] border border-gray-300 dark:border-[#2c2c2e] rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Due Date</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => update({ dueDate: e.target.value })}
                    className="w-full px-3 py-2.5 bg-white dark:bg-[#000000] border border-gray-300 dark:border-[#2c2c2e] rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
                  />
                </div>
              </div>

              {/* Costs */}
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
                    onChange={(e) => update({ estimatedCost: parseFloat(e.target.value) || 0 })}
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
                    onChange={(e) => update({ actualCost: parseFloat(e.target.value) || 0 })}
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
                  onChange={(e) => update({ actualHours: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2.5 bg-white dark:bg-[#000000] border border-gray-300 dark:border-[#2c2c2e] rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
                />
              </div>

              {/* Completed Date */}
              {formData.status === 'done' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Completed Date
                  </label>
                  <input
                    type="date"
                    value={formData.completedDate}
                    onChange={(e) => update({ completedDate: e.target.value })}
                    className="w-full px-3 py-2.5 bg-white dark:bg-[#000000] border border-gray-300 dark:border-[#2c2c2e] rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
                  />
                </div>
              )}

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tags</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={formData.tagInput}
                    onChange={(e) => update({ tagInput: e.target.value })}
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
                    {formData.tags.map((tag: string) => (
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
          <div className="flex items-center justify-end gap-3 px-8 py-5 border-t border-gray-200 dark:border-[#2c2c2e] shrink-0">
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
