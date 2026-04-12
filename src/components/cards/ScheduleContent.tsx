'use client'

import { useState, useMemo } from 'react'
import { Project, Meeting, Branch } from '@/types'
import Calendar, { CalendarEvent } from '@/components/ui/Calendar'
import EmptyState from '@/components/ui/EmptyState'

interface ScheduleContentProps {
  projects: Project[]
  meetings: Meeting[]
  branches: Branch[]
  onDateClick?: (date: string) => void
  onCreateMeeting?: () => void
  onOpenProject?: (projectId: string) => void
  onOpenMeeting?: (meetingId: string) => void
}

export default function ScheduleContent({
  projects = [],
  meetings = [],
  branches = [],
  onDateClick,
  onCreateMeeting,
  onOpenProject,
  onOpenMeeting
}: ScheduleContentProps) {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [filterProject, setFilterProject] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterBranch, setFilterBranch] = useState<string>('all')
  const [filterMember, setFilterMember] = useState<string>('all')

  // Get all unique team members
  const allMembers = useMemo(() => {
    return Array.from(new Set(
projects.flatMap(p => (p.team || []).map(t => t.name))
        .concat(meetings.flatMap(m => m.attendees))
    )).sort()
  }, [projects, meetings])

  // Convert meetings and project dates to calendar events
  const calendarEvents: CalendarEvent[] = useMemo(() => {
    const events: CalendarEvent[] = []

    // Add meetings
    meetings.forEach(meeting => {
      events.push({
        id: meeting.id,
        title: meeting.title,
        date: meeting.date,
        time: meeting.time,
        type: 'meeting' as const,
        color: 'bg-blue-500',
        projectId: meeting.projectId
      })
    })

    // Add project start dates
    projects.forEach(project => {
      if (project.startDate) {
        events.push({
          id: `start-${project.id}`,
          title: `${project.name} Start`,
          date: project.startDate,
          type: 'milestone' as const,
          color: 'bg-green-500',
          projectId: project.id
        })
      }
    })

    // Add project due dates
    projects.forEach(project => {
      events.push({
        id: `deadline-${project.id}`,
        title: `${project.name} Due`,
        date: project.dueDate,
        type: 'deadline' as const,
        color: project.status === 'active' ? 'bg-red-500' : 'bg-gray-500',
        projectId: project.id
      })
    })

    return events
  }, [meetings, projects])

  // Apply filters
  const filteredEvents = useMemo(() => {
    return calendarEvents.filter(event => {
      // Filter by project
      if (filterProject !== 'all' && event.projectId !== filterProject) {
        return false
      }

      // Filter by type
      if (filterType !== 'all' && event.type !== filterType) {
        return false
      }

      // Filter by branch
      if (filterBranch !== 'all') {
        const meeting = meetings.find(m => m.id === event.id)
        if (meeting && meeting.branchId && meeting.branchId !== filterBranch) {
          return false
        }
        const project = projects.find(p => p.id === event.projectId)
        if (project && project.branch !== filterBranch) {
          return false
        }
      }

      // Filter by team member
      if (filterMember !== 'all') {
        const meeting = meetings.find(m => m.id === event.id)
        if (meeting && !meeting.attendees.includes(filterMember)) {
          // Check if it's a project event with this team member
          const project = projects.find(p => p.id === event.projectId)
if (!project || !(project.team || []).some(t => t.name === filterMember)) {
            return false
          }
        }
      }

      return true
    })
  }, [calendarEvents, filterProject, filterType, filterBranch, filterMember, meetings, projects])

  const handleDateClick = (date: string) => {
    onDateClick?.(date)
  }

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event)
  }

  const handleViewDetails = () => {
    if (!selectedEvent) return
    
    // Navigate to related project or meeting
    if (selectedEvent.type === 'meeting') {
      const meeting = meetings.find(m => m.id === selectedEvent.id)
      if (meeting && onOpenMeeting) {
        onOpenMeeting(meeting.id)
      }
    } else {
      const project = projects.find(p => p.id === selectedEvent.projectId)
      if (project && onOpenProject) {
        onOpenProject(project.id)
      }
    }
    setSelectedEvent(null)
  }

  if (projects.length === 0 && meetings.length === 0) {
    return (
      <EmptyState
        icon="schedule"
        title="No events scheduled"
        description="Create projects and meetings to see them on your calendar."
        actionLabel="New Meeting"
        onAction={onCreateMeeting}
      />
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Filters and New Event Button */}
      <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-200 dark:border-[#2a2a2a] flex-wrap">
        <button
          onClick={onCreateMeeting}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Event
        </button>

        <div className="flex items-center gap-2 ml-auto flex-wrap">
          <select
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            className="px-3 py-1.5 text-sm bg-gray-50 dark:bg-[#222222] border border-gray-200 dark:border-[#333333] rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-gray-400 dark:focus:border-[#444444] transition-colors"
          >
            <option value="all">All Projects</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>

          <select
            value={filterBranch}
            onChange={(e) => setFilterBranch(e.target.value)}
            className="px-3 py-1.5 text-sm bg-gray-50 dark:bg-[#222222] border border-gray-200 dark:border-[#333333] rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-gray-400 dark:focus:border-[#444444] transition-colors"
          >
            <option value="all">All Branches</option>
            {branches.map(branch => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>

          <select
            value={filterMember}
            onChange={(e) => setFilterMember(e.target.value)}
            className="px-3 py-1.5 text-sm bg-gray-50 dark:bg-[#222222] border border-gray-200 dark:border-[#333333] rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-gray-400 dark:focus:border-[#444444] transition-colors"
          >
            <option value="all">All Members</option>
            {allMembers.map(member => (
              <option key={member} value={member}>
                {member}
              </option>
            ))}
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-1.5 text-sm bg-gray-50 dark:bg-[#222222] border border-gray-200 dark:border-[#333333] rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-gray-400 dark:focus:border-[#444444] transition-colors"
          >
            <option value="all">All Types</option>
            <option value="meeting">Meetings</option>
            <option value="deadline">Deadlines</option>
            <option value="milestone">Milestones</option>
          </select>

          {(filterProject !== 'all' || filterType !== 'all' || filterBranch !== 'all' || filterMember !== 'all') && (
            <button
              onClick={() => {
                setFilterProject('all')
                setFilterType('all')
                setFilterBranch('all')
                setFilterMember('all')
              }}
              className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <Calendar
        events={filteredEvents}
        onDateClick={handleDateClick}
        onEventClick={handleEventClick}
      />

      {/* Event detail modal */}
      {selectedEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedEvent(null)}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="relative bg-white dark:bg-[#1a1a1a] rounded-xl shadow-2xl border border-gray-200 dark:border-[#333333] p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${selectedEvent.color || 'bg-gray-500'}`} />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {selectedEvent.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {new Date(selectedEvent.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </div>

              {selectedEvent.time && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {selectedEvent.time}
                  {selectedEvent.endTime && ` - ${selectedEvent.endTime}`}
                </div>
              )}

              {selectedEvent.projectId && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  {projects.find(p => p.id === selectedEvent.projectId)?.name || 'Unknown Project'}
                </div>
              )}

              <div className="pt-3 border-t border-gray-200 dark:border-[#2a2a2a]">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-[#222222] text-gray-700 dark:text-gray-300 capitalize">
                  {selectedEvent.type}
                </span>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={handleViewDetails}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
              >
                View Details
              </button>
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#222222] rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}