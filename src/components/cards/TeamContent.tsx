'use client'

import { useState, useMemo } from 'react'
import { Users, Plus, X, Mail, Phone, Trash2, Edit, Search, Shield, UserPlus, BookUser, ChevronRight, Building2, MapPin, Star, Copy, Check } from 'lucide-react'
import OrgMembersPanel from '@/components/OrgMembersPanel'

interface TeamMember { id: string; name: string; email?: string; phone?: string; role: string; createdAt: string }
interface Contact { id: string; name: string; email?: string; phone?: string; company?: string; address?: string; notes?: string; type: string }
interface Project { id: string; name: string; client?: string; team?: TeamMember[] }

interface TeamContentProps {
  teamMembers: TeamMember[]
  projects: Project[]
  contacts?: Contact[]
  orgId?: string | null
  isOnline?: (userId: string) => boolean
  onCreateMember: (data: any) => Promise<any>
  onUpdateMember?: (id: string, data: any) => Promise<void>
  onDeleteMember: (id: string) => Promise<void>
  onAssignToProject: (projectId: string, memberId: string) => Promise<void>
  onRemoveFromProject: (projectId: string, memberId: string) => Promise<void>
  onCreateContact?: (data: any) => Promise<any>
  onUpdateContact?: (id: string, data: any) => Promise<void>
  onDeleteContact?: (id: string) => Promise<void>
}

const ROLES = [
  { value: 'owner', label: 'Owner', desc: 'Full access to everything', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
  { value: 'admin', label: 'Admin', desc: 'Manage team, projects, billing', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  { value: 'manager', label: 'Manager', desc: 'Create & edit projects, tasks, docs', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  { value: 'supervisor', label: 'Supervisor', desc: 'Edit projects, assign tasks', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
  { value: 'worker', label: 'Worker', desc: 'View & complete assigned tasks', color: 'bg-gray-100 text-gray-800 dark:bg-[#252525] dark:text-gray-300' },
  { value: 'viewer', label: 'Viewer', desc: 'Read-only access', color: 'bg-gray-50 text-gray-600 dark:bg-[#1a1a1a] dark:text-gray-400' },
]

const CONTACT_TYPES = ['Client', 'Vendor', 'Subcontractor', 'Inspector', 'Supplier', 'Architect', 'Other']

export default function TeamContent({
  teamMembers, projects, contacts = [], orgId, isOnline, onCreateMember, onUpdateMember, onDeleteMember,
  onAssignToProject, onRemoveFromProject, onCreateContact, onUpdateContact, onDeleteContact,
}: TeamContentProps) {
  const [tab, setTab] = useState<'members' | 'contacts' | 'roles'>('members')
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [showContactForm, setShowContactForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [editingContact, setEditingContact] = useState<any>(null)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [selectedMember, setSelectedMember] = useState<string | null>(null)
  const [copiedEmail, setCopiedEmail] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: 'worker' })
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', company: '', address: '', notes: '', type: 'Client' })
  const [inviteEmail, setInviteEmail] = useState('')
  const [showInvite, setShowInvite] = useState(false)
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [inviteSuccess, setInviteSuccess] = useState(false)

  const getRoleInfo = (r: string) => ROLES.find(role => role.value === r) || ROLES[4]

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    if (tab === 'members') return teamMembers.filter(m => m.name.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q))
    if (tab === 'contacts') return contacts.filter(c => c.name.toLowerCase().includes(q) || c.company?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q))
    return teamMembers
  }, [tab, search, teamMembers, contacts])

  const handleSubmitMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editing) { await onUpdateMember?.(editing.id, form); setEditing(null) }
    else await onCreateMember(form)
    setForm({ name: '', email: '', phone: '', role: 'worker' }); setShowAdd(false)
  }

  const handleSubmitContact = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingContact) { await onUpdateContact?.(editingContact.id, contactForm); setEditingContact(null) }
    else await onCreateContact?.(contactForm)
    setContactForm({ name: '', email: '', phone: '', company: '', address: '', notes: '', type: 'Client' }); setShowContactForm(false)
  }

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return
    setInviting(true)
    setInviteError('')
    setInviteSuccess(false)
    try {
      await onCreateMember({ name: inviteEmail.split('@')[0], email: inviteEmail.trim(), role: 'worker' })
      setInviteSuccess(true)
      setInviteEmail('')
      setTimeout(() => { setShowInvite(false); setInviteSuccess(false) }, 1500)
    } catch (err: any) {
      setInviteError(err.message || 'Failed to invite')
    } finally {
      setInviting(false)
    }
  }

  const copyEmail = (email: string) => {
    navigator.clipboard.writeText(email); setCopiedEmail(true)
    setTimeout(() => setCopiedEmail(false), 1500)
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-[#111]">
      {/* Header */}
      <div className="bg-white dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-[#2a2a2a] px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Team & Contacts</h2>
          </div>
          <div className="flex gap-2">
            {tab === 'members' && (
              <>
                <button onClick={() => setShowInvite(true)} className="px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 flex items-center gap-1.5">
                  <UserPlus className="w-3.5 h-3.5" /> Invite
                </button>
                <button onClick={() => { setEditing(null); setForm({ name: '', email: '', phone: '', role: 'worker' }); setShowAdd(true) }}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-gray-900 dark:bg-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" /> Add Member
                </button>
              </>
            )}
            {tab === 'contacts' && (
              <button onClick={() => { setEditingContact(null); setContactForm({ name: '', email: '', phone: '', company: '', address: '', notes: '', type: 'Client' }); setShowContactForm(true) }}
                className="px-3 py-1.5 text-sm font-medium text-white bg-gray-900 dark:bg-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Add Contact
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 dark:bg-[#252525] rounded-lg p-0.5 mb-3">
          {[{ id: 'members' as const, label: 'Members', icon: Users, count: teamMembers.length },
            { id: 'contacts' as const, label: 'Contacts', icon: BookUser, count: contacts.length },
            { id: 'roles' as const, label: 'Roles', icon: Shield, count: null }].map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setSearch('') }}
              className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                tab === t.id ? 'bg-white dark:bg-[#333] text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}>
              <t.icon className="w-3.5 h-3.5" />
              {t.label}{t.count !== null && <span className="text-[10px] opacity-60">({t.count})</span>}
            </button>
          ))}
        </div>

        {tab !== 'roles' && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder={`Search ${tab}...`} value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* MEMBERS TAB */}
        {tab === 'members' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {(filtered as TeamMember[]).map(m => {
              const role = getRoleInfo(m.role)
              const memberProjects = projects.filter(p => p.team?.some(t => t.id === m.id))
              return (
                <div key={m.id} className="bg-white dark:bg-[#1e1e1e] rounded-xl border border-gray-100 dark:border-[#2a2a2a] p-4 hover:shadow-md transition-all group">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                      {m.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">{m.name}</h3>
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium mt-0.5 ${role.color}`}>{role.label}</span>
                    </div>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditing(m); setForm({ name: m.name, email: m.email || '', phone: m.phone || '', role: m.role }); setShowAdd(true) }}
                        className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"><Edit className="w-3.5 h-3.5" /></button>
                      <button onClick={() => { if (confirm(`Remove ${m.name}?`)) onDeleteMember(m.id) }}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1">
                    {m.email && <div className="flex items-center gap-2 text-xs text-gray-500"><Mail className="w-3 h-3" /><span className="truncate">{m.email}</span></div>}
                    {m.phone && <div className="flex items-center gap-2 text-xs text-gray-500"><Phone className="w-3 h-3" /><span>{m.phone}</span></div>}
                  </div>
                  {memberProjects.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-[#2a2a2a]">
                      <div className="flex flex-wrap gap-1">
                        {memberProjects.slice(0, 3).map(p => <span key={p.id} className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] rounded-full">{p.name}</span>)}
                        {memberProjects.length > 3 && <span className="text-[10px] text-gray-400">+{memberProjects.length - 3}</span>}
                      </div>
                    </div>
                  )}
                  <button onClick={() => setSelectedMember(m.id)} className="mt-2 text-[11px] text-blue-600 dark:text-blue-400 hover:underline">Manage projects</button>
                </div>
              )
            })}
            {filtered.length === 0 && (
              <div className="col-span-full text-center py-16 text-gray-400">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p className="text-sm font-medium">{search ? 'No members found' : 'No team members yet'}</p>
                <p className="text-xs mt-1">{search ? 'Try a different search' : 'Add your first team member'}</p>
              </div>
            )}
          </div>
        )}

        {/* CONTACTS TAB — Apple Contacts style */}
        {tab === 'contacts' && (
          <div className="flex gap-4 h-full">
            {/* Contact list */}
            <div className={`${selectedContact ? 'hidden md:block' : ''} w-full md:w-72 space-y-1`}>
              {(filtered as Contact[]).map(c => (
                <button key={c.id} onClick={() => setSelectedContact(c)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl transition-all ${selectedContact?.id === c.id ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' : 'hover:bg-gray-50 dark:hover:bg-[#222]'}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                      {c.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{c.name}</p>
                      <p className="text-[10px] text-gray-500 truncate">{c.company || c.type}</p>
                    </div>
                  </div>
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="text-center py-16 text-gray-400">
                  <BookUser className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p className="text-xs">{search ? 'No contacts found' : 'No contacts yet'}</p>
                </div>
              )}
            </div>

            {/* Contact detail */}
            {selectedContact ? (
              <div className="flex-1 bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-100 dark:border-[#2a2a2a] p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white text-xl font-bold">
                      {selectedContact.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{selectedContact.name}</h3>
                      <p className="text-sm text-gray-500">{selectedContact.type}{selectedContact.company ? ` · ${selectedContact.company}` : ''}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditingContact(selectedContact); setContactForm({ name: selectedContact.name, email: selectedContact.email || '', phone: selectedContact.phone || '', company: selectedContact.company || '', address: selectedContact.address || '', notes: selectedContact.notes || '', type: selectedContact.type }); setShowContactForm(true) }}
                      className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => { if (confirm(`Delete ${selectedContact.name}?`)) { onDeleteContact?.(selectedContact.id); setSelectedContact(null) } }}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                    <button onClick={() => setSelectedContact(null)} className="p-2 text-gray-400 hover:text-gray-600 md:hidden rounded-lg"><X className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="space-y-4">
                  {selectedContact.phone && (
                    <a href={`tel:${selectedContact.phone}`} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-[#222] rounded-xl hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors">
                      <Phone className="w-5 h-5 text-green-500" /><div><p className="text-xs text-gray-500">Phone</p><p className="text-sm font-medium text-gray-900 dark:text-gray-100">{selectedContact.phone}</p></div>
                    </a>
                  )}
                  {selectedContact.email && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-[#222] rounded-xl">
                      <Mail className="w-5 h-5 text-blue-500" />
                      <div className="flex-1"><p className="text-xs text-gray-500">Email</p><p className="text-sm font-medium text-gray-900 dark:text-gray-100">{selectedContact.email}</p></div>
                      <button onClick={() => copyEmail(selectedContact.email!)} className="p-1.5 text-gray-400 hover:text-blue-500 rounded-lg">
                        {copiedEmail ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  )}
                  {selectedContact.company && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-[#222] rounded-xl">
                      <Building2 className="w-5 h-5 text-purple-500" /><div><p className="text-xs text-gray-500">Company</p><p className="text-sm font-medium text-gray-900 dark:text-gray-100">{selectedContact.company}</p></div>
                    </div>
                  )}
                  {selectedContact.address && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-[#222] rounded-xl">
                      <MapPin className="w-5 h-5 text-red-500" /><div><p className="text-xs text-gray-500">Address</p><p className="text-sm font-medium text-gray-900 dark:text-gray-100">{selectedContact.address}</p></div>
                    </div>
                  )}
                  {selectedContact.notes && (
                    <div className="p-3 bg-gray-50 dark:bg-[#222] rounded-xl">
                      <p className="text-xs text-gray-500 mb-1">Notes</p><p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{selectedContact.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="hidden md:flex flex-1 items-center justify-center text-gray-400">
                <div className="text-center"><BookUser className="w-12 h-12 mx-auto mb-3 opacity-30" /><p className="text-sm">Select a contact</p></div>
              </div>
            )}
          </div>
        )}

        {/* ROLES TAB */}
        {tab === 'roles' && (
          <div className="max-w-2xl">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Manage team members, change roles, and control access. Roles determine what each person can view, create, edit, and delete.</p>
            <OrgMembersPanel orgId={orgId || null} isOnline={isOnline} />
          </div>
        )}
      </div>

      {/* ADD/EDIT MEMBER MODAL */}
      {showAdd && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4"><div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAdd(false)} />
          <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-[#2a2a2a] relative">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{editing ? 'Edit Member' : 'Add Team Member'}</h3>
            <form onSubmit={handleSubmitMember} className="space-y-4">
              <div><label className="block text-xs font-medium text-gray-500 mb-1">Full Name *</label>
                <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 bg-gray-50 dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-lg text-sm" /></div>
              <div><label className="block text-xs font-medium text-gray-500 mb-1">Email *</label>
                <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 bg-gray-50 dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-lg text-sm" /></div>
              <div><label className="block text-xs font-medium text-gray-500 mb-1">Phone</label>
                <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 bg-gray-50 dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-lg text-sm" /></div>
              <div><label className="block text-xs font-medium text-gray-500 mb-1">Role *</label>
                <div className="space-y-1.5">
                  {ROLES.filter(r => r.value !== 'owner').map(r => (
                    <label key={r.value} className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer border transition-all ${form.role === r.value ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-[#333] hover:bg-gray-50 dark:hover:bg-[#222]'}`}>
                      <input type="radio" name="role" value={r.value} checked={form.role === r.value} onChange={() => setForm({ ...form, role: r.value })} className="accent-blue-600" />
                      <div><p className="text-sm font-medium text-gray-900 dark:text-gray-100">{r.label}</p><p className="text-[10px] text-gray-500">{r.desc}</p></div>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowAdd(false); setEditing(null) }} className="flex-1 px-4 py-2 text-sm border border-gray-200 dark:border-[#333] rounded-lg hover:bg-gray-50 dark:hover:bg-[#222]">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 text-sm text-white bg-gray-900 dark:bg-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100">{editing ? 'Save Changes' : 'Add Member'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONTACT FORM MODAL */}
      {showContactForm && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4"><div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowContactForm(false)} />
          <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-[#2a2a2a] relative">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{editingContact ? 'Edit Contact' : 'New Contact'}</h3>
            <form onSubmit={handleSubmitContact} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><label className="block text-xs font-medium text-gray-500 mb-1">Name *</label>
                  <input type="text" required value={contactForm.name} onChange={e => setContactForm({ ...contactForm, name: e.target.value })} className="w-full px-3 py-2 bg-gray-50 dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-lg text-sm" /></div>
                <div><label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
                  <select value={contactForm.type} onChange={e => setContactForm({ ...contactForm, type: e.target.value })} className="w-full px-3 py-2 bg-gray-50 dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-lg text-sm">
                    {CONTACT_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select></div>
                <div><label className="block text-xs font-medium text-gray-500 mb-1">Company</label>
                  <input type="text" value={contactForm.company} onChange={e => setContactForm({ ...contactForm, company: e.target.value })} className="w-full px-3 py-2 bg-gray-50 dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-lg text-sm" /></div>
                <div><label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                  <input type="email" value={contactForm.email} onChange={e => setContactForm({ ...contactForm, email: e.target.value })} className="w-full px-3 py-2 bg-gray-50 dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-lg text-sm" /></div>
                <div><label className="block text-xs font-medium text-gray-500 mb-1">Phone</label>
                  <input type="tel" value={contactForm.phone} onChange={e => setContactForm({ ...contactForm, phone: e.target.value })} className="w-full px-3 py-2 bg-gray-50 dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-lg text-sm" /></div>
                <div className="col-span-2"><label className="block text-xs font-medium text-gray-500 mb-1">Address</label>
                  <input type="text" value={contactForm.address} onChange={e => setContactForm({ ...contactForm, address: e.target.value })} className="w-full px-3 py-2 bg-gray-50 dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-lg text-sm" /></div>
                <div className="col-span-2"><label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
                  <textarea value={contactForm.notes} onChange={e => setContactForm({ ...contactForm, notes: e.target.value })} rows={2} className="w-full px-3 py-2 bg-gray-50 dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-lg text-sm resize-none" /></div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowContactForm(false); setEditingContact(null) }} className="flex-1 px-4 py-2 text-sm border border-gray-200 dark:border-[#333] rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 text-sm text-white bg-gray-900 dark:bg-white dark:text-gray-900 rounded-lg">{editingContact ? 'Save' : 'Create Contact'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INVITE MODAL */}
      {showInvite && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4"><div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { if (!inviting) { setShowInvite(false); setInviteError(''); setInviteSuccess(false) } }} />
          <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-gray-200 dark:border-[#2a2a2a] relative">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">Invite Team Member</h3>
            <p className="text-xs text-gray-500 mb-4">They'll receive an email invite and be added to your team. No separate subscription needed.</p>
            <input type="email" placeholder="Email address" value={inviteEmail} onChange={e => { setInviteEmail(e.target.value); setInviteError('') }}
              onKeyDown={e => e.key === 'Enter' && handleInvite()}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-lg text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
            {inviteError && (
              <div className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg mb-3">{inviteError}</div>
            )}
            {inviteSuccess && (
              <div className="text-xs text-green-600 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg mb-3">Invite sent successfully ✓</div>
            )}
            <div className="flex gap-3">
              <button onClick={() => { setShowInvite(false); setInviteError(''); setInviteSuccess(false) }} disabled={inviting}
                className="flex-1 px-4 py-2 text-sm border border-gray-200 dark:border-[#333] rounded-lg disabled:opacity-50">Cancel</button>
              <button onClick={handleInvite} disabled={!inviteEmail.trim() || inviting}
                className="flex-1 px-4 py-2 text-sm text-white bg-gray-900 dark:bg-white dark:text-gray-900 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-200 disabled:opacity-50 flex items-center justify-center gap-1.5">
                {inviting ? (
                  <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending...</>
                ) : (
                  <><Mail className="w-3.5 h-3.5" /> Send Invite</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROJECT ASSIGNMENT MODAL */}
      {selectedMember && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4"><div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedMember(null)} />
          <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-6 w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl border border-gray-200 dark:border-[#2a2a2a] relative">
            <h3 className="text-lg font-semibold mb-4">Manage Project Assignments</h3>
            <div className="flex-1 overflow-y-auto space-y-2 mb-4">
              {projects.map(p => {
                const assigned = p.team?.some(t => t.id === selectedMember)
                return (
                  <label key={p.id} className="flex items-center gap-3 p-3 border border-gray-200 dark:border-[#333] rounded-lg hover:bg-gray-50 dark:hover:bg-[#222] cursor-pointer">
                    <input type="checkbox" checked={assigned} onChange={e => e.target.checked ? onAssignToProject(p.id, selectedMember) : onRemoveFromProject(p.id, selectedMember)} className="w-4 h-4 accent-blue-600 rounded" />
                    <div><p className="text-sm font-medium text-gray-900 dark:text-gray-100">{p.name}</p>{p.client && <p className="text-xs text-gray-500">{p.client}</p>}</div>
                  </label>
                )
              })}
            </div>
            <button onClick={() => setSelectedMember(null)} className="w-full px-4 py-2 text-sm text-white bg-gray-900 dark:bg-white dark:text-gray-900 rounded-lg">Done</button>
          </div>
        </div>
      )}
    </div>
  )
}
