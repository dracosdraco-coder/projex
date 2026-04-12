'use client'

import { useState } from 'react'
import { Plus, Search, FileText, DollarSign, Grid3x3, List, Eye, Edit, Trash2, Copy, Send, Download, MoreVertical, CheckCircle, Clock, XCircle, Settings, ArrowRightLeft } from 'lucide-react'

interface FormsContentProps {
  documents: any[]
  lineItemTemplates: any[]
  formTemplates: any[]
  onCreateDocument: (type: string) => void
  onEditDocument: (doc: any) => void
  onDeleteDocument: (id: string) => void
  onDuplicateDocument?: (doc: any) => void
  onSendDocument?: (doc: any) => void
  onDownloadDocument?: (doc: any) => void
  onConvertDocument?: (doc: any) => void
  onOpenTemplates: () => void
}

export default function FormsContent({
  documents, lineItemTemplates, formTemplates,
  onCreateDocument, onEditDocument, onDeleteDocument,
  onDuplicateDocument, onSendDocument, onDownloadDocument,
  onConvertDocument,
  onOpenTemplates,
}: FormsContentProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showDocMenu, setShowDocMenu] = useState<string | null>(null)

  const documentTypes = [
    { value: 'estimate', label: 'Estimate', color: 'blue' },
    { value: 'invoice', label: 'Invoice', color: 'green' },
    { value: 'work_order', label: 'Work Order', color: 'purple' },
    { value: 'change_order', label: 'Change Order', color: 'orange' },
    { value: 'purchase_order', label: 'Purchase Order', color: 'indigo' },
    { value: 'proposal', label: 'Proposal', color: 'pink' },
    { value: 'contract', label: 'Contract', color: 'red' },
    { value: 'inspection', label: 'Inspection', color: 'teal' },
  ]

  const filteredDocs = documents.filter(doc => {
    if (typeFilter !== 'all' && doc.type !== typeFilter) return false
    if (statusFilter !== 'all' && doc.status !== statusFilter) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (!doc.documentNumber?.toLowerCase().includes(q) && !doc.clientName?.toLowerCase().includes(q) && !doc.type?.toLowerCase().includes(q)) return false
    }
    return true
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-50 dark:bg-green-900/20'
      case 'paid': return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20'
      case 'sent': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20'
      case 'draft': return 'text-gray-600 bg-gray-100 dark:bg-[#252525]'
      case 'rejected': return 'text-red-600 bg-red-50 dark:bg-red-900/20'
      default: return 'text-gray-600 bg-gray-100 dark:bg-[#252525]'
    }
  }

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n || 0)
  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''

  const handleAction = (action: string, doc: any) => {
    setShowDocMenu(null)
    switch (action) {
      case 'edit': onEditDocument(doc); break
      case 'duplicate': onDuplicateDocument?.(doc) || onCreateDocument(doc.type); break
      case 'send': onSendDocument?.(doc); break
      case 'download': onDownloadDocument?.(doc); break
      case 'convert': onConvertDocument?.(doc); break
      case 'delete': if (confirm('Delete this document?')) onDeleteDocument(doc.id); break
    }
  }

  const MenuDropdown = ({ doc }: { doc: any }) => (
    <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-[#222] rounded-xl shadow-xl border border-gray-200 dark:border-[#333] z-30 py-1 overflow-hidden">
      <button onClick={() => handleAction('edit', doc)} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-[#2a2a2a] flex items-center gap-2 text-gray-700 dark:text-gray-300">
        <Edit className="w-4 h-4" /> Edit
      </button>
      <button onClick={() => handleAction('duplicate', doc)} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-[#2a2a2a] flex items-center gap-2 text-gray-700 dark:text-gray-300">
        <Copy className="w-4 h-4" /> Duplicate
      </button>
      <button onClick={() => handleAction('send', doc)} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-[#2a2a2a] flex items-center gap-2 text-gray-700 dark:text-gray-300">
        <Send className="w-4 h-4" /> Send
      </button>
      <button onClick={() => handleAction('download', doc)} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-[#2a2a2a] flex items-center gap-2 text-gray-700 dark:text-gray-300">
        <Download className="w-4 h-4" /> Download PDF
      </button>
      <button onClick={() => handleAction('convert', doc)} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-[#2a2a2a] flex items-center gap-2 text-gray-700 dark:text-gray-300">
        <ArrowRightLeft className="w-4 h-4" /> Convert To...
      </button>
      <div className="border-t border-gray-100 dark:border-[#333] my-1" />
      <button onClick={() => handleAction('delete', doc)} className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 flex items-center gap-2">
        <Trash2 className="w-4 h-4" /> Delete
      </button>
    </div>
  )

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-[#111]">
      {/* Click-away for menu */}
      {showDocMenu && <div className="fixed inset-0 z-20" onClick={() => setShowDocMenu(null)} />}

      {/* Header */}
      <div className="bg-white dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-[#2a2a2a] px-3 md:px-6 py-3 md:py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Forms & Documents</h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">{filteredDocs.length} documents</span>
          </div>
          <button onClick={onOpenTemplates} className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-[#252525] rounded-lg hover:bg-gray-200 dark:hover:bg-[#333] flex items-center gap-2">
            <Settings className="w-4 h-4" /> Templates
          </button>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-8 gap-2 mb-4">
          {documentTypes.map(type => (
            <button key={type.value} onClick={() => onCreateDocument(type.value)}
              className="px-2 py-2 rounded-lg text-xs font-medium transition-colors bg-gray-100 dark:bg-[#252525] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#333] flex items-center justify-center gap-1">
              <Plus className="w-3 h-3" /> {type.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search by number, client, or type..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-[#333] rounded-lg text-sm bg-white dark:bg-[#252525] text-gray-900 dark:text-gray-100" />
          </div>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-[#333] rounded-lg text-sm bg-white dark:bg-[#252525] text-gray-900 dark:text-gray-100">
            <option value="all">All Types</option>
            {documentTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-[#333] rounded-lg text-sm bg-white dark:bg-[#252525] text-gray-900 dark:text-gray-100">
            <option value="all">All Status</option>
            <option value="draft">Draft</option><option value="sent">Sent</option><option value="approved">Approved</option><option value="paid">Paid</option><option value="rejected">Rejected</option>
          </select>
          <div className="flex bg-gray-100 dark:bg-[#252525] rounded-lg p-1">
            <button onClick={() => setViewMode('grid')} className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white dark:bg-[#333] shadow-sm' : ''}`}><Grid3x3 className="w-4 h-4 text-gray-700 dark:text-gray-300" /></button>
            <button onClick={() => setViewMode('list')} className={`p-2 rounded ${viewMode === 'list' ? 'bg-white dark:bg-[#333] shadow-sm' : ''}`}><List className="w-4 h-4 text-gray-700 dark:text-gray-300" /></button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredDocs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <FileText className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg font-medium mb-1">No documents yet</p>
            <p className="text-sm mb-4">Create your first estimate, invoice, or inspection</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredDocs.map(doc => {
              const docType = documentTypes.find(t => t.value === doc.type)
              return (
                <div key={doc.id} className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#2a2a2a] hover:shadow-lg transition-all overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${getStatusColor(doc.status)}`}>{doc.status}</span>
                      <div className="relative">
                        <button onClick={() => setShowDocMenu(showDocMenu === doc.id ? null : doc.id)} className="p-1 hover:bg-gray-100 dark:hover:bg-[#252525] rounded">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {showDocMenu === doc.id && <MenuDropdown doc={doc} />}
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">{doc.documentNumber}</h3>
                    {doc.clientName && <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{doc.clientName}</p>}
                    <p className="text-xs text-gray-400 capitalize mb-3">{doc.type?.replace('_', ' ')}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">{fmt(doc.total)}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{fmtDate(doc.dateIssued)}</span>
                      {doc.dateDue && <span>Due: {fmtDate(doc.dateDue)}</span>}
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-[#111] px-4 py-3 border-t border-gray-100 dark:border-[#2a2a2a]">
                    <button onClick={() => onEditDocument(doc)} className="w-full text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center justify-center gap-2">
                      <Eye className="w-4 h-4" /> View / Edit
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredDocs.map(doc => (
              <div key={doc.id} className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-[#2a2a2a] p-4 hover:shadow-md transition-all cursor-pointer" onClick={() => onEditDocument(doc)}>
                <div className="flex items-center gap-4">
                  <div className="flex-1 grid grid-cols-5 gap-4 items-center">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">{doc.documentNumber}</p>
                      <p className="text-sm text-gray-500 capitalize">{doc.type?.replace('_', ' ')}</p>
                    </div>
                    <p className="text-sm text-gray-900 dark:text-gray-100">{doc.clientName || '—'}</p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{fmt(doc.total)}</p>
                    <span className={`px-2 py-1 rounded text-xs font-medium capitalize inline-block w-fit ${getStatusColor(doc.status)}`}>{doc.status}</span>
                    <p className="text-sm text-gray-500">{fmtDate(doc.dateIssued)}</p>
                  </div>
                  <div className="relative" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setShowDocMenu(showDocMenu === doc.id ? null : doc.id)} className="p-2 hover:bg-gray-100 dark:hover:bg-[#252525] rounded-lg">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    {showDocMenu === doc.id && <MenuDropdown doc={doc} />}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
