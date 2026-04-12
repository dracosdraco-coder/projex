'use client'

import { useState } from 'react'
import { Building2, Plus, Edit, Trash2, MapPin, Phone, Mail, Users, X } from 'lucide-react'

interface Branch { id: string; name: string; address?: string; city?: string; state?: string; zipCode?: string; phone?: string; email?: string; manager?: string; isPrimary?: boolean; location?: string }
interface Project { id: string; name: string; branch?: string }

interface BranchesContentProps {
  branches: Branch[]
  projects: Project[]
  teamMembers?: { id: string; name: string }[]
  onAddBranch?: () => void
  onCreateBranch?: (data: any) => Promise<any>
  onUpdateBranch?: (id: string, data: any) => Promise<void>
  onDeleteBranch?: (branchId: string) => void
}

export default function BranchesContent({ branches = [], projects = [], teamMembers = [], onCreateBranch, onUpdateBranch, onDeleteBranch }: BranchesContentProps) {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Branch | null>(null)
  const [form, setForm] = useState({ name: '', address: '', city: '', state: '', zipCode: '', phone: '', email: '', manager: '' })

  const openNew = () => { setEditing(null); setForm({ name: '', address: '', city: '', state: '', zipCode: '', phone: '', email: '', manager: '' }); setShowForm(true) }
  const openEdit = (b: Branch) => { setEditing(b); setForm({ name: b.name, address: b.address || '', city: b.city || '', state: b.state || '', zipCode: b.zipCode || '', phone: b.phone || '', email: b.email || '', manager: b.manager || '' }); setShowForm(true) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editing) await onUpdateBranch?.(editing.id, form)
    else await onCreateBranch?.(form)
    setShowForm(false); setEditing(null)
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-[#111]">
      <div className="bg-white dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-[#2a2a2a] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Branches</h2>
          <span className="text-sm text-gray-500">({branches.length})</span>
        </div>
        <button onClick={openNew} className="px-3 py-1.5 text-sm font-medium text-white bg-gray-900 dark:bg-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Add Branch
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {branches.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Building2 className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium">No branches yet</p>
            <p className="text-xs mt-1">Add office locations and branches</p>
            <button onClick={openNew} className="mt-4 px-4 py-2 text-sm bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg">Add Branch</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {branches.map(b => {
              const projCount = projects.filter(p => p.branch === b.name || p.branch === b.id).length
              const addr = [b.address, b.city, b.state, b.zipCode].filter(Boolean).join(', ') || b.location
              return (
                <div key={b.id} className="bg-white dark:bg-[#1e1e1e] rounded-xl border border-gray-100 dark:border-[#2a2a2a] p-5 hover:shadow-md transition-all group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{b.name}</h3>
                        {b.isPrimary && <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">PRIMARY</span>}
                      </div>
                    </div>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(b)} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"><Edit className="w-3.5 h-3.5" /></button>
                      <button onClick={() => { if (confirm(`Delete ${b.name}?`)) onDeleteBranch?.(b.id) }} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    {addr && <div className="flex items-start gap-2"><MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" /><span>{addr}</span></div>}
                    {b.phone && <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" /><span>{b.phone}</span></div>}
                    {b.email && <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" /><span className="truncate">{b.email}</span></div>}
                    {b.manager && <div className="flex items-center gap-2"><Users className="w-3.5 h-3.5" /><span>Manager: {b.manager}</span></div>}
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-[#2a2a2a] flex items-center gap-4 text-xs text-gray-500">
                    <span>{projCount} project{projCount !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4"><div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-[#2a2a2a] relative">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{editing ? 'Edit Branch' : 'New Branch'}</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div><label className="block text-xs font-medium text-gray-500 mb-1">Branch Name *</label>
                <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 bg-gray-50 dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-lg text-sm" /></div>
              <div><label className="block text-xs font-medium text-gray-500 mb-1">Street Address</label>
                <input type="text" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="w-full px-3 py-2 bg-gray-50 dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-lg text-sm" /></div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="block text-xs font-medium text-gray-500 mb-1">City</label>
                  <input type="text" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="w-full px-3 py-2 bg-gray-50 dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-lg text-sm" /></div>
                <div><label className="block text-xs font-medium text-gray-500 mb-1">State</label>
                  <input type="text" value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} className="w-full px-3 py-2 bg-gray-50 dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-lg text-sm" /></div>
                <div><label className="block text-xs font-medium text-gray-500 mb-1">ZIP</label>
                  <input type="text" value={form.zipCode} onChange={e => setForm({ ...form, zipCode: e.target.value })} className="w-full px-3 py-2 bg-gray-50 dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-lg text-sm" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium text-gray-500 mb-1">Phone</label>
                  <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 bg-gray-50 dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-lg text-sm" /></div>
                <div><label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 bg-gray-50 dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-lg text-sm" /></div>
              </div>
              <div><label className="block text-xs font-medium text-gray-500 mb-1">Manager</label>
                <select value={form.manager} onChange={e => setForm({ ...form, manager: e.target.value })} className="w-full px-3 py-2 bg-gray-50 dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-lg text-sm">
                  <option value="">None</option>
                  {teamMembers.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                </select></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 text-sm border border-gray-200 dark:border-[#333] rounded-lg">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 text-sm text-white bg-gray-900 dark:bg-white dark:text-gray-900 rounded-lg">{editing ? 'Save' : 'Create Branch'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
