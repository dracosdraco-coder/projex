'use client'

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { TeamMember } from '@/types'
import { Task, Phase } from '@/types/data'

export function useTasks(userId: string | undefined, orgId?: string | null) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [phases, setPhases] = useState<Phase[]>([])

  const loadTasks = useCallback(async (transformedProjects: any[], transformedTeamMembers: TeamMember[]) => {
    if (!userId) return { tasks: [], phases: [] }

    const { data: tasksData } = await supabase
      .from('tasks')
      .select(`*, task_comments (id, commenter_name, content, created_at)`)
      .eq(orgId ? 'org_id' : 'user_id', orgId || userId!)
      .order('created_at', { ascending: false })

    const transformedTasks: Task[] = (tasksData || []).map((t: any) => {
      const project = transformedProjects.find((p) => p.id === t.project_id)
      const assignedMember = transformedTeamMembers.find((m) => m.id === t.assigned_to)

      return {
        id: t.id,
        projectId: t.project_id,
        projectName: project?.name || 'Unknown Project',
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        assignedTo: t.assigned_to,
        assignedToName: assignedMember?.name,
        dueDate: t.due_date,
        completedAt: t.completed_at,
        comments: (t.task_comments || []).map((c: any) => ({
          id: c.id,
          commenterName: c.commenter_name,
          content: c.content,
          createdAt: c.created_at,
        })),
        createdAt: t.created_at,
        updatedAt: t.updated_at,
      }
    })

    setTasks(transformedTasks)

    // Load phases
    const { data: phasesData } = await supabase
      .from('phases')
      .select('*')
      .eq(orgId ? 'org_id' : 'user_id', orgId || userId!)
      .order('order', { ascending: true })

    const transformedPhases: Phase[] = (phasesData || []).map((p: any) => {
      const phaseTasks = (tasksData || [])
        .filter((t: any) => t.phase_id === p.id)
        .map((t: any) => {
          const assignedMember = transformedTeamMembers.find((m) => m.id === t.assigned_to)
          return {
            id: t.id,
            projectId: t.project_id,
            title: t.title,
            description: t.description,
            status: t.status,
            priority: t.priority,
            assignedTo: t.assigned_to,
            assignedToName: assignedMember?.name,
            dueDate: t.due_date,
            completedAt: t.completed_at,
            createdAt: t.created_at,
            updatedAt: t.updated_at,
            comments: [],
          }
        })

      const startDate = new Date(p.start_date)
      const endDate = new Date(p.end_date)
      const plannedDuration = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))

      return {
        id: p.id,
        userId: p.user_id,
        projectId: p.project_id,
        name: p.name,
        description: p.description,
        startDate: p.start_date,
        endDate: p.end_date,
        status: p.status,
        color: p.color,
        order: p.order,
        plannedDuration,
        milestones: [],
        tasks: phaseTasks,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      }
    })

    setPhases(transformedPhases)
    return { tasks: transformedTasks, phases: transformedPhases }
  }, [userId])

  const createTask = useCallback(async (data: {
    projectId: string; phaseId?: string | null; title: string
    description?: string; status?: string; priority?: string
    assignedTo?: string; dueDate?: string
  }, refetch: () => Promise<void>) => {
    if (!userId) throw new Error('Not authenticated')

    const { data: newTask, error } = await supabase
      .from('tasks')
      .insert([{
        user_id: userId, org_id: orgId || undefined,
        project_id: data.projectId,
        phase_id: data.phaseId || null,
        title: data.title,
        description: data.description,
        status: data.status || 'todo',
        priority: data.priority || 'medium',
        assigned_to: data.assignedTo,
        due_date: data.dueDate,
      }])
      .select()
      .single()

    if (error) throw error
    await refetch()
    return newTask
  }, [userId])

  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    if (!userId) throw new Error('Not authenticated')

    const currentTask = tasks.find(t => t.id === id)

    const dbUpdates: any = {}
    if (updates.title !== undefined) dbUpdates.title = updates.title
    if (updates.description !== undefined) dbUpdates.description = updates.description
    if (updates.status !== undefined) dbUpdates.status = updates.status
    if (updates.priority !== undefined) dbUpdates.priority = updates.priority
    if (updates.assignedTo !== undefined) dbUpdates.assigned_to = updates.assignedTo
    if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate || null
    if (updates.completedAt !== undefined) dbUpdates.completed_at = updates.completedAt

    const { error } = await supabase.from('tasks').update(dbUpdates).eq('id', id)
    if (error) throw error

    if (updates.status && currentTask && updates.status !== currentTask.status) {
      await supabase.from('messages').insert([{
        user_id: userId, org_id: orgId || undefined,
        project_id: 'self-chat',
        sender_name: 'System',
        content: `📋 Task "${currentTask.title}" in ${currentTask.projectName || 'Unknown Project'} changed from ${currentTask.status} to ${updates.status}`,
      }])
    }

    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))
  }, [userId, tasks])

  const deleteTask = useCallback(async (id: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (error) throw error
    setTasks(prev => prev.filter(t => t.id !== id))
  }, [])

  const addTaskComment = useCallback(async (taskId: string, content: string, refetch: () => Promise<void>) => {
    if (!userId) throw new Error('Not authenticated')

    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase
      .from('task_comments')
      .insert([{ task_id: taskId, commenter_name: user?.email || 'Unknown User', content }])

    if (error) throw error
    await refetch()
  }, [userId])

  const updateTaskPhase = useCallback(async (taskId: string, phaseId: string | null, refetch: () => Promise<void>) => {
    if (!userId) throw new Error('Not authenticated')
    const { error } = await supabase.from('tasks').update({ phase_id: phaseId }).eq('id', taskId)
    if (error) throw error
    await refetch()
  }, [userId])

  // ==================== PHASES ====================

  const createPhase = useCallback(async (data: {
    projectId: string; name: string; description?: string
    startDate: string; endDate: string; color?: string; order?: number
  }, refetch: () => Promise<void>) => {
    if (!userId) throw new Error('Not authenticated')

    const { data: newPhase, error } = await supabase
      .from('phases')
      .insert([{
        user_id: userId, org_id: orgId || undefined,
        project_id: data.projectId,
        name: data.name,
        description: data.description,
        start_date: data.startDate,
        end_date: data.endDate,
        color: data.color || '#3B82F6',
        order: data.order ?? phases.length,
        status: 'not-started',
      }])
      .select()
      .single()

    if (error) throw error
    await refetch()
    return newPhase
  }, [userId, phases.length])

  const updatePhase = useCallback(async (id: string, updates: Partial<Phase>, refetch: () => Promise<void>) => {
    if (!userId) throw new Error('Not authenticated')

    const dbUpdates: any = {}
    if (updates.name !== undefined) dbUpdates.name = updates.name
    if (updates.description !== undefined) dbUpdates.description = updates.description
    if (updates.startDate !== undefined) dbUpdates.start_date = updates.startDate
    if (updates.endDate !== undefined) dbUpdates.end_date = updates.endDate
    if (updates.status !== undefined) dbUpdates.status = updates.status
    if (updates.color !== undefined) dbUpdates.color = updates.color
    if (updates.order !== undefined) dbUpdates.order = updates.order
    dbUpdates.updated_at = new Date().toISOString()

    const { error } = await supabase.from('phases').update(dbUpdates).eq('id', id)
    if (error) throw error
    await refetch()
  }, [userId])

  const deletePhase = useCallback(async (id: string) => {
    if (!userId) throw new Error('Not authenticated')
    const { error } = await supabase.from('phases').delete().eq('id', id)
    if (error) throw error
    setPhases(prev => prev.filter(p => p.id !== id))
  }, [userId])

  return {
    tasks,
    phases,
    setTasks,
    setPhases,
    loadTasks,
    createTask,
    updateTask,
    deleteTask,
    addTaskComment,
    updateTaskPhase,
    createPhase,
    updatePhase,
    deletePhase,
  }
}
