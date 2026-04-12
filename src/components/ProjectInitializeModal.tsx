'use client'

import { useState } from 'react'
import { ProjectPhase, DEFAULT_PHASES, Task } from '@/types/project-types-enhanced'

interface ProjectInitializeModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  projectName: string
  projectType: string
  existingPhases?: ProjectPhase[] // NEW - for edit mode
  onInitialize: (projectId: string, customPhases: ProjectPhase[]) => void
}

export default function ProjectInitializeModal({
  isOpen,
  onClose,
  projectId,
  projectName,
  projectType,
  existingPhases,
  onInitialize,
}: ProjectInitializeModalProps) {
  // Get default phases or use existing
  const defaultPhases = existingPhases || 
    (DEFAULT_PHASES[projectType as keyof typeof DEFAULT_PHASES] || DEFAULT_PHASES['residential-new'])
  
  const [phases, setPhases] = useState<Omit<ProjectPhase, 'id' | 'tasks' | 'milestones'>[]>(
    defaultPhases.map(phase => ({
      name: phase.name,
      order: phase.order,
      status: phase.status,
      plannedDuration: phase.plannedDuration,
      startDate: phase.startDate,
      endDate: phase.endDate,
      actualDuration: phase.actualDuration,
    }))
  )
  
  // Load existing tasks if in edit mode
  const [phaseTasks, setPhaseTasks] = useState<Record<number, string[]>>(() => {
    if (existingPhases) {
      const taskMap: Record<number, string[]> = {}
      existingPhases.forEach((phase, index) => {
        taskMap[index] = phase.tasks.map(t => t.title)
      })
      return taskMap
    }
    return {}
  })

  // Update title based on mode
  const isEditMode = !!existingPhases

  // ... rest of component
  
  const [selectedPhaseIndex, setSelectedPhaseIndex] = useState<number | null>(null)
  const [taskInput, setTaskInput] = useState('')

  const addTaskToPhase = (phaseIndex: number) => {
    if (!taskInput.trim()) return
    
    setPhaseTasks(prev => ({
      ...prev,
      [phaseIndex]: [...(prev[phaseIndex] || []), taskInput.trim()]
    }))
    setTaskInput('')
  }

  const removeTaskFromPhase = (phaseIndex: number, taskIndex: number) => {
    setPhaseTasks(prev => ({
      ...prev,
      [phaseIndex]: prev[phaseIndex].filter((_, i) => i !== taskIndex)
    }))
  }

  const updatePhaseDuration = (index: number, duration: number) => {
    setPhases(prev => prev.map((phase, i) => 
      i === index ? { ...phase, plannedDuration: duration } : phase
    ))
  }

  const addPhase = () => {
    setPhases(prev => [...prev, {
      name: `Custom Phase ${prev.length + 1}`,
      order: prev.length + 1,
      status: 'not-started' as const,
      plannedDuration: 7,
    }])
  }

  const removePhase = (index: number) => {
    setPhases(prev => prev.filter((_, i) => i !== index).map((phase, i) => ({
      ...phase,
      order: i + 1
    })))
    const newTasks = { ...phaseTasks }
    delete newTasks[index]
    setPhaseTasks(newTasks)
  }

  const updatePhaseName = (index: number, name: string) => {
    setPhases(prev => prev.map((phase, i) => 
      i === index ? { ...phase, name } : phase
    ))
  }

  const handleInitialize = () => {
    // Convert to full ProjectPhase objects with tasks
    const fullPhases: ProjectPhase[] = phases.map((phase, index) => {
      const tasksForPhase = phaseTasks[index] || []
      
      const tasks: Task[] = tasksForPhase.map((taskTitle, taskIndex) => ({
        id: `task-${Date.now()}-${index}-${taskIndex}`,
        title: taskTitle,
        status: 'todo' as const,
        priority: 'medium' as const,
        estimatedHours: 8,
        dependencies: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }))

      return {
        id: `phase-${Date.now()}-${index}`,
        ...phase,
        tasks,
        milestones: [],
      }
    })

    onInitialize(projectId, fullPhases)
    onClose()
  }

  if (!isOpen) return null

  const totalDays = phases.reduce((sum, phase) => sum + phase.plannedDuration, 0)
  const totalTasks = Object.values(phaseTasks).reduce((sum, tasks) => sum + tasks.length, 0)

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
          className="bg-white dark:bg-[#1c1c1e] rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-8 py-5 border-b border-gray-200 dark:border-[#2c2c2e]">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
  {isEditMode ? 'Edit Project Management' : 'Initialize Project Management'}
</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {projectName}
              </p>
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
          <div className="flex-1 flex overflow-hidden">
            {/* Phases List */}
            <div className="w-1/2 border-r border-gray-200 dark:border-[#2c2c2e] overflow-y-auto p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Project Phases ({phases.length})
                </h3>
                <button
                  onClick={addPhase}
                  className="px-3 py-1.5 text-sm bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                >
                  Add Phase
                </button>
              </div>

              <div className="space-y-3">
                {phases.map((phase, index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedPhaseIndex(index)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedPhaseIndex === index
                        ? 'border-gray-900 dark:border-white bg-gray-50 dark:bg-[#2a2a2a]'
                        : 'border-gray-200 dark:border-[#2c2c2e] hover:border-gray-300 dark:hover:border-[#3c3c3e]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <input
                          type="text"
                          value={phase.name}
                          onChange={(e) => updatePhaseName(index, e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full px-2 py-1 text-sm font-medium bg-transparent border-0 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white rounded text-gray-900 dark:text-white"
                        />
                        <div className="flex items-center gap-3 mt-2">
                          <input
                            type="number"
                            min="1"
                            value={phase.plannedDuration}
                            onChange={(e) => updatePhaseDuration(index, parseInt(e.target.value) || 1)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-16 px-2 py-1 text-xs bg-white dark:bg-[#000000] border border-gray-300 dark:border-[#2c2c2e] rounded text-gray-900 dark:text-white"
                          />
                          <span className="text-xs text-gray-500 dark:text-gray-400">days</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {phaseTasks[index]?.length || 0} tasks
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          removePhase(index)
                        }}
                        className="flex-shrink-0 p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tasks for Selected Phase */}
            <div className="w-1/2 overflow-y-auto p-6">
              {selectedPhaseIndex !== null ? (
                <>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Tasks for {phases[selectedPhaseIndex].name}
                  </h3>

                  {/* Add Task Input */}
                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      value={taskInput}
                      onChange={(e) => setTaskInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addTaskToPhase(selectedPhaseIndex)}
                      placeholder="Add task... (press Enter)"
                      className="flex-1 px-3 py-2 bg-white dark:bg-[#000000] border border-gray-300 dark:border-[#2c2c2e] rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
                    />
                    <button
                      onClick={() => addTaskToPhase(selectedPhaseIndex)}
                      className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                    >
                      Add
                    </button>
                  </div>

                  {/* Tasks List */}
                  <div className="space-y-2">
                    {(phaseTasks[selectedPhaseIndex] || []).length === 0 ? (
                      <div className="text-center py-12 text-sm text-gray-400 dark:text-gray-500">
                        No tasks yet. Add tasks that need to be completed in this phase.
                      </div>
                    ) : (
                      (phaseTasks[selectedPhaseIndex] || []).map((task, taskIndex) => (
                        <div
                          key={taskIndex}
                          className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-[#2a2a2a] rounded-lg"
                        >
                          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          <span className="flex-1 text-sm text-gray-900 dark:text-white">
                            {task}
                          </span>
                          <button
                            onClick={() => removeTaskFromPhase(selectedPhaseIndex, taskIndex)}
                            className="flex-shrink-0 p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-[#2c2c2e] flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400">
                    Select a phase to add tasks
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 py-5 border-t border-gray-200 dark:border-[#2c2c2e] bg-gray-50 dark:bg-[#000000]">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium text-gray-900 dark:text-white">{phases.length}</span> phases • 
                <span className="font-medium text-gray-900 dark:text-white ml-1">{totalTasks}</span> tasks • 
                <span className="font-medium text-gray-900 dark:text-white ml-1">{totalDays}</span> days total
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 border border-gray-300 dark:border-[#2c2c2e] text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2c2c2e] transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
  onClick={handleInitialize}
  className="px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors font-medium"
>
  {isEditMode ? 'Save Changes' : 'Initialize Project'}
</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
