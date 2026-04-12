'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { useRoles, UserRole, ROLE_LABELS } from '@/hooks/useRoles'
import { Users, Shield, Clock, UserMinus, ChevronDown, Check, AlertCircle, Crown, Mail } from 'lucide-react'

interface OrgMember {
  id: string
  org_id: string
  user_id: string | null
  email: string
  name: string
  role: UserRole
  status: 'active' | 'pending' | 'deactivated'
  joined_at: string | null
  created_at: string
}

interface OrgMembersPanelProps {
  orgId: string | null
  isOnline?: (userId: string) => boolean
}

export default function OrgMembersPanel({ orgId, isOnline }: OrgMembersPanelProps) {
  const { user } = useAuth()
  const { role: myRole, can, setMemberRole } = useRoles()
  const [members, setMembers] = useState<OrgMember[]>([])
  const [loading, setLoading] = useState(true)
  const [editingRole, setEditingRole] = useState<string | null>(null)
  const [actionError, setActionError] = useState('')
  const [actionSuccess, setActionSuccess] = useState('')

  const canEditRoles = can('team', 'editRoles')
  const canRemove = can('team', 'remove')

  const loadMembers = useCallback(async () => {
    if (!orgId) return
    setLoading(true)
    const { data } = await supabase
      .from('org_members')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: true })

    if (data) setMembers(data as OrgMember[])
    setLoading(false)
  }, [orgId])

  useEffect(() => { loadMembers() }, [loadMembers])

  const handleChangeRole = async (memberId: string, newRole: UserRole) => {
    setActionError('')
    try {
      await setMemberRole(memberId, newRole)
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole } : m))
      setEditingRole(null)
      setActionSuccess('Role updated')
      setTimeout(() => setActionSuccess(''), 2000)
    } catch (err: any) {
      setActionError(err.message || 'Failed to change role')
    }
  }

  const handleDeactivate = async (member: OrgMember) => {
    if (member.user_id === user?.id) return
    if (member.role === 'owner') { setActionError('Cannot deactivate the owner'); return }

    const newStatus = member.status === 'deactivated' ? 'active' : 'deactivated'
    const { error } = await supabase
      .from('org_members')
      .update({ status: newStatus })
      .eq('id', member.id)

    if (error) { setActionError('Failed to update status'); return }
    setMembers(prev => prev.map(m => m.id === member.id ? { ...m, status: newStatus as any } : m))
    setActionSuccess(newStatus === 'deactivated' ? 'Member deactivated' : 'Member reactivated')
    setTimeout(() => setActionSuccess(''), 2000)
  }

  const handleRemove = async (member: OrgMember) => {
    if (member.user_id === user?.id) return
    if (member.role === 'owner') { setActionError('Cannot remove the owner'); return }
    if (!confirm(`Remove ${member.name || member.email} from the team? This cannot be undone.`)) return

    const { error } = await supabase.from('org_members').delete().eq('id', member.id)
    if (error) { setActionError('Failed to remove member'); return }
    setMembers(prev => prev.filter(m => m.id !== member.id))
    setActionSuccess('Member removed')
    setTimeout(() => setActionSuccess(''), 2000)
  }

  const formatDate = (d: string | null) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const activeCount = members.filter(m => m.status === 'active').length
  const pendingCount = members.filter(m => m.status === 'pending').length

  const ROLES: UserRole[] = ['owner', 'admin', 'manager', 'supervisor', 'worker', 'viewer']

  return (
    <div className="space-y-4">
      {/* Header stats */}
      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {activeCount} active</span>
        {pendingCount > 0 && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {pendingCount} pending</span>}
      </div>

      {/* Status messages */}
      {actionError && (
        <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 px-3 py-2 rounded-lg">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {actionError}
          <button onClick={() => setActionError('')} className="ml-auto text-red-400 hover:text-red-600">×</button>
        </div>
      )}
      {actionSuccess && (
        <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 px-3 py-2 rounded-lg">
          <Check className="w-3.5 h-3.5" /> {actionSuccess}
        </div>
      )}

      {/* Members list */}
      {loading ? (
        <div className="py-8 text-center text-sm text-gray-400">Loading members...</div>
      ) : (
        <div className="space-y-1">
          {members.map(member => {
            const isMe = member.user_id === user?.id
            const isOwner = member.role === 'owner'
            const roleInfo = ROLE_LABELS[member.role as UserRole] || ROLE_LABELS.worker

            return (
              <div key={member.id}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${
                  member.status === 'deactivated' ? 'opacity-50' : ''
                } hover:bg-gray-50 dark:hover:bg-[#1a1a1a]`}>

                {/* Avatar */}
                <div className="relative">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    member.status === 'pending' ? 'bg-gray-200 dark:bg-[#333] text-gray-400' :
                    isOwner ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
                    'bg-gray-100 dark:bg-[#222] text-gray-600 dark:text-gray-300'
                  }`}>
                    {isOwner ? <Crown className="w-4 h-4" /> : (member.name?.[0] || member.email[0]).toUpperCase()}
                  </div>
                  {member.user_id && isOnline?.(member.user_id) && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-[#111]" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {member.name || member.email.split('@')[0]}
                    </span>
                    {isMe && <span className="text-[9px] font-medium text-gray-400 bg-gray-100 dark:bg-[#222] px-1.5 py-0.5 rounded">You</span>}
                    {member.status === 'pending' && (
                      <span className="text-[9px] font-medium text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <Mail className="w-2.5 h-2.5" /> Invited
                      </span>
                    )}
                    {member.status === 'deactivated' && (
                      <span className="text-[9px] font-medium text-red-500 bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded">Deactivated</span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400 truncate">{member.email}</p>
                </div>

                {/* Role badge / dropdown */}
                <div className="relative">
                  {canEditRoles && !isMe && !isOwner ? (
                    <button
                      onClick={() => setEditingRole(editingRole === member.id ? null : member.id)}
                      className={`px-2.5 py-1 text-[10px] font-semibold rounded-lg flex items-center gap-1 transition-colors ${roleInfo.color}`}>
                      {roleInfo.label} <ChevronDown className="w-3 h-3" />
                    </button>
                  ) : (
                    <span className={`px-2.5 py-1 text-[10px] font-semibold rounded-lg ${roleInfo.color}`}>
                      {roleInfo.label}
                    </span>
                  )}

                  {/* Role dropdown */}
                  {editingRole === member.id && (
                    <>
                      <div className="fixed inset-0 z-[60]" onClick={() => setEditingRole(null)} />
                      <div className="absolute right-0 top-full mt-1 z-[70] w-56 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-xl shadow-xl overflow-hidden">
                        {ROLES.filter(r => r !== 'owner' || myRole === 'owner').map(r => {
                          const ri = ROLE_LABELS[r]
                          const selected = member.role === r
                          return (
                            <button key={r} onClick={() => handleChangeRole(member.id, r)}
                              className={`w-full text-left px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-[#222] transition-colors flex items-start gap-2.5 ${selected ? 'bg-gray-50 dark:bg-[#222]' : ''}`}>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">{ri.label}</span>
                                  {selected && <Check className="w-3 h-3 text-green-500" />}
                                </div>
                                <p className="text-[10px] text-gray-400 mt-0.5">{ri.description}</p>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </>
                  )}
                </div>

                {/* Actions */}
                {canRemove && !isMe && !isOwner && (
                  <div className="flex gap-1">
                    <button onClick={() => handleDeactivate(member)}
                      title={member.status === 'deactivated' ? 'Reactivate' : 'Deactivate'}
                      className="p-1.5 text-gray-300 hover:text-amber-500 dark:text-gray-600 dark:hover:text-amber-400 rounded-lg transition-colors">
                      <Shield className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleRemove(member)}
                      title="Remove from team"
                      className="p-1.5 text-gray-300 hover:text-red-500 dark:text-gray-600 dark:hover:text-red-400 rounded-lg transition-colors">
                      <UserMinus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Join date */}
                <span className="text-[10px] text-gray-300 dark:text-gray-600 hidden md:block w-20 text-right">
                  {member.status === 'pending' ? 'Invited' : formatDate(member.joined_at || member.created_at)}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
