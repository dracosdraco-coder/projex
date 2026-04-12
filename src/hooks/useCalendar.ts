'use client'

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { CalendarEvent } from '@/types/data'

export function useCalendar(userId: string | undefined, orgId?: string | null) {
  const [events, setEvents] = useState<CalendarEvent[]>([])

  const loadEvents = useCallback(async () => {
    if (!userId) return

    const { data: eventsData, error } = await supabase
      .from('events')
      .select('*')
      .eq(orgId ? 'org_id' : 'user_id', orgId || userId!)
      .order('start_time', { ascending: true })

    if (error) throw error

    const transformed: CalendarEvent[] = (eventsData || []).map((event: any) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      location: event.location,
      startTime: event.start_time,
      endTime: event.end_time,
      allDay: event.all_day,
      type: event.type,
      projectId: event.project_id,
      attendees: JSON.parse(event.attendees || '[]'),
      recurring: event.recurring,
      recurrenceRule: event.recurrence_rule,
      recurrenceEnd: event.recurrence_end,
      color: event.color,
      createdAt: event.created_at,
      updatedAt: event.updated_at,
    }))

    setEvents(transformed)
  }, [userId])

  const createEvent = useCallback(async (eventData: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('events')
      .insert([{
        user_id: user.id,
        title: eventData.title,
        description: eventData.description,
        location: eventData.location,
        start_time: eventData.startTime,
        end_time: eventData.endTime,
        all_day: eventData.allDay,
        type: eventData.type,
        project_id: eventData.projectId || null,
        attendees: JSON.stringify(eventData.attendees),
        recurring: eventData.recurring,
        recurrence_rule: eventData.recurrenceRule,
        recurrence_end: eventData.recurrenceEnd,
        color: eventData.color,
      }])
      .select()
      .single()

    if (error) throw error

    const newEvent: CalendarEvent = {
      id: data.id,
      title: data.title,
      description: data.description,
      location: data.location,
      startTime: data.start_time,
      endTime: data.end_time,
      allDay: data.all_day,
      type: data.type,
      projectId: data.project_id,
      attendees: JSON.parse(data.attendees || '[]'),
      recurring: data.recurring,
      recurrenceRule: data.recurrence_rule,
      recurrenceEnd: data.recurrence_end,
      color: data.color,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }

    setEvents(prev => [newEvent, ...prev])
  }, [])

  const updateEvent = useCallback(async (eventId: string, updates: Partial<CalendarEvent>) => {
    const updateData: any = {}
    if (updates.title !== undefined) updateData.title = updates.title
    if (updates.description !== undefined) updateData.description = updates.description
    if (updates.location !== undefined) updateData.location = updates.location
    if (updates.startTime !== undefined) updateData.start_time = updates.startTime
    if (updates.endTime !== undefined) updateData.end_time = updates.endTime
    if (updates.allDay !== undefined) updateData.all_day = updates.allDay
    if (updates.type !== undefined) updateData.type = updates.type
    if (updates.projectId !== undefined) updateData.project_id = updates.projectId
    if (updates.attendees !== undefined) updateData.attendees = JSON.stringify(updates.attendees)
    if (updates.recurring !== undefined) updateData.recurring = updates.recurring
    if (updates.recurrenceRule !== undefined) updateData.recurrence_rule = updates.recurrenceRule
    if (updates.recurrenceEnd !== undefined) updateData.recurrence_end = updates.recurrenceEnd
    if (updates.color !== undefined) updateData.color = updates.color

    const { data, error } = await supabase
      .from('events')
      .update(updateData)
      .eq('id', eventId)
      .select()
      .single()

    if (error) throw error

    setEvents(prev => prev.map(event =>
      event.id === eventId ? { ...event, ...updates, updatedAt: data.updated_at } : event
    ))
  }, [])

  const deleteEvent = useCallback(async (eventId: string) => {
    const { error } = await supabase.from('events').delete().eq('id', eventId)
    if (error) throw error
    setEvents(prev => prev.filter(event => event.id !== eventId))
  }, [])

  return {
    events,
    setEvents,
    loadEvents,
    createEvent,
    updateEvent,
    deleteEvent,
  }
}
