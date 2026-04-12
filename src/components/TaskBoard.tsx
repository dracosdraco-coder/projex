'use client'

import { useEffect, useState } from 'react'
import { Task, TaskStatus, ProjectPhase } from '@/types/project-types-enhanced'
import TaskModal from '@/components/TaskModal'

interface TaskBoardProps {
  allProjects: any[] // Project[]
  getProjectPhases: (projectId: string) => ProjectPhase[]
  selectedProjectId: string
  onProjectSelect: (projectId: string) => void
  onTaskUpdate?: (projectId: string, phaseId: string, taskId: string, updates: Partial<Task>) => void
  onTaskCreate?: (projectId: string, phaseId: string, task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void
}

export default function TaskBoard({
  allProjects,
  getProjectPhases,
  selectedProjectId,
  onProjectSelect,
  onTaskUpdate,
  onTaskCreate,
}: TaskBoardProps) {
  const phases = selectedProjectId ? getProjectPhases(selectedProjectId) : []
  const [selectedPhase, setSelectedPhase] = useState<string>(phases[0]?.id || '')
  const [draggedTask, setDraggedTask] = useState<{ phaseId: string; task: Task } | null>(null)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  const columns: { status: TaskStatus; label: string; color: string }[] = [
    { status: 'todo', label: 'To Do', color: 'bg-gray-100 dark:bg-[#2c2c2e]' },
    { status: 'in-progress', label: 'In Progress', color: 'bg-blue-50 dark:bg-blue-900/10' },
    { status: 'review', label: 'Review', color: 'bg-yellow-50 dark:bg-yellow-900/10' },
    { status: 'blocked', label: 'Blocked', color: 'bg-red-50 dark:bg-red-900/10' },
    { status: 'done', label: 'Done', color: 'bg-green-50 dark:bg-green-900/10' },
  ]

  const currentPhase = phases.find(p => p.id === selectedPhase)
  const allTasks = currentPhase?.tasks || []

  const getTasksByStatus = (status: TaskStatus) => {
    return allTasks.filter(task => task.status === status)
  }

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'critical': return 'text-red-600 dark:text-red-400'
      case 'high': return 'text-orange-600 dark:text-orange-400'
      case 'medium': return 'text-yellow-600 dark:text-yellow-400'
      case 'low': return 'text-green-600 dark:text-green-400'
    }
  }

  const handleDragStart = (phaseId: string, task: Task) => {
    setDraggedTask({ phaseId, task })
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (newStatus: TaskStatus) => {
    if (draggedTask && draggedTask.task.status !== newStatus && selectedProjectId) {
      onTaskUpdate?.(selectedProjectId, draggedTask.phaseId, draggedTask.task.id, { status: newStatus })
    }
    setDraggedTask(null)
  }

  // Prevent default to allow drop
  const handleDragEnd = () => {
    setDraggedTask(null)
  }
useEffect(() => {
  // Keep selected project in sync
  if (selectedProjectId && phases.length > 0 && !selectedPhase) {
    setSelectedPhase(phases[0]?.id || '')
  }
}, [selectedProjectId, phases, selectedPhase])

// Reset phase when project changes
useEffect(() => {
  if (selectedProjectId) {
    const projectPhases = getProjectPhases(selectedProjectId)
    if (projectPhases.length > 0) {
      setSelectedPhase(projectPhases[0].id)
    }
  }
}, [selectedProjectId, getProjectPhases])


return (
    <div className="h-full flex flex-col bg-white dark:bg-[#1a1a1a]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-[#2c2c2e]">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Task Board</h2>
          <div className="flex items-center gap-3">
            {/* Project Selector */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Project:
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => onProjectSelect(e.target.value)}
                className="px-3 py-1.5 text-sm bg-white dark:bg-[#1c1c1e] border border-gray-300 dark:border-[#2c2c2e] rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
              >
                <option value="">Select Project</option>
                {allProjects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
            <button 
              onClick={() => setShowTaskModal(true)}
              disabled={!selectedProjectId}
              className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              New Task
            </button>
          </div>
        </div>

        {/* Phase Selector - Only show when project selected */}
        {selectedProjectId && phases.length > 0 && (
          <div className="flex gap-2 overflow-x-auto">
            {phases.map(phase => (
              <button
                key={phase.id}
                onClick={() => setSelectedPhase(phase.id)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                  selectedPhase === phase.id
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2c2c2e]'
                }`}
              >
                {phase.name}
                <span className="ml-2 text-xs opacity-75">({phase.tasks.length})</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Kanban Board - Conditional Rendering */}
      {!selectedProjectId ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-[#2c2c2e] flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Select a project to view tasks
            </p>
          </div>
        </div>
      ) : phases.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              This project hasn't been initialized yet.
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-2">
              Go to Projects and click "Initialize PM"
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto">
          <div className="flex gap-4 p-6 min-w-max h-full">
            {columns.map(column => {
              const tasks = getTasksByStatus(column.status)
              
              return (
                <div
                  key={column.status}
                  className="flex-shrink-0 w-80"
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(column.status)}
                >
                  {/* Column Header */}
                  <div className={`${column.color} rounded-t-xl px-4 py-3 border-b-2 border-gray-200 dark:border-[#3c3c3e]`}>
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                        {column.label}
                      </h3>
                      <span className="px-2 py-0.5 bg-white dark:bg-[#1c1c1e] text-gray-700 dark:text-gray-300 text-xs font-medium rounded-full">
                        {tasks.length}
                      </span>
                    </div>
                  </div>

                  {/* Tasks */}
                  <div className={`${column.color} rounded-b-xl p-2 space-y-2 min-h-[calc(100%-52px)]`}>
                    {tasks.length === 0 ? (
                      <div className="flex items-center justify-center py-12 text-sm text-gray-400 dark:text-gray-500">
                        No tasks
                      </div>
                    ) : (
                      tasks.map(task => (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={() => handleDragStart(selectedPhase, task)}
                          onDragEnd={handleDragEnd}
                          onClick={() => {
                            setEditingTask(task)
                            setShowTaskModal(true)
                          }}
                          className="bg-white dark:bg-[#1c1c1e] rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-move border border-gray-200 dark:border-[#2c2c2e]"
                        >
                          {/* Task Header */}
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white flex-1 pr-2">
                              {task.title}
                            </h4>
                            <span className={`text-xs font-medium ${getPriorityColor(task.priority)}`}>
                              {task.priority === 'critical' && '🔴'}
                              {task.priority === 'high' && '🟠'}
                              {task.priority === 'medium' && '🟡'}
                              {task.priority === 'low' && '🟢'}
                            </span>
                          </div>

                          {/* Description */}
                          {task.description && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                              {task.description}
                            </p>
                          )}

                          {/* Metadata */}
                          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-2">
                              {task.estimatedHours && (
                                <span className="flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  {task.estimatedHours}h
                                </span>
                              )}
                              {task.assignedTo && task.assignedTo.length > 0 && (
                                <span className="flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                  {task.assignedTo.length}
                                </span>
                              )}
                            </div>
                            {task.dueDate && (
                              <span className={
                                new Date(task.dueDate) < new Date()
                                  ? 'text-red-600 dark:text-red-400 font-medium'
                                  : ''
                              }>
                                {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            )}
                          </div>

                          {/* Tags */}
                          {task.tags && task.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {task.tags.map((tag, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 bg-gray-100 dark:bg-[#2c2c2e] text-gray-700 dark:text-gray-300 text-xs rounded"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Blockers */}
                          {task.status === 'blocked' && task.blockers && task.blockers.length > 0 && (
                            <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-400">
                              <span className="font-medium">Blocked:</span> {task.blockers.join(', ')}
                            </div>
                          )}

                          {/* Dependencies */}
                          {task.dependencies && task.dependencies.length > 0 && (
                            <div className="mt-2 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                              </svg>
                              {task.dependencies.length} dependencies
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Footer Stats */}
      <div className="px-6 py-4 border-t border-gray-200 dark:border-[#2c2c2e] bg-gray-50 dark:bg-[#000000]">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-6">
            <span className="text-gray-600 dark:text-gray-400">
              Total Tasks: <span className="font-medium text-gray-900 dark:text-white">{allTasks.length}</span>
            </span>
            <span className="text-gray-600 dark:text-gray-400">
              Completed: <span className="font-medium text-green-600 dark:text-green-400">
                {getTasksByStatus('done').length}
              </span>
            </span>
            <span className="text-gray-600 dark:text-gray-400">
              Blocked: <span className="font-medium text-red-600 dark:text-red-400">
                {getTasksByStatus('blocked').length}
              </span>
            </span>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Drag tasks to update status • Click tasks to edit
          </div>
        </div>
      </div>

      {/* Task Modal */}
      {showTaskModal && (
        <TaskModal
          isOpen={showTaskModal}
          onClose={() => {
            setShowTaskModal(false)
            setEditingTask(null)
          }}
          onSave={(taskData) => {
            if (editingTask) {
              onTaskUpdate?.(selectedProjectId, selectedPhase, editingTask.id, taskData)
            } else {
              onTaskCreate?.(selectedProjectId, selectedPhase, taskData)
            }
            setShowTaskModal(false)
            setEditingTask(null)
          }}
          task={editingTask || undefined}
          phases={phases}
          currentPhaseId={selectedPhase}
        />
      )}
    </div>
  )
}