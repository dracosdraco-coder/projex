'use client'

import { useState, useEffect, useRef } from 'react'
import { ProjectPhase, Task, Milestone } from '@/types/project-types-enhanced'
import { Project } from '@/types'
import TaskModal from '@/components/TaskModal'

interface TimelineViewProps {
  allProjects: Project[]
  getProjectPhases: (projectId: string) => ProjectPhase[]
  selectedProjectId: string
  onProjectSelect: (projectId: string) => void
  onPhaseUpdate?: (projectId: string, phaseId: string, updates: Partial<ProjectPhase>) => void
  onTaskUpdate?: (projectId: string, phaseId: string, taskId: string, updates: Partial<Task>) => void
}

type ZoomLevel = 'month' | 'week' | 'day'

export default function TimelineView({
  allProjects,
  getProjectPhases,
  selectedProjectId,
  onProjectSelect,
  onPhaseUpdate,
  onTaskUpdate,
}: TimelineViewProps) {
  const [viewMode, setViewMode] = useState<'phases' | 'tasks'>('phases')
  const [zoom, setZoom] = useState<ZoomLevel>('week')
  const [zoomScale, setZoomScale] = useState(1) // For drag zoom: 0.5 to 3
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set())
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set())
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartY, setDragStartY] = useState(0)
  const [dragStartScale, setDragStartScale] = useState(1)
  
  const timelineRef = useRef<HTMLDivElement>(null)

const [editingPhase, setEditingPhase] = useState<ProjectPhase | null>(null)
const [editingTask, setEditingTask] = useState<{ projectId: string; phaseId: string; task: Task } | null>(null)
const [showPhaseModal, setShowPhaseModal] = useState(false)
const [showTaskModal, setShowTaskModal] = useState(false)
  // Calculate timeline dimensions
  const startDate = new Date()
  const endDate = new Date(startDate.getTime() + 180 * 24 * 60 * 60 * 1000) // 6 months
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  
  const getPixelsPerDay = () => {
    const base = zoom === 'month' ? 1 : zoom === 'week' ? 4 : 20
    return base * zoomScale
  }

  const pixelsPerDay = getPixelsPerDay()

  // Generate date markers based on zoom
  const dateMarkers: Date[] = []
  const current = new Date(startDate)
  const interval = zoom === 'month' ? 30 : zoom === 'week' ? 7 : 1
  
  while (current <= endDate) {
    dateMarkers.push(new Date(current))
    current.setDate(current.getDate() + interval)
  }

  const getPositionFromDate = (date: string) => {
    const targetDate = new Date(date)
    const daysDiff = Math.ceil((targetDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    return Math.max(0, daysDiff * pixelsPerDay)
  }

  const getDurationWidth = (duration: number) => {
    return duration * pixelsPerDay
  }

  const getPhaseStatus = (phase: ProjectPhase) => {
    if (phase.status === 'completed') return 'bg-green-500 dark:bg-green-600'
    if (phase.status === 'in-progress') return 'bg-blue-500 dark:bg-blue-600'
    return 'bg-gray-300 dark:bg-[#333]'
  }

  const getTaskStatus = (task: Task) => {
    if (task.status === 'done') return 'bg-green-500 dark:bg-green-600'
    if (task.status === 'in-progress') return 'bg-blue-500 dark:bg-blue-600'
    if (task.status === 'blocked') return 'bg-red-500 dark:bg-red-600'
    return 'bg-gray-300 dark:bg-[#333]'
  }

  const formatDate = (date: Date) => {
    if (zoom === 'month') {
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    } else if (zoom === 'week') {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const toggleProject = (projectId: string) => {
    const newExpanded = new Set(expandedProjects)
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId)
    } else {
      newExpanded.add(projectId)
    }
    setExpandedProjects(newExpanded)
  }

  const togglePhase = (phaseId: string) => {
    const newExpanded = new Set(expandedPhases)
    if (newExpanded.has(phaseId)) {
      newExpanded.delete(phaseId)
    } else {
      newExpanded.add(phaseId)
    }
    setExpandedPhases(newExpanded)
  }

  // Drag to zoom
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && e.altKey) { // Alt + Left click to zoom
      setIsDragging(true)
      setDragStartY(e.clientY)
      setDragStartScale(zoomScale)
      e.preventDefault()
    }
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const deltaY = dragStartY - e.clientY
      const scaleDelta = deltaY / 100
      const newScale = Math.max(0.5, Math.min(3, dragStartScale + scaleDelta))
      setZoomScale(newScale)
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, dragStartY, dragStartScale])

  // Filter projects
  const displayProjects = selectedProjectId 
    ? allProjects.filter(p => p.id === selectedProjectId)
    : allProjects

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#1a1a1a]">
      {/* Controls */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-[#2c2c2e]">
        <div className="flex items-center gap-4">
          {/* Project Filter */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Project:
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => onProjectSelect(e.target.value)}
              className="px-3 py-1.5 text-sm bg-white dark:bg-[#1c1c1e] border border-gray-300 dark:border-[#2c2c2e] rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
            >
              <option value="">All Projects</option>
              {allProjects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          {/* View Mode */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('phases')}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                viewMode === 'phases'
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2c2c2e]'
              }`}
            >
              Phases
            </button>
            <button
              onClick={() => setViewMode('tasks')}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                viewMode === 'tasks'
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2c2c2e]'
              }`}
            >
              Tasks
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Zoom Controls */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">Zoom:</span>
            <button
              onClick={() => setZoom('month')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                zoom === 'month'
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2c2c2e]'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setZoom('week')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                zoom === 'week'
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2c2c2e]'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setZoom('day')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                zoom === 'day'
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2c2c2e]'
              }`}
            >
              Day
            </button>
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400">
            Scale: {Math.round(zoomScale * 100)}% (Alt+Drag to zoom)
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div 
        className="flex-1 overflow-auto" 
        ref={timelineRef}
        onMouseDown={handleMouseDown}
        style={{ cursor: isDragging ? 'ns-resize' : 'default' }}
      >
        <div className="min-w-max">
          {/* Date Header */}
          <div className="sticky top-0 z-10 bg-gray-50 dark:bg-[#000000] border-b border-gray-200 dark:border-[#2c2c2e]">
            <div className="flex">
              <div className="w-48 md:w-80 flex-shrink-0 px-4 py-3 border-r border-gray-200 dark:border-[#2c2c2e]">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {viewMode === 'phases' ? 'Projects / Phases' : 'All Tasks'}
                </span>
              </div>
              <div className="flex-1 px-4 py-3">
                <div className="flex gap-0.5">
                  {dateMarkers.map((date, i) => {
                    const width = zoom === 'month' ? 30 * pixelsPerDay : zoom === 'week' ? 7 * pixelsPerDay : pixelsPerDay
                    return (
                      <div
                        key={i}
                        className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap"
                        style={{ width: `${width}px`, minWidth: `${width}px` }}
                      >
                        {formatDate(date)}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          {viewMode === 'phases' && (
            <div>
              {displayProjects.map(project => {
                const phases = getProjectPhases(project.id)
                const isExpanded = expandedProjects.has(project.id)

                return (
                  <div key={project.id}>
                    {/* Project Row */}
                    <div className="flex border-b border-gray-100 dark:border-[#2c2c2e] hover:bg-gray-50 dark:hover:bg-[#1c1c1e]">
                      <div className="w-48 md:w-80 flex-shrink-0 px-4 py-3 border-r border-gray-200 dark:border-[#2c2c2e]">
                        <button
                          onClick={() => toggleProject(project.id)}
                          className="flex items-center gap-2 w-full text-left"
                        >
                          <svg
                            className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {project.name}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            ({phases.length} phases)
                          </span>
                        </button>
                      </div>
                      <div className="flex-1 px-4 py-3" />
                    </div>

                    {/* Phases (when expanded) */}
                    {isExpanded && phases.map((phase, phaseIndex) => {
                      const isPhaseExpanded = expandedPhases.has(phase.id)

                      return (
                        <div key={phase.id}>
                          {/* Phase Row */}
                          <div className="flex border-b border-gray-100 dark:border-[#2c2c2e] hover:bg-gray-50 dark:hover:bg-[#1c1c1e] bg-gray-50 dark:bg-[#0a0a0a]">
                            <div className="w-48 md:w-80 flex-shrink-0 px-4 py-3 border-r border-gray-200 dark:border-[#2c2c2e]">
                              <div className="flex items-center gap-2 pl-6">
                                <button
                                  onClick={() => togglePhase(phase.id)}
                                  className="text-gray-400 hover:text-gray-600"
                                >
                                  <svg
                                    className={`w-3 h-3 transition-transform ${isPhaseExpanded ? 'rotate-90' : ''}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </button>
                                <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-[#2c2c2e] flex items-center justify-center text-xs font-medium">
                                  {phaseIndex + 1}
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {phase.name}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {phase.tasks.length} tasks • {phase.plannedDuration} days
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="flex-1 relative px-4 py-3">
                              {/* Phase bar */}
                              {/* Phase bar - MAKE CLICKABLE */}
{phase.startDate && (
  <div
    className={`absolute h-6 rounded ${getPhaseStatus(phase)} cursor-pointer hover:opacity-80 transition-opacity`}
    style={{
      left: `${getPositionFromDate(phase.startDate)}px`,
      width: `${getDurationWidth(phase.plannedDuration)}px`,
      top: '8px',
    }}
    onClick={() => {
      setEditingPhase(phase)
      setShowPhaseModal(true)
    }}
    title={`Click to edit ${phase.name}`}
  >
    <div className="px-2 py-0.5 text-xs font-medium text-white truncate">
      {phase.status}
    </div>
  </div>
)}
                            </div>
                          </div>

                          {/* Tasks (when phase expanded) */}
                          {isPhaseExpanded && phase.tasks.map(task => (
                            <div key={task.id} className="flex border-b border-gray-100 dark:border-[#2c2c2e] bg-gray-100 dark:bg-[#000000]">
                              <div className="w-48 md:w-80 flex-shrink-0 px-4 py-2 border-r border-gray-200 dark:border-[#2c2c2e]">
                                <div className="pl-16">
                                  <p className="text-sm text-gray-900 dark:text-white">{task.title}</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {task.estimatedHours}h • {task.priority}
                                  </p>
                                </div>
                              </div>
                              <div className="flex-1 relative px-4 py-2">
                                {/* Task bar - MAKE CLICKABLE */}
{task.startDate && task.dueDate && (
  <div
    className={`absolute h-4 rounded ${getTaskStatus(task)} cursor-pointer hover:opacity-80 transition-opacity`}
    style={{
      left: `${getPositionFromDate(task.startDate)}px`,
      width: `${getPositionFromDate(task.dueDate) - getPositionFromDate(task.startDate)}px`,
      top: '6px',
    }}
// CORRECT - use proper variable name
onClick={() => {
  const currentProject = displayProjects.find(p => 
    getProjectPhases(p.id).some(ph => ph.id === phase.id)
  )
  if (currentProject) {
    setEditingTask({ projectId: currentProject.id, phaseId: phase.id, task })
    setShowTaskModal(true)
  }
}}
    title={`Click to edit ${task.title}`}
  />
)}
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 px-4 py-3 border-t border-gray-200 dark:border-[#2c2c2e] text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gray-300 dark:bg-[#333] rounded" />
          <span className="text-gray-600 dark:text-gray-400">Not Started</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 dark:bg-blue-600 rounded" />
          <span className="text-gray-600 dark:text-gray-400">In Progress</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 dark:bg-green-600 rounded" />
          <span className="text-gray-600 dark:text-gray-400">Completed</span>
        </div>
      </div>
      {/* Task Edit Modal */}
{showTaskModal && editingTask && (
  <TaskModal
    isOpen={showTaskModal}
    onClose={() => {
      setShowTaskModal(false)
      setEditingTask(null)
    }}
    onSave={(taskData) => {
      onTaskUpdate?.(
        editingTask.projectId,
        editingTask.phaseId,
        editingTask.task.id,
        taskData
      )
      setShowTaskModal(false)
      setEditingTask(null)
    }}
    task={editingTask.task}
    phases={getProjectPhases(editingTask.projectId)}
    currentPhaseId={editingTask.phaseId}
  />
)}
    </div>
  )
}
