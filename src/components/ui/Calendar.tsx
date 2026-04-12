'use client'

import { useState, useMemo } from 'react'

export type CalendarView = 'month' | 'week' | 'day'

export interface CalendarEvent {
  id: string
  title: string
  date: string // YYYY-MM-DD
  time?: string // HH:MM
  endTime?: string // HH:MM
  type: 'meeting' | 'deadline' | 'milestone'
  color?: string
  projectId?: string
}

interface CalendarProps {
  events: CalendarEvent[]
  onDateClick: (date: string) => void
  onEventClick: (event: CalendarEvent) => void
  view?: CalendarView
  selectedDate?: Date
}

export default function Calendar({
  events = [],
  onDateClick,
  onEventClick,
  view = 'month',
  selectedDate = new Date()
}: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(selectedDate)
  const [currentView, setCurrentView] = useState<CalendarView>(view)

  // Helper functions
  const getMonthData = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay()) // Start from Sunday
    
    const days: Date[] = []
    const currentDay = new Date(startDate)
    
    // Generate 6 weeks (42 days)
    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDay))
      currentDay.setDate(currentDay.getDate() + 1)
    }
    
    return { days, firstDay, lastDay }
  }

  const getWeekData = (date: Date) => {
    const startOfWeek = new Date(date)
    startOfWeek.setDate(date.getDate() - date.getDay())
    
    const days: Date[] = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek)
      day.setDate(startOfWeek.getDate() + i)
      days.push(day)
    }
    
    return days
  }

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0]
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return formatDate(date) === formatDate(today)
  }

  const isSameMonth = (date: Date, referenceDate: Date) => {
    return date.getMonth() === referenceDate.getMonth()
  }

  const getEventsForDate = (date: Date) => {
    const dateStr = formatDate(date)
    return events.filter(event => event.date === dateStr)
  }

  const getEventColor = (event: CalendarEvent) => {
    if (event.color) return event.color
    
    switch (event.type) {
      case 'meeting':
        return 'bg-blue-500'
      case 'deadline':
        return 'bg-red-500'
      case 'milestone':
        return 'bg-green-500'
      default:
        return 'bg-gray-500'
    }
  }

  // Navigation
  const goToPrevious = () => {
    const newDate = new Date(currentDate)
    if (currentView === 'month') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else if (currentView === 'week') {
      newDate.setDate(newDate.getDate() - 7)
    } else {
      newDate.setDate(newDate.getDate() - 1)
    }
    setCurrentDate(newDate)
  }

  const goToNext = () => {
    const newDate = new Date(currentDate)
    if (currentView === 'month') {
      newDate.setMonth(newDate.getMonth() + 1)
    } else if (currentView === 'week') {
      newDate.setDate(newDate.getDate() + 7)
    } else {
      newDate.setDate(newDate.getDate() + 1)
    }
    setCurrentDate(newDate)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const getHeaderText = () => {
    if (currentView === 'month') {
      return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    } else if (currentView === 'week') {
      const weekData = getWeekData(currentDate)
      const start = weekData[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      const end = weekData[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      return `${start} - ${end}`
    } else {
      return currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    }
  }

  // Render functions
  const renderMonthView = () => {
    const { days } = getMonthData(currentDate)
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    return (
      <div>
        {/* Week day headers */}
        <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-[#2a2a2a] mb-px">
          {weekDays.map(day => (
            <div key={day} className="bg-gray-50 dark:bg-[#222222] py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-[#2a2a2a]">
          {days.map((day, index) => {
            const dayEvents = getEventsForDate(day)
            const isCurrentMonth = isSameMonth(day, currentDate)
            const isTodayDate = isToday(day)

            return (
              <div
                key={index}
                onClick={() => onDateClick(formatDate(day))}
                className={`min-h-24 bg-white dark:bg-[#1a1a1a] p-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#222222] transition-colors ${
                  !isCurrentMonth ? 'opacity-40' : ''
                }`}
              >
                <div className={`text-sm font-medium mb-1 ${
                  isTodayDate 
                    ? 'flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white' 
                    : isCurrentMonth
                    ? 'text-gray-900 dark:text-gray-100'
                    : 'text-gray-400 dark:text-gray-600'
                }`}>
                  {day.getDate()}
                </div>
                
                {/* Events */}
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map(event => (
                    <button
                      key={event.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        onEventClick(event)
                      }}
                      className={`w-full text-left px-1.5 py-0.5 rounded text-xs font-medium text-white ${getEventColor(event)} hover:opacity-80 transition-opacity truncate`}
                    >
                      {event.time && <span className="mr-1">{event.time}</span>}
                      {event.title}
                    </button>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 px-1.5">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderWeekView = () => {
    const weekData = getWeekData(currentDate)
    const hours = Array.from({ length: 24 }, (_, i) => i)

    return (
      <div className="flex flex-col h-full overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-8 gap-px bg-gray-200 dark:bg-[#2a2a2a] mb-px">
          <div className="bg-gray-50 dark:bg-[#222222] p-2 text-xs font-medium text-gray-500 dark:text-gray-400">
            Time
          </div>
          {weekData.map(day => {
            const isTodayDate = isToday(day)
            return (
              <div
                key={day.toISOString()}
                className={`bg-gray-50 dark:bg-[#222222] p-2 text-center ${
                  isTodayDate ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
              >
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {day.toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div className={`text-sm font-semibold ${
                  isTodayDate 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-gray-900 dark:text-gray-100'
                }`}>
                  {day.getDate()}
                </div>
              </div>
            )
          })}
        </div>

        {/* Time grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-8 gap-px bg-gray-200 dark:bg-[#2a2a2a]">
            {hours.map(hour => (
              <div key={hour} className="contents">
                <div className="bg-white dark:bg-[#1a1a1a] p-2 text-xs text-gray-500 dark:text-gray-400 text-right">
                  {hour.toString().padStart(2, '0')}:00
                </div>
                {weekData.map(day => {
                  const dayEvents = getEventsForDate(day).filter(event => {
                    if (!event.time) return false
                    const eventHour = parseInt(event.time.split(':')[0])
                    return eventHour === hour
                  })

                  return (
                    <div
                      key={`${day.toISOString()}-${hour}`}
                      onClick={() => onDateClick(formatDate(day))}
                      className="bg-white dark:bg-[#1a1a1a] p-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#222222] transition-colors min-h-12"
                    >
                      {dayEvents.map(event => (
                        <button
                          key={event.id}
                          onClick={(e) => {
                            e.stopPropagation()
                            onEventClick(event)
                          }}
                          className={`w-full text-left px-1.5 py-1 rounded text-xs font-medium text-white ${getEventColor(event)} hover:opacity-80 transition-opacity mb-1`}
                        >
                          <div className="font-semibold">{event.time}</div>
                          <div className="truncate">{event.title}</div>
                        </button>
                      ))}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const renderDayView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i)
    const dayEvents = getEventsForDate(currentDate)

    return (
      <div className="flex flex-col h-full overflow-hidden">
        {/* Day header */}
        <div className="bg-gray-50 dark:bg-[#222222] p-4 mb-2">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {currentDate.toLocaleDateString('en-US', { weekday: 'long' })}
          </div>
          <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            {currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
          </div>
        </div>

        {/* Time slots */}
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-px">
            {hours.map(hour => {
              const hourEvents = dayEvents.filter(event => {
                if (!event.time) return false
                const eventHour = parseInt(event.time.split(':')[0])
                return eventHour === hour
              })

              return (
                <div key={hour} className="flex bg-gray-200 dark:bg-[#2a2a2a] gap-px">
                  <div className="w-20 bg-white dark:bg-[#1a1a1a] p-3 text-sm text-gray-500 dark:text-gray-400 text-right">
                    {hour.toString().padStart(2, '0')}:00
                  </div>
                  <div className="flex-1 bg-white dark:bg-[#1a1a1a] p-3 min-h-16">
                    {hourEvents.map(event => (
                      <button
                        key={event.id}
                        onClick={() => onEventClick(event)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-white ${getEventColor(event)} hover:opacity-80 transition-opacity mb-2`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold">{event.time}</span>
                          {event.endTime && <span>- {event.endTime}</span>}
                        </div>
                        <div>{event.title}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header with controls */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200 dark:border-[#2a2a2a]">
        <div className="flex items-center gap-3">
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-[#222222] hover:bg-gray-200 dark:hover:bg-[#2a2a2a] rounded-lg transition-colors"
          >
            Today
          </button>
          
          <div className="flex items-center gap-1">
            <button
              onClick={goToPrevious}
              className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#222222] rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={goToNext}
              className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#222222] rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {getHeaderText()}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentView('month')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              currentView === 'month'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#222222]'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setCurrentView('week')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              currentView === 'week'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#222222]'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setCurrentView('day')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              currentView === 'day'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#222222]'
            }`}
          >
            Day
          </button>
        </div>
      </div>

      {/* Calendar content */}
      <div className="flex-1 overflow-hidden">
        {currentView === 'month' && renderMonthView()}
        {currentView === 'week' && renderWeekView()}
        {currentView === 'day' && renderDayView()}
      </div>
    </div>
  )
}