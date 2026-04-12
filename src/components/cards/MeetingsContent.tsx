'use client'

import { useState } from 'react'
import { Meeting, Project } from '@/types'
import EmptyState from '@/components/ui/EmptyState'

interface MeetingsContentProps {
  meetings: Meeting[]
  projects?: Project[]
  onAddMeeting?: () => void
  onDeleteMeeting?: (meetingId: string) => void
}

export default function MeetingsContent({ 
  meetings = [], 
  projects = [],
  onAddMeeting, 
  onDeleteMeeting 
}: MeetingsContentProps) {
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null)

  if (meetings.length === 0) {
    return (
      <EmptyState
        icon="meetings"
        title="No meetings scheduled"
        description="Schedule meetings with your team and clients."
        actionLabel="Schedule Meeting"
        onAction={onAddMeeting}
      />
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-900 dark:text-gray-100">Meetings</h3>
        <button 
          onClick={onAddMeeting}
          className="px-3 py-1.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm rounded-lg hover:bg-gray-700 dark:hover:bg-gray-300 transition-colors"
        >
          Schedule Meeting
        </button>
      </div>
      <div className="flex-1 overflow-auto">
        {meetings.map((meeting, index) => (
          <div
            key={meeting.id}
            onClick={() => setSelectedMeeting(meeting)}
            className={`py-3 transition-all duration-200 hover:bg-gray-50 dark:hover:bg-[#222222] rounded-lg px-2 -mx-2 group cursor-pointer ${index !== meetings.length - 1 ? 'border-b border-gray-100 dark:border-[#2a2a2a]' : ''}`}
          >
            <div className="flex items-center justify-between mb-1">
              <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">{meeting.title}</p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">{meeting.time}</span>
                {onDeleteMeeting && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteMeeting(meeting.id)
                    }}
                    className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span>{meeting.date}</span>
              {meeting.attendees.length > 0 && (
                <>
                  <span>•</span>
                  <span>{meeting.attendees.join(', ')}</span>
                </>
              )}
              {meeting.projectId && projects && (
                <>
                  <span>•</span>
                  <span className="text-blue-600 dark:text-blue-400">
                    {projects.find(p => p.id === meeting.projectId)?.name || 'Unknown Project'}
                  </span>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Meeting Detail Modal */}
      {selectedMeeting && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedMeeting(null)}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="relative bg-white dark:bg-[#1a1a1a] rounded-xl shadow-2xl border border-gray-200 dark:border-[#333333] p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {selectedMeeting.title}
              </h3>
              <button
                onClick={() => setSelectedMeeting(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-[#222222] rounded-lg">
                <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Date & Time</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {new Date(selectedMeeting.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{selectedMeeting.time}</p>
                </div>
              </div>

              {selectedMeeting.projectId && projects && (
                <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Project</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {projects.find(p => p.id === selectedMeeting.projectId)?.name || 'Unknown Project'}
                    </p>
                  </div>
                </div>
              )}

              {selectedMeeting.branchId && (
                <div className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Branch</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Branch ID: {selectedMeeting.branchId}</p>
                  </div>
                </div>
              )}

              {selectedMeeting.attendees.length > 0 && (
                <div className="p-3 bg-gray-50 dark:bg-[#222222] rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Attendees ({selectedMeeting.attendees.length})</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedMeeting.attendees.map((attendee, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333333] rounded-full text-xs font-medium text-gray-700 dark:text-gray-300"
                      >
                        {attendee}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-6 pt-4 border-t border-gray-200 dark:border-[#2a2a2a]">
              <button
                onClick={() => setSelectedMeeting(null)}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
              >
                Close
              </button>
              {onDeleteMeeting && (
                <button
                  onClick={() => {
                    onDeleteMeeting(selectedMeeting.id)
                    setSelectedMeeting(null)
                  }}
                  className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}