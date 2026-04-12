'use client'

import { useState, useMemo } from 'react'
import {
  Target, Plus, Search, Phone, Mail, ChevronRight, Star, Clock,
  CheckCircle, XCircle, ArrowRight, Filter, MoreHorizontal, User,
  MapPin, DollarSign, Calendar, TrendingUp, X
} from 'lucide-react'

import type { Lead } from '@/hooks/useLeads'

interface LeadGenContentProps {
  leads?: Lead[]
  onCreateLead?: (data: Omit<Lead, 'id' | 'createdAt' | 'lastContactAt'>) => Promise<Lead | null>
  onUpdateLead?: (id: string, updates: Partial<Lead>) => Promise<void>
  onDeleteLead?: (id: string) => Promise<void>
  onSendEmail?: (data: { to: string; subject: string; html: string; text: string }) => Promise<void>
}

const STAGES: { id: Lead['status']; label: string; color: string; icon: any }[] = [
  { id: 'new', label: 'New', color: 'bg-blue-500', icon: Star },
  { id: 'contacted', label: 'Contacted', color: 'bg-purple-500', icon: Phone },
  { id: 'qualified', label: 'Qualified', color: 'bg-amber-500', icon: CheckCircle },
  { id: 'proposal', label: 'Proposal', color: 'bg-indigo-500', icon: Mail },
  { id: 'won', label: 'Won', color: 'bg-green-500', icon: TrendingUp },
  { id: 'lost', label: 'Lost', color: 'bg-gray-400', icon: XCircle },
]

const SOURCES = ['Website', 'Referral', 'Google', 'Social Media', 'Cold Call', 'Walk-in', 'Angi', 'HomeAdvisor', 'Other']
const PROJECT_TYPES = ['Roofing', 'General Construction', 'Renovation', 'HVAC', 'Electrical', 'Plumbing', 'Painting', 'Landscaping', 'Other']

export default function LeadGenContent({ leads: leadsProp = [], onCreateLead, onUpdateLead, onDeleteLead, onSendEmail }: LeadGenContentProps) {
  const [localLeads, setLocalLeads] = useState<Lead[]>([])
  const leads = leadsProp.length > 0 ? leadsProp : localLeads
  const [view, setView] = useState<'pipeline' | 'list'>('pipeline')
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [form, setForm] = useState<Partial<Lead>>({ status: 'new', source: 'Website', value: 0 })
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const stats = useMemo(() => {
    const total = leads.length
    const totalValue = leads.filter(l => l.status !== 'lost').reduce((s, l) => s + (l.value || 0), 0)
    const wonValue = leads.filter(l => l.status === 'won').reduce((s, l) => s + (l.value || 0), 0)
    const convRate = total > 0 ? Math.round((leads.filter(l => l.status === 'won').length / total) * 100) : 0
    return { total, totalValue, wonValue, convRate }
  }, [leads])

  const filteredLeads = leads.filter(l => {
    if (filterStatus !== 'all' && l.status !== filterStatus) return false
    if (search) {
      const q = search.toLowerCase()
      return l.name.toLowerCase().includes(q) || l.company.toLowerCase().includes(q) || l.email.toLowerCase().includes(q)
    }
    return true
  })

  const addLead = async () => {
    if (!form.name) return
    const data = {
      name: form.name || '', email: form.email || '',
      phone: form.phone || '', company: form.company || '', source: form.source || 'Website',
      status: (form.status as Lead['status']) || 'new', value: form.value || 0,
      notes: form.notes || '', address: form.address || '',
      projectType: form.projectType || '',
    }
    if (onCreateLead) {
      await onCreateLead(data)
    } else {
      const newLead: Lead = { id: `lead-${Date.now()}`, ...data, createdAt: new Date().toISOString(), lastContactAt: '' }
      setLocalLeads(prev => [newLead, ...prev])
    }
    setForm({ status: 'new', source: 'Website', value: 0 })
    setShowAdd(false)
  }

  const updateLeadStatus = async (id: string, status: Lead['status']) => {
    if (onUpdateLead) {
      await onUpdateLead(id, { status })
    } else {
      setLocalLeads(prev => prev.map(l => l.id === id ? { ...l, status, lastContactAt: new Date().toISOString() } : l))
    }
    if (selectedLead?.id === id) setSelectedLead(prev => prev ? { ...prev, status } : null)
  }

  const handleDeleteLead = async (id: string) => {
    if (onDeleteLead) {
      await onDeleteLead(id)
    } else {
      setLocalLeads(prev => prev.filter(l => l.id !== id))
    }
    if (selectedLead?.id === id) setSelectedLead(null)
  }

  const formatCurrency = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n)
  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-[#111]">
      {/* Header */}
      <div className="bg-white dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-[#2a2a2a] px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Target className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Leads</h2>
            <span className="text-xs text-gray-400">{leads.length} total</span>
          </div>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-xs font-medium hover:bg-gray-700 dark:hover:bg-gray-200 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add Lead
          </button>
        </div>

        {/* Stats row */}
        <div className="flex gap-3 mb-3 overflow-x-auto pb-1">
          {[
            { label: 'Pipeline', value: formatCurrency(stats.totalValue), color: 'text-blue-600' },
            { label: 'Won', value: formatCurrency(stats.wonValue), color: 'text-green-600' },
            { label: 'Conversion', value: `${stats.convRate}%`, color: 'text-purple-600' },
            { label: 'Total Leads', value: String(stats.total), color: 'text-gray-900 dark:text-gray-100' },
          ].map(s => (
            <div key={s.label} className="bg-gray-50 dark:bg-[#222] rounded-lg px-3 py-2 min-w-[100px]">
              <p className="text-[9px] text-gray-400 uppercase tracking-wide">{s.label}</p>
              <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search leads..."
              className="w-full pl-9 pr-3 py-1.5 bg-gray-50 dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-lg text-xs" />
          </div>
          <div className="flex bg-gray-100 dark:bg-[#222] rounded-lg p-0.5">
            <button onClick={() => setView('pipeline')} className={`px-3 py-1 rounded-md text-[10px] font-medium ${view === 'pipeline' ? 'bg-white dark:bg-[#2a2a2a] shadow-sm text-gray-900 dark:text-gray-100' : 'text-gray-500'}`}>Pipeline</button>
            <button onClick={() => setView('list')} className={`px-3 py-1 rounded-md text-[10px] font-medium ${view === 'list' ? 'bg-white dark:bg-[#2a2a2a] shadow-sm text-gray-900 dark:text-gray-100' : 'text-gray-500'}`}>List</button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {/* Empty State */}
        {leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-[#222] flex items-center justify-center mb-4">
              <Target className="w-7 h-7 text-gray-400" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">No leads yet</h3>
            <p className="text-xs text-gray-500 max-w-xs mb-4">Start capturing leads from your website, referrals, and outreach. Track them through your pipeline to close more deals.</p>
            <button onClick={() => setShowAdd(true)} className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-xs font-medium">Add First Lead</button>
          </div>
        ) : view === 'pipeline' ? (
          /* Pipeline View — Kanban columns */
          <div className="flex gap-3 min-w-max h-full">
            {STAGES.filter(s => s.id !== 'lost').map(stage => {
              const stageLeads = filteredLeads.filter(l => l.status === stage.id)
              const StageIcon = stage.icon
              return (
                <div key={stage.id} className="w-[260px] flex flex-col">
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <div className={`w-2 h-2 rounded-full ${stage.color}`} />
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{stage.label}</span>
                    <span className="text-[10px] text-gray-400 ml-auto">{stageLeads.length}</span>
                  </div>
                  <div className="flex-1 space-y-2 overflow-y-auto">
                    {stageLeads.map(lead => (
                      <button key={lead.id} onClick={() => setSelectedLead(lead)}
                        className="w-full bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#2a2a2a] p-3 text-left hover:border-gray-300 dark:hover:border-[#3a3a3a] transition-colors active:scale-[0.98]">
                        <div className="flex items-start justify-between mb-1.5">
                          <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">{lead.name}</p>
                          {lead.value > 0 && <span className="text-[10px] font-bold text-green-600">{formatCurrency(lead.value)}</span>}
                        </div>
                        {lead.company && <p className="text-[10px] text-gray-400 mb-1">{lead.company}</p>}
                        <div className="flex items-center gap-2 text-[9px] text-gray-400">
                          <span>{lead.source}</span>
                          {lead.projectType && <><span>•</span><span>{lead.projectType}</span></>}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          /* List View */
          <div className="space-y-2">
            {filteredLeads.map(lead => {
              const stage = STAGES.find(s => s.id === lead.status)
              return (
                <button key={lead.id} onClick={() => setSelectedLead(lead)}
                  className="w-full flex items-center gap-3 bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#2a2a2a] p-3 text-left hover:border-gray-300 transition-colors">
                  <div className={`w-2 h-8 rounded-full ${stage?.color || 'bg-gray-300'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">{lead.name}</p>
                    <p className="text-[10px] text-gray-400">{lead.company} • {lead.source}</p>
                  </div>
                  {lead.value > 0 && <span className="text-xs font-bold text-green-600">{formatCurrency(lead.value)}</span>}
                  <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full text-white ${stage?.color || 'bg-gray-400'}`}>{stage?.label}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Add Lead Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAdd(false)} />
          <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-[#2a2a2a] relative">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">New Lead</h3>
            <div className="space-y-3">
              <input type="text" placeholder="Full name *" value={form.name || ''} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-lg text-sm" />
              <div className="grid grid-cols-2 gap-2">
                <input type="email" placeholder="Email" value={form.email || ''} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  className="px-3 py-2 bg-gray-50 dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-lg text-sm" />
                <input type="tel" placeholder="Phone" value={form.phone || ''} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                  className="px-3 py-2 bg-gray-50 dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-lg text-sm" />
              </div>
              <input type="text" placeholder="Company" value={form.company || ''} onChange={e => setForm(p => ({ ...p, company: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-lg text-sm" />
              <input type="text" placeholder="Address" value={form.address || ''} onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-lg text-sm" />
              <div className="grid grid-cols-2 gap-2">
                <select value={form.source || 'Website'} onChange={e => setForm(p => ({ ...p, source: e.target.value }))}
                  className="px-3 py-2 bg-gray-50 dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-lg text-sm">
                  {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select value={form.projectType || ''} onChange={e => setForm(p => ({ ...p, projectType: e.target.value }))}
                  className="px-3 py-2 bg-gray-50 dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-lg text-sm">
                  <option value="">Project type...</option>
                  {PROJECT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="relative">
                <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="number" placeholder="Estimated value" value={form.value || ''} onChange={e => setForm(p => ({ ...p, value: parseFloat(e.target.value) || 0 }))}
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-lg text-sm" />
              </div>
              <textarea placeholder="Notes..." value={form.notes || ''} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-lg text-sm resize-none" />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowAdd(false)} className="flex-1 px-4 py-2 text-sm border border-gray-200 dark:border-[#333] rounded-lg">Cancel</button>
              <button onClick={addLead} disabled={!form.name}
                className="flex-1 px-4 py-2 text-sm text-white bg-gray-900 dark:bg-white dark:text-gray-900 rounded-lg font-medium disabled:opacity-50">Add Lead</button>
            </div>
          </div>
        </div>
      )}

      {/* Lead Detail Sheet */}
      {selectedLead && (
        <div className="fixed inset-0 z-[500] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedLead(null)} />
          <div className="bg-white dark:bg-[#1a1a1a] rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[85vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-[#2a2a2a] relative">
            <div className="sticky top-0 bg-white dark:bg-[#1a1a1a] border-b border-gray-100 dark:border-[#222] px-5 py-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{selectedLead.name}</h3>
              <button onClick={() => setSelectedLead(null)} className="text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              {/* Contact info */}
              <div className="space-y-2">
                {selectedLead.email && (
                  <a href={`mailto:${selectedLead.email}`} className="flex items-center gap-2.5 text-xs text-gray-700 dark:text-gray-300">
                    <Mail className="w-4 h-4 text-gray-400" /> {selectedLead.email}
                  </a>
                )}
                {selectedLead.phone && (
                  <a href={`tel:${selectedLead.phone}`} className="flex items-center gap-2.5 text-xs text-gray-700 dark:text-gray-300">
                    <Phone className="w-4 h-4 text-gray-400" /> {selectedLead.phone}
                  </a>
                )}
                {selectedLead.address && (
                  <div className="flex items-center gap-2.5 text-xs text-gray-500">
                    <MapPin className="w-4 h-4 text-gray-400" /> {selectedLead.address}
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 dark:bg-[#222] rounded-lg p-3">
                  <p className="text-[9px] text-gray-400 uppercase mb-0.5">Value</p>
                  <p className="text-sm font-bold text-green-600">{formatCurrency(selectedLead.value)}</p>
                </div>
                <div className="bg-gray-50 dark:bg-[#222] rounded-lg p-3">
                  <p className="text-[9px] text-gray-400 uppercase mb-0.5">Source</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{selectedLead.source}</p>
                </div>
              </div>

              {/* Stage selector */}
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-2">Stage</p>
                <div className="flex flex-wrap gap-1.5">
                  {STAGES.map(stage => (
                    <button key={stage.id} onClick={() => updateLeadStatus(selectedLead.id, stage.id)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors ${
                        selectedLead.status === stage.id ? `${stage.color} text-white` : 'bg-gray-100 dark:bg-[#222] text-gray-600 dark:text-gray-400'
                      }`}>{stage.label}</button>
                  ))}
                </div>
              </div>

              {/* Quick actions */}
              <div className="flex gap-2">
                {selectedLead.email && onSendEmail && (
                  <button onClick={async () => {
                    await onSendEmail({
                      to: selectedLead.email,
                      subject: `Following up — ${selectedLead.company || selectedLead.name}`,
                      html: `<p>Hi ${selectedLead.name.split(' ')[0]},</p><p>I wanted to follow up on our recent conversation. Do you have any questions or would you like to move forward?</p><p>Best regards</p>`,
                      text: `Hi ${selectedLead.name.split(' ')[0]}, I wanted to follow up. Do you have any questions?`,
                    })
                    updateLeadStatus(selectedLead.id, selectedLead.status === 'new' ? 'contacted' : selectedLead.status)
                  }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium">
                    <Mail className="w-3.5 h-3.5" /> Email
                  </button>
                )}
                {selectedLead.phone && (
                  <a href={`tel:${selectedLead.phone}`}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-600 text-white rounded-lg text-xs font-medium">
                    <Phone className="w-3.5 h-3.5" /> Call
                  </a>
                )}
              </div>

              {selectedLead.notes && (
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Notes</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{selectedLead.notes}</p>
                </div>
              )}

              <p className="text-[10px] text-gray-400 text-center pt-2">Added {formatDate(selectedLead.createdAt)}</p>
              <button
                onClick={() => handleDeleteLead(selectedLead.id)}
                className="w-full py-2 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
              >
                Delete Lead
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
