'use client'

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Project, Expense, TeamMember, TimelineEvent } from '@/types'
import { ProjectFormData, CalendarEvent } from '@/types/data'

export function useProjects(userId: string | undefined, orgId?: string | null) {
  const [projects, setProjects] = useState<Project[]>([])

  const loadProjects = useCallback(async () => {
    if (!userId) return []

    const { data: projectsData, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .eq(orgId ? 'org_id' : 'user_id', orgId || userId!)
      .order('created_at', { ascending: false })

    if (projectsError) throw projectsError

    const transformed = (projectsData || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      client: p.client_name,
      status: p.status,
      contractAmount: p.budget || 0,
      progress: p.progress || 0,
      startDate: p.start_date,
      dueDate: p.end_date,
      branch: p.branch || '',
      address: p.address || '',
      expenses: [] as Expense[],
      team: [] as TeamMember[],
      timeline: [] as TimelineEvent[],
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    }))

    // Load expenses for all projects
    const projectIds = transformed.map(p => p.id)
    if (projectIds.length > 0) {
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('*')
        .in('project_id', projectIds)

      if (!expensesError && expensesData) {
        transformed.forEach(project => {
          project.expenses = expensesData
            .filter((e: any) => e.project_id === project.id)
            .map((e: any) => ({
              id: e.id,
              type: e.category as 'labor' | 'materials' | 'equipment' | 'subcontractor' | 'other',
              description: e.description,
              amount: e.amount,
              date: e.date,
              projectId: e.project_id,
              createdAt: e.created_at,
              updatedAt: e.updated_at,
            }))
        })
      }
    }

    setProjects(transformed as Project[])
    return transformed
  }, [userId])

  const syncProjectDatesToCalendar = useCallback(async (
    projectId: string, projectName: string, startDate?: string, dueDate?: string
  ) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: existingEvents } = await supabase
      .from('events')
      .select('*')
      .eq('project_id', projectId)
      .in('type', ['milestone', 'deadline'])

    const startEvent = existingEvents?.find(e => e.type === 'milestone')
    const dueEvent = existingEvents?.find(e => e.type === 'deadline')

    if (startDate) {
      const startDateTime = new Date(startDate)
      startDateTime.setHours(9, 0, 0, 0)

      if (startEvent) {
        await supabase.from('events').update({
          title: `${projectName} - Start`,
          start_time: startDateTime.toISOString(),
          end_time: startDateTime.toISOString(),
        }).eq('id', startEvent.id)
      } else {
        await supabase.from('events').insert([{
          user_id: user.id,
          project_id: projectId,
          title: `${projectName} - Start`,
          description: 'Project start date',
          start_time: startDateTime.toISOString(),
          end_time: startDateTime.toISOString(),
          all_day: true,
          type: 'milestone',
          attendees: JSON.stringify([]),
          recurring: false,
        }])
      }
    } else if (startEvent) {
      await supabase.from('events').delete().eq('id', startEvent.id)
    }

    if (dueDate) {
      const dueDateTime = new Date(dueDate)
      dueDateTime.setHours(17, 0, 0, 0)

      if (dueEvent) {
        await supabase.from('events').update({
          title: `${projectName} - Due`,
          start_time: dueDateTime.toISOString(),
          end_time: dueDateTime.toISOString(),
        }).eq('id', dueEvent.id)
      } else {
        await supabase.from('events').insert([{
          user_id: user.id,
          project_id: projectId,
          title: `${projectName} - Due`,
          description: 'Project deadline',
          start_time: dueDateTime.toISOString(),
          end_time: dueDateTime.toISOString(),
          all_day: true,
          type: 'deadline',
          attendees: JSON.stringify([]),
          recurring: false,
        }])
      }
    } else if (dueEvent) {
      await supabase.from('events').delete().eq('id', dueEvent.id)
    }
  }, [])

  const createProject = useCallback(async (data: ProjectFormData) => {
    if (!userId) throw new Error('Not authenticated')

    const { data: newProject, error } = await supabase
      .from('projects')
      .insert([{
        user_id: userId, org_id: orgId || undefined,
        name: data.name,
        description: data.description,
        client_name: data.client,
        status: data.status || 'active',
        budget: data.contractAmount,
        start_date: data.startDate || null,
        end_date: data.dueDate || null,
        branch: data.branch || null,
        address: data.address || null,
      }])
      .select()
      .single()

    if (error) throw error

    await loadProjects()
    await syncProjectDatesToCalendar(newProject.id, data.name, data.startDate, data.dueDate)

    return newProject as Project
  }, [userId, loadProjects, syncProjectDatesToCalendar])

  const updateProject = useCallback(async (id: string, updates: Partial<Project>) => {
    const sanitize = (value: any, type: 'string' | 'number' | 'date' = 'string') => {
      if (value === undefined) return undefined
      if (value === null) return null
      if (type === 'date') return value === '' ? null : value
      if (type === 'number') {
        if (value === '' || value === null) return null
        const num = Number(value)
        return isNaN(num) ? null : num
      }
      return value === '' ? null : value
    }

    const dbUpdates: any = {}
    if (updates.name !== undefined) dbUpdates.name = sanitize(updates.name)
    if (updates.description !== undefined) dbUpdates.description = sanitize(updates.description)
    if (updates.client !== undefined) dbUpdates.client_name = sanitize(updates.client)
    if (updates.status !== undefined) dbUpdates.status = sanitize(updates.status)
    if (updates.contractAmount !== undefined) dbUpdates.budget = sanitize(updates.contractAmount, 'number')
    if (updates.progress !== undefined) dbUpdates.progress = sanitize(updates.progress, 'number')
    if (updates.startDate !== undefined) dbUpdates.start_date = sanitize(updates.startDate, 'date')
    if (updates.dueDate !== undefined) dbUpdates.end_date = sanitize(updates.dueDate, 'date')
    if (updates.branch !== undefined) dbUpdates.branch = sanitize(updates.branch)
    if (updates.address !== undefined) dbUpdates.address = sanitize(updates.address)

    if (Object.keys(dbUpdates).length === 0) {
      return projects.find(p => p.id === id)
    }

    const { data: updated, error } = await supabase
      .from('projects')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    await loadProjects()

    if (updates.startDate !== undefined || updates.dueDate !== undefined) {
      const project = projects.find(p => p.id === id)
      if (project) {
        await syncProjectDatesToCalendar(
          id,
          updates.name || project.name,
          updates.startDate !== undefined ? updates.startDate : project.startDate,
          updates.dueDate !== undefined ? updates.dueDate : project.dueDate
        )
      }
    }

    return updated as Project
  }, [projects, loadProjects, syncProjectDatesToCalendar])

  const deleteProject = useCallback(async (id: string) => {
    const { error } = await supabase.from('projects').delete().eq('id', id)
    if (error) throw error
    setProjects(prev => prev.filter(p => p.id !== id))
  }, [])

  // ==================== EXPENSES ====================

  const addExpense = useCallback(async (projectId: string, expense: {
    description: string; amount: number; type: string; date: string
  }) => {
    if (!userId) throw new Error('Not authenticated')

    const { data: newExpense, error } = await supabase
      .from('expenses')
      .insert([{
        project_id: projectId,
        user_id: userId, org_id: orgId || undefined,
        category: expense.type,
        description: expense.description,
        amount: expense.amount,
        date: expense.date,
      }])
      .select()
      .single()

    if (error) throw error

    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return { ...p, expenses: [...(p.expenses || []), newExpense as Expense] }
      }
      return p
    }))

    return newExpense as Expense
  }, [userId])

  const updateExpense = useCallback(async (projectId: string, expenseId: string, updates: Partial<Expense>) => {
    const { error } = await supabase
      .from('expenses')
      .update(updates)
      .eq('id', expenseId)
      .select()
      .single()

    if (error) throw error

    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          expenses: (p.expenses || []).map(e => e.id === expenseId ? { ...e, ...updates } : e)
        }
      }
      return p
    }))
  }, [])

  const deleteExpense = useCallback(async (projectId: string, expenseId: string) => {
    const { error } = await supabase.from('expenses').delete().eq('id', expenseId)
    if (error) throw error

    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return { ...p, expenses: (p.expenses || []).filter(e => e.id !== expenseId) }
      }
      return p
    }))
  }, [])

  const totalContractAmount = projects.reduce((sum, p) => sum + (p.contractAmount || 0), 0)
  const totalExpenses = projects.reduce((sum, p) =>
    sum + (p.expenses || []).reduce((expSum, e) => expSum + (e.amount || 0), 0), 0
  )
  const grossProfit = totalContractAmount - totalExpenses

  return {
    projects,
    setProjects,
    loadProjects,
    createProject,
    updateProject,
    deleteProject,
    addExpense,
    updateExpense,
    deleteExpense,
    totalContractAmount,
    totalExpenses,
    grossProfit,
    syncProjectDatesToCalendar,
  }
}
