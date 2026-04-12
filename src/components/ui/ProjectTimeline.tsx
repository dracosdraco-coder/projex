'use client'

import { useState } from 'react'
import { Project, TimelineEvent } from '@/types'
import { formatCurrency } from '@/lib/utils'

interface ProjectTimelineProps {
  project: Project
  onUpdateTimeline: (projectId: string, event: Omit<TimelineEvent, 'id' | 'createdAt'>) => Promise<void>
  onUpdateDates: (projectId: string, dates: {
    proposalDate?: string
    contractSignedDate?: string
    actualStartDate?: string
    actualEndDate?: string
  }) => Promise<void>
}

const EVENT_TYPES = [
  { value: 'proposal', label: 'Proposal Sent', icon: '📋', color: 'blue' },
  { value: 'contract', label: 'Contract Signed', icon: '✍️', color: 'green' },
  { value: 'start', label: 'Work Started', icon: '🚀', color: 'purple' },
  { value: 'milestone', label: 'Milestone Reached', icon: '🎯', color: 'yellow' },
  { value: 'invoice', label: 'Invoice Sent', icon: '💵', color: 'orange' },
  { value: 'payment', label: 'Payment Received', icon: '💰', color: 'green' },
  { value: 'completion', label: 'Project Completed', icon: '✅', color: 'green' },
  { value: 'note', label: 'Note/Update', icon: '📝', color: 'gray' },
  { value: 'status-change', label: 'Status Changed', icon: '🔄', color: 'blue' },
  { value: 'progress-update', label: 'Progress Updated', icon: '📊', color: 'purple' },
]

export default function ProjectTimeline({ 
  project, 
  onUpdateTimeline,
  onUpdateDates 
}: ProjectTimelineProps) {
  const [showAddEvent, setShowAddEvent] = useState(false)
  const [editDates, setEditDates] = useState(false)
  const [newEvent, setNewEvent] = useState({
    type: 'note' as TimelineEvent['type'],
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    amount: '',
  })

  const [dates, setDates] = useState({
    proposalDate: project.proposalDate || '',
    contractSignedDate: project.contractSignedDate || '',
    actualStartDate: project.actualStartDate || '',
    actualEndDate: project.actualEndDate || '',
  })

  const handleAddEvent = async () => {
    if (!newEvent.title.trim()) return

    await onUpdateTimeline(project.id, {
      type: newEvent.type,
      title: newEvent.title,
      description: newEvent.description || undefined,
      date: newEvent.date,
      amount: newEvent.amount ? parseFloat(newEvent.amount) : undefined,
      user: 'Current User', // Replace with actual user
      metadata: {},
    })

    // Reset form
    setNewEvent({
      type: 'note',
      title: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      amount: '',
    })
    setShowAddEvent(false)
  }

  const handleSaveDates = async () => {
    await onUpdateDates(project.id, dates)
    setEditDates(false)
  }

  const getEventColor = (type: string) => {
    const event = EVENT_TYPES.find(e => e.value === type)
    return event?.color || 'gray'
  }

  const getEventIcon = (type: string) => {
    const event = EVENT_TYPES.find(e => e.value === type)
    return event?.icon || '📌'
  }

  const sortedTimeline = [...(project.timeline || [])].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  return (
    <div className="space-y-6">
      {/* Key Dates Section */}
      <div className="bg-white dark:bg-[#1e1e1e] rounded-xl p-6 border border-gray-200 dark:border-[#2a2a2a]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Key Dates
          </h3>
          <button
            onClick={() => setEditDates(!editDates)}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
          >
            {editDates ? 'Cancel' : 'Edit Dates'}
          </button>
        </div>

        {editDates ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Proposal Date
                </label>
                <input
                  type="date"
                  value={dates.proposalDate}
                  onChange={(e) => setDates({ ...dates, proposalDate: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-[#222222] border border-gray-200 dark:border-[#333333] rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Contract Signed
                </label>
                <input
                  type="date"
                  value={dates.contractSignedDate}
                  onChange={(e) => setDates({ ...dates, contractSignedDate: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-[#222222] border border-gray-200 dark:border-[#333333] rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Work Started
                </label>
                <input
                  type="date"
                  value={dates.actualStartDate}
                  onChange={(e) => setDates({ ...dates, actualStartDate: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-[#222222] border border-gray-200 dark:border-[#333333] rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Work Completed
                </label>
                <input
                  type="date"
                  value={dates.actualEndDate}
                  onChange={(e) => setDates({ ...dates, actualEndDate: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-[#222222] border border-gray-200 dark:border-[#333333] rounded-lg text-sm"
                />
              </div>
            </div>
            <button
              onClick={handleSaveDates}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg"
            >
              Save Dates
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Proposal Date</p>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {project.proposalDate ? new Date(project.proposalDate).toLocaleDateString() : 'Not set'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Contract Signed</p>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {project.contractSignedDate ? new Date(project.contractSignedDate).toLocaleDateString() : 'Not set'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Work Started</p>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {project.actualStartDate ? new Date(project.actualStartDate).toLocaleDateString() : 'Not set'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Work Completed</p>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {project.actualEndDate ? new Date(project.actualEndDate).toLocaleDateString() : 'Not set'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Activity Timeline */}
      <div className="bg-white dark:bg-[#1e1e1e] rounded-xl p-6 border border-gray-200 dark:border-[#2a2a2a]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Activity Timeline
          </h3>
          <button
            onClick={() => setShowAddEvent(!showAddEvent)}
            className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Event
          </button>
        </div>

        {/* Add Event Form */}
        {showAddEvent && (
          <div className="mb-6 p-4 bg-gray-50 dark:bg-[#222222] rounded-lg border border-gray-200 dark:border-[#333333]">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Event Type
                  </label>
                  <select
                    value={newEvent.type}
                    onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value as TimelineEvent['type'] })}
                    className="w-full px-3 py-2 bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-[#333333] rounded-lg text-sm"
                  >
                    {EVENT_TYPES.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-[#333333] rounded-lg text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  placeholder="e.g., Phase 1 Complete, Invoice #1234 Sent"
                  className="w-full px-3 py-2 bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-[#333333] rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-[#333333] rounded-lg text-sm resize-none"
                />
              </div>
              {(newEvent.type === 'invoice' || newEvent.type === 'payment') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Amount
                  </label>
                  <input
                    type="number"
                    value={newEvent.amount}
                    onChange={(e) => setNewEvent({ ...newEvent, amount: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-[#333333] rounded-lg text-sm"
                  />
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={handleAddEvent}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg"
                >
                  Add Event
                </button>
                <button
                  onClick={() => setShowAddEvent(false)}
                  className="px-4 py-2 bg-gray-200 dark:bg-[#2a2a2a] text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Timeline Events */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {sortedTimeline.length > 0 ? (
            sortedTimeline.map((event) => {
              const color = getEventColor(event.type)
              const icon = getEventIcon(event.type)
              
              return (
                <div
                  key={event.id}
                  className="flex gap-3 p-3 bg-gray-50 dark:bg-[#222222] rounded-lg border border-gray-200 dark:border-[#333333] hover:border-gray-300 dark:hover:border-[#444444] transition-colors"
                >
                  <div className={`flex-shrink-0 w-10 h-10 bg-${color}-100 dark:bg-${color}-900/20 rounded-lg flex items-center justify-center text-xl`}>
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                          {event.title}
                        </p>
                        {event.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {event.description}
                          </p>
                        )}
                        {event.amount && (
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-1">
                            {formatCurrency(event.amount)}
                          </p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(event.date).toLocaleDateString()}
                        </p>
                        {event.user && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {event.user}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <p className="text-center text-gray-400 dark:text-gray-500 py-8 text-sm">
              No timeline events yet. Add your first event to track project progress.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
