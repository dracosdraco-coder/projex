'use client'

import { useState, useMemo, useCallback } from 'react'
import { Project, FormDocument, Meeting, Branch } from '@/types'

export interface SearchResult {
  type: 'project' | 'document' | 'meeting' | 'branch' | 'team'
  id: string
  title: string
  description?: string
  subtitle?: string
  matchedField: string
  relevance: number
}

interface UseGlobalSearchProps {
  projects: Project[]
  documents: FormDocument[]
  meetings: Meeting[]
  branches: Branch[]
  tasks?: any[]
  teamMembers?: any[]
}

// Simple fuzzy match scoring
function fuzzyMatch(searchTerm: string, text: string): number {
  const search = searchTerm.toLowerCase()
  const target = text.toLowerCase()
  
  // Exact match gets highest score
  if (target === search) return 100
  
  // Starts with search term gets high score
  if (target.startsWith(search)) return 90
  
  // Contains search term gets medium score
  if (target.includes(search)) return 70
  
  // Fuzzy match - check if all characters appear in order
  let searchIndex = 0
  let matchCount = 0
  
  for (let i = 0; i < target.length && searchIndex < search.length; i++) {
    if (target[i] === search[searchIndex]) {
      matchCount++
      searchIndex++
    }
  }
  
  if (searchIndex === search.length) {
    // All characters found - score based on density
    return Math.floor((matchCount / target.length) * 60)
  }
  
  return 0
}

export function useGlobalSearch({ projects, documents, meetings, branches, tasks = [], teamMembers = [] }: UseGlobalSearchProps) {
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  // Build search index
  const searchIndex = useMemo(() => {
    const results: SearchResult[] = []

    // Index projects
    projects.forEach(project => {
      results.push({
        type: 'project',
        id: project.id,
        title: project.name,
        description: project.description,
        subtitle: `${project.status} • Due: ${project.dueDate}`,
        matchedField: 'name',
        relevance: 0
      })

      if (project.client) {
        results.push({
          type: 'project',
          id: project.id,
          title: project.name,
          description: `Client: ${project.client}`,
          subtitle: project.status,
          matchedField: 'client',
          relevance: 0
        })
      }
    })

    // Index tasks
    tasks.forEach((task: any) => {
      results.push({
        type: 'project' as any,
        id: task.id,
        title: task.title,
        description: task.description || '',
        subtitle: `${task.status} • ${task.priority || ''} ${task.assignee ? '• ' + task.assignee : ''}`,
        matchedField: 'title',
        relevance: 0
      })
    })

    // Index team members
    teamMembers.forEach((member: any) => {
      results.push({
        type: 'team',
        id: member.id,
        title: member.name,
        description: member.email || '',
        subtitle: member.role || '',
        matchedField: 'name',
        relevance: 0
      })
    })

    // Index documents
    documents.forEach(doc => {
      results.push({
        type: 'document',
        id: doc.id,
        title: doc.title,
        description: `${doc.type} • ${doc.status}`,
        subtitle: doc.date,
        matchedField: 'title',
        relevance: 0
      })
    })

    // Index meetings
    meetings.forEach(meeting => {
      results.push({
        type: 'meeting',
        id: meeting.id,
        title: meeting.title,
        description: `${meeting.date} at ${meeting.time}`,
        subtitle: `${meeting.attendees.length} attendees`,
        matchedField: 'title',
        relevance: 0
      })
    })

    // Index branches
    branches.forEach(branch => {
  const projectCount = projects.filter(p => p.branch === branch.id).length
  
  results.push({
        type: 'branch',
        id: branch.id,
        title: branch.name,
        description: branch.location,
        subtitle: `${projects.filter(p => p.branch === branch.id).length} projects`,
        matchedField: 'name',
        relevance: 0
      })
    })

    // Index team members across all projects
    const projectTeamMembers = new Map<string, { member: any, projectName: string }>()
projects.forEach(project => {
  // Check if team exists and is an array
  if (project.team && Array.isArray(project.team)) {
(project.team || []).forEach((member: any) => {
        if (!projectTeamMembers.has(member.id)) {
          projectTeamMembers.set(member.id, { member, projectName: project.name })
        }
      })
    }
    })

    projectTeamMembers.forEach(({ member, projectName }) => {
      results.push({
        type: 'team',
        id: member.id,
        title: member.name,
        description: `${member.role} on ${projectName}`,
        subtitle: member.role,
        matchedField: 'name',
        relevance: 0
      })
    })

    return results
  }, [projects, documents, meetings, branches, tasks, teamMembers])

  // Search function
  const search = useCallback((query: string): SearchResult[] => {
    if (!query.trim()) return []

    const searchTerm = query.trim()

    // Score each result
    const scoredResults = searchIndex.map(result => {
      let score = 0

      // Search in title (highest weight)
      score += fuzzyMatch(searchTerm, result.title) * 2

      // Search in description
      if (result.description) {
        score += fuzzyMatch(searchTerm, result.description)
      }

      // Search in subtitle
      if (result.subtitle) {
        score += fuzzyMatch(searchTerm, result.subtitle) * 0.5
      }

      return { ...result, relevance: score }
    })

    // Filter out non-matches and sort by relevance
    const filtered = scoredResults
      .filter(result => result.relevance > 0)
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 20) // Limit to top 20 results

    // Save to recent searches if we got results
    if (filtered.length > 0 && searchTerm.length > 2) {
      setRecentSearches(prev => {
        const updated = [searchTerm, ...prev.filter(s => s !== searchTerm)]
        return updated.slice(0, 5) // Keep last 5 searches
      })
    }

    return filtered
  }, [searchIndex])

  const clearRecent = useCallback(() => {
    setRecentSearches([])
  }, [])

  return {
    search,
    recentSearches,
    clearRecent
  }
}