'use client'

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { TeamMember } from '@/types'
import { Message, MessageAttachment } from '@/types/data'

export function useTeam(userId: string | undefined, orgId?: string | null) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [messages, setMessages] = useState<Message[]>([])

  const loadTeamMembers = useCallback(async () => {
    if (!userId) return []

    const { data: teamData } = await supabase
      .from('team_members')
      .select('*')
      .eq(orgId ? 'org_id' : 'user_id', orgId || userId!)

    const transformed = (teamData || []) as TeamMember[]
    setTeamMembers(transformed)
    return transformed
  }, [userId])

  const loadMessages = useCallback(async () => {
    if (!userId) return

    const { data: messagesData } = await supabase
      .from('messages')
      .select(`*, message_attachments (id, file_name, storage_path, file_type, file_size, uploaded_at)`)
      .eq(orgId ? 'org_id' : 'user_id', orgId || userId!)
      .order('created_at', { ascending: false })

    const transformed: Message[] = (messagesData || []).map((m: any) => {
      const attachments = (m.message_attachments || []).map((att: any) => {
        const { data: { publicUrl } } = supabase.storage
          .from('documents')
          .getPublicUrl(att.storage_path)

        return {
          id: att.id,
          fileName: att.file_name,
          fileUrl: publicUrl,
          fileType: att.file_type,
          fileSize: att.file_size,
          uploadedAt: att.uploaded_at,
        }
      })

      return {
        id: m.id,
        projectId: m.project_id,
        branchId: m.branch_id,
        senderName: m.sender_name,
        content: m.content,
        attachments,
        createdAt: m.created_at,
        updatedAt: m.updated_at,
      }
    })

    setMessages(transformed)
  }, [userId])

  const createTeamMember = useCallback(async (data: { name: string; email: string; phone?: string; role: string }) => {
    if (!userId) throw new Error('Not authenticated')

    // Check plan limits and send invite via API
    const inviteRes = await fetch('/api/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, memberName: data.name, memberEmail: data.email, memberRole: data.role }),
    })
    const inviteData = await inviteRes.json()
    if (!inviteRes.ok) {
      throw new Error(inviteData.error || 'Failed to invite team member')
    }

    const { data: newMember, error } = await supabase
      .from('team_members')
      .insert([{ user_id: userId, org_id: orgId || undefined, name: data.name, email: data.email, phone: data.phone, role: data.role }])
      .select()
      .single()

    if (error) throw error
    setTeamMembers(prev => [newMember as TeamMember, ...prev])
    return newMember as TeamMember
  }, [userId])

  const deleteTeamMember = useCallback(async (id: string) => {
    const { error } = await supabase.from('team_members').delete().eq('id', id)
    if (error) throw error
    setTeamMembers(prev => prev.filter(m => m.id !== id))
  }, [])

  const updateTeamMember = useCallback(async (id: string, data: { name?: string; email?: string; phone?: string; role?: string }) => {
    const updates: Record<string, any> = {}
    if (data.name !== undefined) updates.name = data.name
    if (data.email !== undefined) updates.email = data.email
    if (data.phone !== undefined) updates.phone = data.phone
    if (data.role !== undefined) updates.role = data.role

    const { data: updated, error } = await supabase
      .from('team_members')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    setTeamMembers(prev => prev.map(m => m.id === id ? { ...m, ...updated } as TeamMember : m))
    return updated
  }, [])

  const assignTeamMemberToProject = useCallback(async (projectId: string, memberId: string, roleInProject?: string) => {
    if (!userId) throw new Error('Not authenticated')

    const { data: existing } = await supabase
      .from('project_team')
      .select('id')
      .eq('project_id', projectId)
      .eq('team_member_id', memberId)
      .single()

    if (existing) return

    const { error } = await supabase
      .from('project_team')
      .insert([{ project_id: projectId, team_member_id: memberId, role_in_project: roleInProject }])

    if (error) throw error
  }, [userId])

  const removeTeamMemberFromProject = useCallback(async (projectId: string, memberId: string) => {
    const { error } = await supabase
      .from('project_team')
      .delete()
      .eq('project_id', projectId)
      .eq('team_member_id', memberId)

    if (error) throw error
  }, [])

  const createMessage = useCallback(async (data: { projectId?: string; branchId?: string; content: string }) => {
    if (!userId) throw new Error('Not authenticated')

    const { data: { user } } = await supabase.auth.getUser()

    const { data: newMessage, error } = await supabase
      .from('messages')
      .insert([{
        user_id: userId,
        org_id: orgId || undefined,
        project_id: data.projectId,
        branch_id: data.branchId,
        sender_name: user?.email || 'Unknown User',
        content: data.content,
      }])
      .select()
      .single()

    if (error) throw error
    setMessages(prev => [{ ...newMessage, attachments: [] } as Message, ...prev])
    return newMessage
  }, [userId])

  const deleteMessage = useCallback(async (id: string) => {
    const { error } = await supabase.from('messages').delete().eq('id', id)
    if (error) throw error
    setMessages(prev => prev.filter(m => m.id !== id))
  }, [])

  const uploadMessageAttachment = useCallback(async (messageId: string, file: File, refetch: () => Promise<void>) => {
    if (!userId) throw new Error('Not authenticated')

    const timestamp = Date.now()
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const storagePath = `messages/${userId}/${messageId}/${timestamp}_${sanitizedName}`

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(storagePath, file)

    if (uploadError) throw uploadError

    const { error: dbError } = await supabase
      .from('message_attachments')
      .insert([{
        message_id: messageId,
        file_name: file.name,
        storage_path: storagePath,
        file_type: file.type,
        file_size: file.size,
      }])

    if (dbError) throw dbError
    await refetch()
  }, [userId])

  return {
    teamMembers,
    messages,
    setTeamMembers,
    setMessages,
    loadTeamMembers,
    loadMessages,
    createTeamMember,
    updateTeamMember,
    deleteTeamMember,
    assignTeamMemberToProject,
    removeTeamMemberFromProject,
    createMessage,
    deleteMessage,
    uploadMessageAttachment,
  }
}
