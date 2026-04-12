'use client'

import { useState, useCallback } from 'react'
import { ProjectPhase, Task, Milestone, DEFAULT_PHASES } from '@/types/project-types-enhanced'

interface UseProjectManagerReturn {
  phases: ProjectPhase[]
  initializePhases: (projectType: string) => void
  setCustomPhases: (customPhases: ProjectPhase[]) => void
  addPhase: (phase: Omit<ProjectPhase, 'id' | 'tasks' | 'milestones'>) => void
  updatePhase: (phaseId: string, updates: Partial<ProjectPhase>) => void
  deletePhase: (phaseId: string) => void
  
  addTask: (phaseId: string, task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateTask: (phaseId: string, taskId: string, updates: Partial<Task>) => void
  deleteTask: (phaseId: string, taskId: string) => void
  moveTask: (taskId: string, fromPhaseId: string, toPhaseId: string) => void
  
  addMilestone: (phaseId: string, milestone: Omit<Milestone, 'id'>) => void
  updateMilestone: (phaseId: string, milestoneId: string, updates: Partial<Milestone>) => void
  deleteMilestone: (phaseId: string, milestoneId: string) => void
  
  getPhaseProgress: (phaseId: string) => number
  getOverallProgress: () => number
}

const STORAGE_KEY = 'projex-project-phases'

export function useProjectManager(projectId: string): UseProjectManagerReturn {
  const storageKey = projectId ? `${STORAGE_KEY}-${projectId}` : STORAGE_KEY
  
  const [phases, setPhases] = useState<ProjectPhase[]>(() => {
    if (!projectId) return []
    
    // Load from localStorage for this specific project
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {
      }
    }
    return []
  })

  // Save to localStorage whenever phases change
  const savePhases = useCallback((newPhases: ProjectPhase[]) => {
    if (!projectId) return
    setPhases(newPhases)
    localStorage.setItem(storageKey, JSON.stringify(newPhases))
  }, [projectId, storageKey])

  // Initialize phases based on project type
  const initializePhases = useCallback((projectType: string) => {
    const defaultPhases = DEFAULT_PHASES[projectType as keyof typeof DEFAULT_PHASES] || DEFAULT_PHASES['residential-new']
    
    const newPhases: ProjectPhase[] = defaultPhases.map((phase, index) => ({
      ...phase,
      id: `phase-${Date.now()}-${index}`,
      tasks: [],
      milestones: [],
    }))
    
    savePhases(newPhases)
  }, [savePhases])

  // Set custom phases (from initialization modal)
  const setCustomPhases = useCallback((customPhases: ProjectPhase[]) => {
    savePhases(customPhases)
  }, [savePhases])

  // Phase operations
  const addPhase = useCallback((phase: Omit<ProjectPhase, 'id' | 'tasks' | 'milestones'>) => {
    const newPhase: ProjectPhase = {
      ...phase,
      id: `phase-${Date.now()}`,
      tasks: [],
      milestones: [],
    }
    savePhases([...phases, newPhase])
  }, [phases, savePhases])

  const updatePhase = useCallback((phaseId: string, updates: Partial<ProjectPhase>) => {
    const newPhases = phases.map(phase =>
      phase.id === phaseId
        ? { ...phase, ...updates }
        : phase
    )
    savePhases(newPhases)
  }, [phases, savePhases])

  const deletePhase = useCallback((phaseId: string) => {
    savePhases(phases.filter(phase => phase.id !== phaseId))
  }, [phases, savePhases])

  // Task operations
  const addTask = useCallback((phaseId: string, task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString()
    const newTask: Task = {
      ...task,
      id: `task-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    }

    const newPhases = phases.map(phase =>
      phase.id === phaseId
        ? { ...phase, tasks: [...phase.tasks, newTask] }
        : phase
    )
    savePhases(newPhases)
  }, [phases, savePhases])

  const updateTask = useCallback((phaseId: string, taskId: string, updates: Partial<Task>) => {
    const newPhases = phases.map(phase =>
      phase.id === phaseId
        ? {
            ...phase,
            tasks: phase.tasks.map(task =>
              task.id === taskId
                ? { ...task, ...updates, updatedAt: new Date().toISOString() }
                : task
            ),
          }
        : phase
    )
    savePhases(newPhases)
  }, [phases, savePhases])

  const deleteTask = useCallback((phaseId: string, taskId: string) => {
    const newPhases = phases.map(phase =>
      phase.id === phaseId
        ? { ...phase, tasks: phase.tasks.filter(task => task.id !== taskId) }
        : phase
    )
    savePhases(newPhases)
  }, [phases, savePhases])

  const moveTask = useCallback((taskId: string, fromPhaseId: string, toPhaseId: string) => {
    let taskToMove: Task | null = null
    
    // Find and remove task from source phase
    const newPhases = phases.map(phase => {
      if (phase.id === fromPhaseId) {
        const task = phase.tasks.find(t => t.id === taskId)
        if (task) {
          taskToMove = task
          return { ...phase, tasks: phase.tasks.filter(t => t.id !== taskId) }
        }
      }
      return phase
    })

    // Add task to destination phase
    if (taskToMove) {
      const finalPhases = newPhases.map(phase =>
        phase.id === toPhaseId
          ? { ...phase, tasks: [...phase.tasks, taskToMove!] }
          : phase
      )
      savePhases(finalPhases)
    }
  }, [phases, savePhases])

  // Milestone operations
  const addMilestone = useCallback((phaseId: string, milestone: Omit<Milestone, 'id'>) => {
    const newMilestone: Milestone = {
      ...milestone,
      id: `milestone-${Date.now()}`,
    }

    const newPhases = phases.map(phase =>
      phase.id === phaseId
        ? { ...phase, milestones: [...phase.milestones, newMilestone] }
        : phase
    )
    savePhases(newPhases)
  }, [phases, savePhases])

  const updateMilestone = useCallback((phaseId: string, milestoneId: string, updates: Partial<Milestone>) => {
    const newPhases = phases.map(phase =>
      phase.id === phaseId
        ? {
            ...phase,
            milestones: phase.milestones.map(milestone =>
              milestone.id === milestoneId
                ? { ...milestone, ...updates }
                : milestone
            ),
          }
        : phase
    )
    savePhases(newPhases)
  }, [phases, savePhases])

  const deleteMilestone = useCallback((phaseId: string, milestoneId: string) => {
    const newPhases = phases.map(phase =>
      phase.id === phaseId
        ? { ...phase, milestones: phase.milestones.filter(m => m.id !== milestoneId) }
        : phase
    )
    savePhases(newPhases)
  }, [phases, savePhases])

  // Progress calculations
  const getPhaseProgress = useCallback((phaseId: string) => {
    const phase = phases.find(p => p.id === phaseId)
    if (!phase || phase.tasks.length === 0) return 0
    
    const completed = phase.tasks.filter(t => t.status === 'done').length
    return Math.round((completed / phase.tasks.length) * 100)
  }, [phases])

  const getOverallProgress = useCallback(() => {
    if (phases.length === 0) return 0
    
    const totalTasks = phases.reduce((sum, phase) => sum + phase.tasks.length, 0)
    if (totalTasks === 0) return 0
    
    const completedTasks = phases.reduce(
      (sum, phase) => sum + phase.tasks.filter(t => t.status === 'done').length,
      0
    )
    
    return Math.round((completedTasks / totalTasks) * 100)
  }, [phases])

  return {
    phases,
    initializePhases,
    setCustomPhases,
    addPhase,
    updatePhase,
    deletePhase,
    addTask,
    updateTask,
    deleteTask,
    moveTask,
    addMilestone,
    updateMilestone,
    deleteMilestone,
    getPhaseProgress,
    getOverallProgress,
  }
}
