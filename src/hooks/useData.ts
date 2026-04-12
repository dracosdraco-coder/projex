'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Project, TimelineEvent } from '@/types'
import { useProjects } from './useProjects'
import { useTasks } from './useTasks'
import { useCalendar } from './useCalendar'
import { useTeam } from './useTeam'
import { useDocuments } from './useDocuments'
import { Phase, Task } from '@/types/data'

// Re-export types so existing imports from useData still work
export type {
  StorageDocument, CalendarEvent, Message, MessageAttachment,
  Task, Phase, Milestone, TaskComment,
  ProjectFormData, MeetingFormData,
  LineItemTemplate, FormTemplate, GeneratedDocument,
} from '@/types/data'

export function useData() {
  const { user } = useAuth()
  const userId = user?.id

  // Get org_id from profile — stored in memory after first load
  const [orgId, setOrgId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load org_id from profile
  useEffect(() => {
    if (!userId) return
    import('@/lib/supabase').then(({ supabase }) => {
      supabase.from('profiles').select('org_id').eq('id', userId).single()
        .then(({ data }) => { if (data?.org_id) setOrgId(data.org_id) })
    })
  }, [userId])

  // Domain hooks — pass orgId when available
  const projects = useProjects(userId, orgId)
  const tasksDomain = useTasks(userId, orgId)
  const calendar = useCalendar(userId, orgId)
  const team = useTeam(userId, orgId)
  const docs = useDocuments(userId, orgId)

  // Orchestrated data loading — runs projects+team first, then everything else in parallel
  const loadData = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const [transformedProjects, transformedTeamMembers] = await Promise.all([
        projects.loadProjects(),
        team.loadTeamMembers(),
      ])

      await Promise.all([
        tasksDomain.loadTasks(transformedProjects || [], transformedTeamMembers || []),
        calendar.loadEvents(),
        team.loadMessages(),
        docs.loadStorageDocuments(),
        docs.loadMeetings(),
        docs.loadBranches(),
        docs.loadLineItemTemplates(),
        docs.loadFormTemplates(),
        docs.loadGeneratedDocuments(),
      ])

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Wrappers that inject refetch where needed
  const createTask = async (data: {
    projectId: string; phaseId?: string | null; title: string
    description?: string; status?: string; priority?: string
    assignedTo?: string; dueDate?: string
  }) => tasksDomain.createTask(data, loadData)

  const addTaskComment = async (taskId: string, content: string) =>
    tasksDomain.addTaskComment(taskId, content, loadData)

  const updateTaskPhase = async (taskId: string, phaseId: string | null) =>
    tasksDomain.updateTaskPhase(taskId, phaseId, loadData)

  const createPhase = async (data: {
    projectId: string; name: string; description?: string
    startDate: string; endDate: string; color?: string; order?: number
  }) => tasksDomain.createPhase(data, loadData)

  const updatePhase = async (id: string, updates: Partial<Phase>) =>
    tasksDomain.updatePhase(id, updates, loadData)

  const uploadMessageAttachment = async (messageId: string, file: File) =>
    team.uploadMessageAttachment(messageId, file, loadData)

  // Timeline helpers (local state only, no DB)
  const updateTimeline = useCallback(async (projectId: string, event: Omit<TimelineEvent, 'id' | 'createdAt'>) => {
    projects.setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        const newEvent: TimelineEvent = {
          ...event,
          id: `evt${Date.now()}`,
          createdAt: new Date().toISOString(),
        }
        return { ...p, timeline: [...(p.timeline || []), newEvent] }
      }
      return p
    }))
  }, [])

  const updateProjectDates = useCallback(async (
    projectId: string,
    dates: { proposalDate?: string; contractSignedDate?: string; actualStartDate?: string; actualEndDate?: string }
  ) => {
    try {
      await projects.updateProject(projectId, dates as any)
    } catch (_) { /* handled upstream */ }
  }, [projects.updateProject])

  // Return the exact same shape the rest of the app expects
  return {
    // Org
    orgId,

    // Data
    projects: projects.projects,
    meetings: docs.meetings,
    documents: docs.documents,
    storageDocuments: docs.storageDocuments,
    branches: docs.branches,
    events: calendar.events,
    teamMembers: team.teamMembers,
    messages: team.messages,
    tasks: tasksDomain.tasks,
    phases: tasksDomain.phases,
    lineItemTemplates: docs.lineItemTemplates,
    formTemplates: docs.formTemplates,
    generatedDocuments: docs.generatedDocuments,

    // Loading
    loading,
    error,

    // Computed
    totalContractAmount: projects.totalContractAmount,
    totalExpenses: projects.totalExpenses,
    grossProfit: projects.grossProfit,

    // Projects
    createProject: projects.createProject,
    updateProject: projects.updateProject,
    deleteProject: projects.deleteProject,
    addExpense: projects.addExpense,
    updateExpense: projects.updateExpense,
    deleteExpense: projects.deleteExpense,

    // Team
    createTeamMember: team.createTeamMember,
    updateTeamMember: team.updateTeamMember,
    deleteTeamMember: team.deleteTeamMember,
    assignTeamMemberToProject: team.assignTeamMemberToProject,
    removeTeamMemberFromProject: team.removeTeamMemberFromProject,

    // Messages
    createMessage: team.createMessage,
    deleteMessage: team.deleteMessage,
    uploadMessageAttachment,

    // Tasks
    createTask,
    updateTask: tasksDomain.updateTask,
    deleteTask: tasksDomain.deleteTask,
    addTaskComment,
    updateTaskPhase,

    // Phases
    createPhase,
    updatePhase,
    deletePhase: tasksDomain.deletePhase,

    // Meetings
    createMeeting: docs.createMeeting,
    deleteMeeting: docs.deleteMeeting,

    // Documents
    createDocument: docs.createDocument,
    uploadDocument: docs.uploadDocument,
    deleteDocument: docs.deleteDocument,
    downloadDocument: docs.downloadDocument,

    // Branches
    createBranch: docs.createBranch,
    updateBranch: docs.updateBranch,
    deleteBranch: docs.deleteBranch,

    // Calendar
    createEvent: calendar.createEvent,
    updateEvent: calendar.updateEvent,
    deleteEvent: calendar.deleteEvent,

    // Forms system
    createLineItemTemplate: docs.createLineItemTemplate,
    updateLineItemTemplate: docs.updateLineItemTemplate,
    deleteLineItemTemplate: docs.deleteLineItemTemplate,
    createFormTemplate: docs.createFormTemplate,
    updateFormTemplate: docs.updateFormTemplate,
    deleteFormTemplate: docs.deleteFormTemplate,
    createGeneratedDocument: docs.createGeneratedDocument,
    updateGeneratedDocument: docs.updateGeneratedDocument,
    deleteGeneratedDocument: docs.deleteGeneratedDocument,
    getNextDocumentNumber: docs.getNextDocumentNumber,

    // Utility
    refetch: loadData,
    updateTimeline,
    updateProjectDates,
  }
}
