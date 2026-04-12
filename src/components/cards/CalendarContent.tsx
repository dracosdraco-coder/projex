'use client'

import React from "react"

import { useState, useMemo } from 'react'
import { Project } from '@/types'

interface CalendarEvent {
  id: string
  title: string
  description?: string
  location?: string
  startTime: string // ISO string
  endTime: string // ISO string
  allDay: boolean
  type: 'meeting' | 'deadline' | 'milestone' | 'appointment' | 'reminder' | 'other'
  projectId?: string
  attendees: string[]
  color?: string
  recurring: boolean
  recurrenceRule?: string
  recurrenceEnd?: string
}

interface CalendarContentProps {
  projects: Project[]
  events: CalendarEvent[]
  onCreateEvent?: (event: Omit<CalendarEvent, 'id'>) => Promise<void>
  onUpdateEvent?: (id: string, event: Partial<CalendarEvent>) => Promise<void>
  onDeleteEvent?: (id: string) => Promise<void>
}

type ViewMode = 'month' | 'week' | 'day'

const EVENT_TYPES = [
  { value: 'meeting', label: 'Meeting', color: 'bg-blue-500' },
  { value: 'deadline', label: 'Deadline', color: 'bg-red-500' },
  { value: 'milestone', label: 'Milestone', color: 'bg-purple-500' },
  { value: 'appointment', label: 'Appointment', color: 'bg-green-500' },
  { value: 'reminder', label: 'Reminder', color: 'bg-yellow-500' },
  { value: 'other', label: 'Other', color: 'bg-gray-500' },
]

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export default function CalendarContent({
  projects = [],
  events = [],
  onCreateEvent,
  onUpdateEvent,
  onDeleteEvent,
}: CalendarContentProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showEventModal, setShowEventModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [showEventDetails, setShowEventDetails] = useState(false)

  // Event form state
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    location: '',
    startDate: '',
    startTime: '09:00',
    endDate: '',
    endTime: '10:00',
    allDay: false,
    type: 'meeting' as CalendarEvent['type'],
    projectId: '',
    attendees: [] as string[],
    recurring: false,
  })

  // Get start and end of current view period
  const viewPeriod = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const day = currentDate.getDate()

    if (viewMode === 'month') {
      const firstDay = new Date(year, month, 1)
      const lastDay = new Date(year, month + 1, 0)
      
      // Get calendar grid (includes days from prev/next month)
      const startDay = new Date(firstDay)
      startDay.setDate(startDay.getDate() - firstDay.getDay())
      
      const endDay = new Date(lastDay)
      endDay.setDate(endDay.getDate() + (6 - lastDay.getDay()))
      
      return { start: startDay, end: endDay, firstDay, lastDay }
    } else if (viewMode === 'week') {
      const startOfWeek = new Date(currentDate)
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
      startOfWeek.setHours(0, 0, 0, 0)
      
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(endOfWeek.getDate() + 6)
      endOfWeek.setHours(23, 59, 59, 999)
      
      return { start: startOfWeek, end: endOfWeek }
    } else { // day
      const start = new Date(year, month, day, 0, 0, 0, 0)
      const end = new Date(year, month, day, 23, 59, 59, 999)
      return { start, end }
    }
  }, [currentDate, viewMode])

  // Filter events for current view
  const visibleEvents = useMemo(() => {
    return events.filter(event => {
      const eventStart = new Date(event.startTime)
      const eventEnd = new Date(event.endTime)
      
      return (
        (eventStart >= viewPeriod.start && eventStart <= viewPeriod.end) ||
        (eventEnd >= viewPeriod.start && eventEnd <= viewPeriod.end) ||
        (eventStart < viewPeriod.start && eventEnd > viewPeriod.end)
      )
    })
  }, [events, viewPeriod])

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    return visibleEvents.filter(event => {
      const eventStart = new Date(event.startTime)
      const eventEnd = new Date(event.endTime)
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0)
      const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59)
      
      return (
        (eventStart >= dayStart && eventStart <= dayEnd) ||
        (eventEnd >= dayStart && eventEnd <= dayEnd) ||
        (eventStart < dayStart && eventEnd > dayEnd)
      )
    }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
  }

  // Navigation
  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const goToPrevious = () => {
    const newDate = new Date(currentDate)
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7)
    } else {
      newDate.setDate(newDate.getDate() - 1)
    }
    setCurrentDate(newDate)
  }

  const goToNext = () => {
    const newDate = new Date(currentDate)
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + 1)
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7)
    } else {
      newDate.setDate(newDate.getDate() + 1)
    }
    setCurrentDate(newDate)
  }

  // Format date for display
  const formatDate = (date: Date) => {
    if (viewMode === 'month') {
      return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`
    } else if (viewMode === 'week') {
      const end = new Date(viewPeriod.end)
      return `${MONTHS[date.getMonth()]} ${date.getDate()} - ${MONTHS[end.getMonth()]} ${end.getDate()}, ${date.getFullYear()}`
    } else {
      return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
    }
  }

  // Format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const hours = date.getHours()
    const minutes = date.getMinutes()
    const ampm = hours >= 12 ? 'PM' : 'AM'
    const displayHours = hours % 12 || 12
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`
  }

  // Open event creation modal
  const openCreateEventModal = (date?: Date) => {
    const targetDate = date || selectedDate || currentDate
    const dateStr = targetDate.toISOString().split('T')[0]
    
    setEventForm({
      title: '',
      description: '',
      location: '',
      startDate: dateStr,
      startTime: '09:00',
      endDate: dateStr,
      endTime: '10:00',
      allDay: false,
      type: 'meeting',
      projectId: '',
      attendees: [],
      recurring: false,
    })
    setSelectedEvent(null)
    setShowEventModal(true)
  }

  // Open event edit modal
  const openEditEventModal = (event: CalendarEvent) => {
    const startDate = new Date(event.startTime)
    const endDate = new Date(event.endTime)
    
    setEventForm({
      title: event.title,
      description: event.description || '',
      location: event.location || '',
      startDate: startDate.toISOString().split('T')[0],
      startTime: `${startDate.getHours().toString().padStart(2, '0')}:${startDate.getMinutes().toString().padStart(2, '0')}`,
      endDate: endDate.toISOString().split('T')[0],
      endTime: `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`,
      allDay: event.allDay,
      type: event.type,
      projectId: event.projectId || '',
      attendees: event.attendees,
      recurring: event.recurring,
    })
    setSelectedEvent(event)
    setShowEventDetails(false)
    setShowEventModal(true)
  }

  // Save event
  const handleSaveEvent = async () => {
    try {
      const startDateTime = new Date(`${eventForm.startDate}T${eventForm.startTime}`)
      const endDateTime = new Date(`${eventForm.endDate}T${eventForm.endTime}`)

      const eventData = {
        title: eventForm.title,
        description: eventForm.description,
        location: eventForm.location,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        allDay: eventForm.allDay,
        type: eventForm.type,
        projectId: eventForm.projectId || undefined,
        attendees: eventForm.attendees,
        recurring: eventForm.recurring,
        color: undefined,
        recurrenceRule: undefined,
        recurrenceEnd: undefined,
      }

      if (selectedEvent) {
        await onUpdateEvent?.(selectedEvent.id, eventData)
      } else {
        await onCreateEvent?.(eventData)
      }

      setShowEventModal(false)
    } catch (error) {
      alert('Failed to save event')
    }
  }

  // Delete event
  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Delete this event?')) return

    try {
      await onDeleteEvent?.(eventId)
      setShowEventDetails(false)
      setShowEventModal(false)
    } catch (error) {
      alert('Failed to delete event')
    }
  }

  // View event details
  const viewEventDetails = (event: CalendarEvent) => {
    setSelectedEvent(event)
    setShowEventDetails(true)
  }

  const getProjectName = (projectId?: string) => {
    if (!projectId) return null
    return projects.find(p => p.id === projectId)?.name || 'Unknown Project'
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear()
  }

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth()
  }
  // CONTINUE FROM PART 1 - This is the return statement

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-[#0a0a0a] relative">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 md:p-4 bg-white dark:bg-[#111] border-b border-gray-200 dark:border-[#222] flex-shrink-0">
        <div className="flex items-center gap-4">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Calendar</h3>
          <div className="flex gap-1 bg-gray-100 dark:bg-[#1a1a1a] rounded-lg p-1">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                viewMode === 'month'
                  ? 'bg-white dark:bg-[#252525] text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                viewMode === 'week'
                  ? 'bg-white dark:bg-[#252525] text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                viewMode === 'day'
                  ? 'bg-white dark:bg-[#252525] text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              Day
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={goToPrevious}
              className="p-2 hover:bg-gray-100 dark:hover:bg-[#1e1e1e] rounded transition-colors"
            >
              <span className="text-lg">‹</span>
            </button>
            <button
              onClick={goToToday}
              className="px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1e1e1e] rounded transition-colors"
            >
              Today
            </button>
            <button
              onClick={goToNext}
              className="p-2 hover:bg-gray-100 dark:hover:bg-[#1e1e1e] rounded transition-colors"
            >
              <span className="text-lg">›</span>
            </button>
          </div>

          <div className="text-lg font-semibold text-gray-900 dark:text-gray-100 min-w-[120px] md:min-w-[200px] text-center">
            {formatDate(currentDate)}
          </div>

          <button
            onClick={() => openCreateEventModal()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors font-medium"
          >
            New Event
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto">
        {viewMode === 'month' && (
          <div className="p-4">
            {/* Month View */}
            <div className="bg-white dark:bg-[#111] rounded-lg border border-gray-200 dark:border-[#222] overflow-hidden">
              {/* Day headers */}
              <div className="grid grid-cols-7 border-b border-gray-200 dark:border-[#222]">
                {DAYS_OF_WEEK.map(day => (
                  <div
                    key={day}
                    className="p-3 text-center text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-[#1a1a1a]"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar days */}
              <div className="grid grid-cols-7">
                {Array.from({ length: 42 }, (_, i) => {
                  const date = new Date(viewPeriod.start)
                  date.setDate(date.getDate() + i)
                  const dayEvents = getEventsForDate(date)
                  const today = isToday(date)
                  const currentMonth = isCurrentMonth(date)

                  return (
                    <div
                      key={i}
                      className={`min-h-[70px] md:min-h-[120px] p-2 border-r border-b border-gray-200 dark:border-[#222] ${
                        !currentMonth ? 'bg-gray-50 dark:bg-[#111]/50' : ''
                      } hover:bg-gray-50 dark:hover:bg-[#1e1e1e]/50 transition-colors cursor-pointer`}
                      onClick={() => {
                        setSelectedDate(date)
                        openCreateEventModal(date)
                      }}
                    >
                      <div className={`text-sm font-medium mb-1 ${
                        today
                          ? 'bg-blue-600 text-white w-7 h-7 rounded-full flex items-center justify-center'
                          : currentMonth
                          ? 'text-gray-900 dark:text-gray-100'
                          : 'text-gray-400 dark:text-gray-600'
                      }`}>
                        {date.getDate()}
                      </div>

                      <div className="space-y-1">
                        {dayEvents.slice(0, 3).map(event => {
                          const typeInfo = EVENT_TYPES.find(t => t.value === event.type)
                          return (
                            <div
                              key={event.id}
                              className={`text-xs px-2 py-1 rounded ${typeInfo?.color} text-white truncate cursor-pointer hover:opacity-80`}
                              onClick={(e) => {
                                e.stopPropagation()
                                viewEventDetails(event)
                              }}
                            >
                              {event.allDay ? 'All day' : formatTime(event.startTime)} - {event.title}
                            </div>
                          )
                        })}
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 px-2">
                            +{dayEvents.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {viewMode === 'week' && (
          <div className="p-4">
            {/* Week View */}
            <div className="bg-white dark:bg-[#111] rounded-lg border border-gray-200 dark:border-[#222] overflow-hidden">
              {/* Day headers */}
              <div className="grid grid-cols-8 border-b border-gray-200 dark:border-[#222]">
                <div className="p-3 bg-gray-50 dark:bg-[#1a1a1a]"></div>
                {Array.from({ length: 7 }, (_, i) => {
                  const date = new Date(viewPeriod.start)
                  date.setDate(date.getDate() + i)
                  const today = isToday(date)

                  return (
                    <div
                      key={i}
                      className="p-3 text-center bg-gray-50 dark:bg-[#1a1a1a]"
                    >
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {DAYS_OF_WEEK[date.getDay()]}
                      </div>
                      <div className={`text-sm font-medium mt-1 ${
                        today
                          ? 'bg-blue-600 text-white w-7 h-7 rounded-full flex items-center justify-center mx-auto'
                          : 'text-gray-900 dark:text-gray-100'
                      }`}>
                        {date.getDate()}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Time slots */}
              <div className="grid grid-cols-8">
                {Array.from({ length: 24 }, (_, hour) => (
                  <React.Fragment key={hour}>
                    {/* Time label */}
                    <div className="p-2 text-xs text-gray-500 dark:text-gray-400 text-right border-r border-b border-gray-200 dark:border-[#222]">
                      {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                    </div>

                    {/* Day columns */}
                    {Array.from({ length: 7 }, (_, dayIndex) => {
                      const date = new Date(viewPeriod.start)
                      date.setDate(date.getDate() + dayIndex)
                      date.setHours(hour, 0, 0, 0)

                      const hourEvents = getEventsForDate(date).filter(event => {
                        const eventHour = new Date(event.startTime).getHours()
                        return eventHour === hour
                      })

                      return (
                        <div
                          key={dayIndex}
                          className="min-h-[40px] md:min-h-[60px] p-1 border-r border-b border-gray-200 dark:border-[#222] hover:bg-gray-50 dark:hover:bg-[#1e1e1e]/50 cursor-pointer"
                          onClick={() => {
                            setSelectedDate(date)
                            openCreateEventModal(date)
                          }}
                        >
                          {hourEvents.map(event => {
                            const typeInfo = EVENT_TYPES.find(t => t.value === event.type)
                            return (
                              <div
                                key={event.id}
                                className={`text-xs px-2 py-1 rounded ${typeInfo?.color} text-white truncate mb-1 cursor-pointer hover:opacity-80`}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  viewEventDetails(event)
                                }}
                              >
                                {formatTime(event.startTime)} {event.title}
                              </div>
                            )
                          })}
                        </div>
                      )
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        )}

        {viewMode === 'day' && (
          <div className="p-4">
            {/* Day View */}
            <div className="bg-white dark:bg-[#111] rounded-lg border border-gray-200 dark:border-[#222] overflow-hidden">
              <div className="grid grid-cols-2">
                {/* Time column */}
                <div>
                  {Array.from({ length: 24 }, (_, hour) => {
                    const hourEvents = getEventsForDate(currentDate).filter(event => {
                      const eventHour = new Date(event.startTime).getHours()
                      return eventHour === hour
                    })

                    return (
                      <div
                        key={hour}
                        className="flex border-b border-gray-200 dark:border-[#222]"
                      >
                        <div className="w-20 p-3 text-sm text-gray-500 dark:text-gray-400 text-right border-r border-gray-200 dark:border-[#222]">
                          {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                        </div>
                        <div className="flex-1 p-2 min-h-[50px] md:min-h-[80px] hover:bg-gray-50 dark:hover:bg-[#1e1e1e]/50 cursor-pointer">
                          {hourEvents.map(event => {
                            const typeInfo = EVENT_TYPES.find(t => t.value === event.type)
                            return (
                              <div
                                key={event.id}
                                className={`text-sm px-3 py-2 rounded ${typeInfo?.color} text-white mb-2 cursor-pointer hover:opacity-80`}
                                onClick={() => viewEventDetails(event)}
                              >
                                <div className="font-medium">{event.title}</div>
                                <div className="text-xs opacity-90">
                                  {formatTime(event.startTime)} - {formatTime(event.endTime)}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* All-day events */}
                <div className="border-l border-gray-200 dark:border-[#222] p-4">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">All Day Events</h4>
                  <div className="space-y-2">
                    {getEventsForDate(currentDate).filter(e => e.allDay).map(event => {
                      const typeInfo = EVENT_TYPES.find(t => t.value === event.type)
                      return (
                        <div
                          key={event.id}
                          className={`p-3 rounded ${typeInfo?.color} text-white cursor-pointer hover:opacity-80`}
                          onClick={() => viewEventDetails(event)}
                        >
                          <div className="font-medium">{event.title}</div>
                          {event.location && (
                            <div className="text-xs opacity-90 mt-1">{event.location}</div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Event Details Modal */}
      {showEventDetails && selectedEvent && (
        <div
          className="absolute inset-0 bg-black/50 z-50 overflow-y-auto"
          onClick={() => setShowEventDetails(false)}
        >
          <div className="min-h-full flex items-center justify-center p-4">
            <div
              className="bg-white dark:bg-[#1a1a1a] rounded-lg p-6 max-w-lg w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {selectedEvent.title}
                </h3>
                <button
                  onClick={() => setShowEventDetails(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <span className="text-2xl">×</span>
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-24 text-sm font-medium text-gray-600 dark:text-gray-400">
                    Type
                  </div>
                  <div>
                    <span className={`px-2 py-1 rounded text-xs text-white ${
                      EVENT_TYPES.find(t => t.value === selectedEvent.type)?.color
                    }`}>
                      {EVENT_TYPES.find(t => t.value === selectedEvent.type)?.label}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-24 text-sm font-medium text-gray-600 dark:text-gray-400">
                    When
                  </div>
                  <div className="text-sm text-gray-900 dark:text-gray-100">
                    {selectedEvent.allDay ? (
                      <>All day - {new Date(selectedEvent.startTime).toLocaleDateString()}</>
                    ) : (
                      <>
                        {new Date(selectedEvent.startTime).toLocaleDateString()}<br />
                        {formatTime(selectedEvent.startTime)} - {formatTime(selectedEvent.endTime)}
                      </>
                    )}
                  </div>
                </div>

                {selectedEvent.location && (
                  <div className="flex items-start gap-3">
                    <div className="w-24 text-sm font-medium text-gray-600 dark:text-gray-400">
                      Location
                    </div>
                    <div className="text-sm text-gray-900 dark:text-gray-100">
                      {selectedEvent.location}
                    </div>
                  </div>
                )}

                {selectedEvent.description && (
                  <div className="flex items-start gap-3">
                    <div className="w-24 text-sm font-medium text-gray-600 dark:text-gray-400">
                      Description
                    </div>
                    <div className="text-sm text-gray-900 dark:text-gray-100">
                      {selectedEvent.description}
                    </div>
                  </div>
                )}

                {selectedEvent.projectId && (
                  <div className="flex items-start gap-3">
                    <div className="w-24 text-sm font-medium text-gray-600 dark:text-gray-400">
                      Project
                    </div>
                    <div className="text-sm text-gray-900 dark:text-gray-100">
                      {getProjectName(selectedEvent.projectId)}
                    </div>
                  </div>
                )}

                {selectedEvent.attendees.length > 0 && (
                  <div className="flex items-start gap-3">
                    <div className="w-24 text-sm font-medium text-gray-600 dark:text-gray-400">
                      Attendees
                    </div>
                    <div className="text-sm text-gray-900 dark:text-gray-100">
                      {selectedEvent.attendees.join(', ')}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => openEditEventModal(selectedEvent)}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteEvent(selectedEvent.id)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Event Form Modal */}
      {showEventModal && (
        <div
          className="absolute inset-0 bg-black/50 z-50 overflow-y-auto"
          onClick={() => setShowEventModal(false)}
        >
          <div className="min-h-full flex items-center justify-center p-4">
            <div
              className="bg-white dark:bg-[#1a1a1a] rounded-lg p-6 max-w-2xl w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
                {selectedEvent ? 'Edit Event' : 'New Event'}
              </h3>

              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={eventForm.title}
                    onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#333] rounded-lg bg-white dark:bg-[#252525] text-gray-900 dark:text-gray-100"
                    placeholder="Event title"
                  />
                </div>

                {/* Type and Project */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Type
                    </label>
                    <select
                      value={eventForm.type}
                      onChange={(e) => setEventForm({ ...eventForm, type: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-[#333] rounded-lg bg-white dark:bg-[#252525] text-gray-900 dark:text-gray-100"
                    >
                      {EVENT_TYPES.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Project (Optional)
                    </label>
                    <select
                      value={eventForm.projectId}
                      onChange={(e) => setEventForm({ ...eventForm, projectId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-[#333] rounded-lg bg-white dark:bg-[#252525] text-gray-900 dark:text-gray-100"
                    >
                      <option value="">None</option>
                      {projects.map(project => (
                        <option key={project.id} value={project.id}>{project.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* All Day Toggle */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="all-day"
                    checked={eventForm.allDay}
                    onChange={(e) => setEventForm({ ...eventForm, allDay: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="all-day" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    All day event
                  </label>
                </div>

                {/* Date and Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={eventForm.startDate}
                      onChange={(e) => setEventForm({ ...eventForm, startDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-[#333] rounded-lg bg-white dark:bg-[#252525] text-gray-900 dark:text-gray-100"
                    />
                  </div>

                  {!eventForm.allDay && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={eventForm.startTime}
                        onChange={(e) => setEventForm({ ...eventForm, startTime: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-[#333] rounded-lg bg-white dark:bg-[#252525] text-gray-900 dark:text-gray-100"
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={eventForm.endDate}
                      onChange={(e) => setEventForm({ ...eventForm, endDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-[#333] rounded-lg bg-white dark:bg-[#252525] text-gray-900 dark:text-gray-100"
                    />
                  </div>

                  {!eventForm.allDay && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        End Time
                      </label>
                      <input
                        type="time"
                        value={eventForm.endTime}
                        onChange={(e) => setEventForm({ ...eventForm, endTime: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-[#333] rounded-lg bg-white dark:bg-[#252525] text-gray-900 dark:text-gray-100"
                      />
                    </div>
                  )}
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Location (Optional)
                  </label>
                  <input
                    type="text"
                    value={eventForm.location}
                    onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#333] rounded-lg bg-white dark:bg-[#252525] text-gray-900 dark:text-gray-100"
                    placeholder="Meeting room, address, etc."
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={eventForm.description}
                    onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#333] rounded-lg bg-white dark:bg-[#252525] text-gray-900 dark:text-gray-100"
                    placeholder="Event details..."
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowEventModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-[#333] rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEvent}
                  disabled={!eventForm.title}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {selectedEvent ? 'Save Changes' : 'Create Event'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
