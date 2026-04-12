'use client'

import { useState } from 'react'

interface ClientPortalViewProps {
  project: any
  phases: any[]
  documents: any[]
  expenses: any[]
  orgName: string
}

export default function ClientPortalView({ project, phases, documents, expenses, orgName }: ClientPortalViewProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'timeline'>('overview')

  const totalExpenses = expenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0)
  const contractAmount = project.contract_amount || 0
  const progressPercent = contractAmount > 0 ? Math.min(100, Math.round((totalExpenses / contractAmount) * 100)) : 0

  const completedPhases = phases.filter((p: any) => p.status === 'completed').length
  const totalPhases = phases.length
  const phaseProgress = totalPhases > 0 ? Math.round((completedPhases / totalPhases) * 100) : 0

  const statusColors: Record<string, string> = {
    active: 'text-green-600 bg-green-50',
    planning: 'text-blue-600 bg-blue-50',
    completed: 'text-gray-600 bg-gray-100',
    on_hold: 'text-amber-600 bg-amber-50',
  }

  const docStatusColors: Record<string, string> = {
    sent: 'text-green-600 bg-green-50',
    approved: 'text-green-600 bg-green-50',
    draft: 'text-gray-500 bg-gray-50',
    paid: 'text-blue-600 bg-blue-50',
  }

  const formatCurrency = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n)
  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

  const TABS = [
    { id: 'overview' as const, label: 'Overview' },
    { id: 'documents' as const, label: `Documents (${documents.length})` },
    { id: 'timeline' as const, label: `Timeline (${phases.length})` },
  ]

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-5">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-sm font-bold text-gray-900 tracking-tight uppercase">{orgName}</h1>
            <span className="text-[10px] text-gray-400">Client Portal</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 tracking-tight">{project.name}</h2>
          <div className="flex items-center gap-3 mt-2">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${statusColors[project.status] || 'text-gray-500 bg-gray-50'}`}>
              {(project.status || 'active').replace('_', ' ')}
            </span>
            {project.address && <span className="text-xs text-gray-400">{project.address}</span>}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 flex gap-6">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`py-3 text-xs font-medium border-b-2 transition-colors ${
                activeTab === tab.id ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-6">

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Progress Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Contract Value</p>
                <p className="text-lg font-semibold text-gray-900">{formatCurrency(contractAmount)}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Budget Used</p>
                <p className="text-lg font-semibold text-gray-900">{progressPercent}%</p>
                <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gray-900 rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Phase Progress</p>
                <p className="text-lg font-semibold text-gray-900">{completedPhases} / {totalPhases}</p>
                <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${phaseProgress}%` }} />
                </div>
              </div>
            </div>

            {/* Project Details */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Project Details</h3>
              <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-xs">
                <div><span className="text-gray-400">Start Date</span><p className="text-gray-900 font-medium mt-0.5">{formatDate(project.start_date)}</p></div>
                <div><span className="text-gray-400">End Date</span><p className="text-gray-900 font-medium mt-0.5">{formatDate(project.end_date || project.due_date)}</p></div>
                {project.description && (
                  <div className="col-span-2"><span className="text-gray-400">Description</span><p className="text-gray-700 mt-0.5 leading-relaxed">{project.description}</p></div>
                )}
              </div>
            </div>

            {/* Recent Documents */}
            {documents.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Recent Documents</h3>
                <div className="space-y-2">
                  {documents.slice(0, 5).map((doc: any) => (
                    <div key={doc.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <div>
                        <p className="text-xs font-medium text-gray-900 capitalize">{doc.type} {doc.document_number}</p>
                        <p className="text-[10px] text-gray-400">{formatDate(doc.created_at)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {doc.total && <span className="text-xs font-medium text-gray-700">{formatCurrency(doc.total)}</span>}
                        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded capitalize ${docStatusColors[doc.status] || 'text-gray-500 bg-gray-50'}`}>
                          {doc.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Documents Tab */}
        {activeTab === 'documents' && (
          <div className="space-y-3">
            {/* Payment Summary */}
            {documents.filter((d: any) => d.type === 'invoice').length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Payment Summary</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <p className="text-[10px] text-gray-400 uppercase">Paid</p>
                    <p className="text-sm font-bold text-green-600">
                      {formatCurrency(documents.filter((d: any) => d.type === 'invoice' && d.status === 'paid').reduce((s: number, d: any) => s + (d.total || 0), 0))}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-gray-400 uppercase">Outstanding</p>
                    <p className="text-sm font-bold text-blue-600">
                      {formatCurrency(documents.filter((d: any) => d.type === 'invoice' && d.status === 'sent').reduce((s: number, d: any) => s + (d.total || 0), 0))}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-gray-400 uppercase">Total Invoiced</p>
                    <p className="text-sm font-bold text-gray-900">
                      {formatCurrency(documents.filter((d: any) => d.type === 'invoice').reduce((s: number, d: any) => s + (d.total || 0), 0))}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {documents.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">No documents shared yet.</div>
            ) : (
              documents.map((doc: any) => (
                <div key={doc.id} className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900 capitalize">{doc.type} #{doc.document_number}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        Issued: {formatDate(doc.date_issued || doc.created_at)}
                        {doc.date_due && <> • Due: {formatDate(doc.date_due)}</>}
                        {doc.date_paid && <> • Paid: {formatDate(doc.date_paid)}</>}
                      </p>
                    </div>
                    <div className="text-right">
                      {doc.total && <p className="text-sm font-bold text-gray-900">{formatCurrency(doc.total)}</p>}
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${docStatusColors[doc.status] || 'text-gray-500 bg-gray-50'}`}>
                        {doc.status}
                      </span>
                    </div>
                  </div>
                  {/* Line items */}
                  {doc.line_items && doc.line_items.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="space-y-1">
                        {doc.line_items.slice(0, 5).map((li: any, i: number) => (
                          <div key={i} className="flex justify-between text-[11px]">
                            <span className="text-gray-600 truncate mr-4">{li.description || li.name || 'Item'}</span>
                            <span className="text-gray-900 font-medium shrink-0">{formatCurrency(li.price || li.total || (li.quantity * li.unitPrice) || 0)}</span>
                          </div>
                        ))}
                        {doc.line_items.length > 5 && (
                          <p className="text-[10px] text-gray-400">+{doc.line_items.length - 5} more items</p>
                        )}
                      </div>
                      <div className="flex justify-between text-xs font-semibold mt-2 pt-2 border-t border-gray-100">
                        <span className="text-gray-700">Total</span>
                        <span className="text-gray-900">{formatCurrency(doc.total || 0)}</span>
                      </div>
                    </div>
                  )}
                  {doc.terms && (
                    <p className="text-[10px] text-gray-400 mt-2 italic">Terms: {doc.terms}</p>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Timeline Tab */}
        {activeTab === 'timeline' && (
          <div className="space-y-1">
            {phases.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">No phases defined yet.</div>
            ) : (
              phases.map((phase: any, i: number) => {
                const isComplete = phase.status === 'completed'
                const isActive = phase.status === 'in_progress' || phase.status === 'active'
                return (
                  <div key={phase.id} className="flex gap-4">
                    {/* Timeline line */}
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full border-2 mt-1 ${
                        isComplete ? 'bg-green-500 border-green-500' :
                        isActive ? 'bg-blue-500 border-blue-500' :
                        'bg-white border-gray-300'
                      }`} />
                      {i < phases.length - 1 && <div className="w-px flex-1 bg-gray-200 my-1" />}
                    </div>
                    {/* Content */}
                    <div className="pb-6 flex-1">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-medium ${isComplete ? 'text-green-700' : isActive ? 'text-blue-700' : 'text-gray-700'}`}>
                          {phase.name || phase.title}
                        </p>
                        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded capitalize ${
                          isComplete ? 'text-green-600 bg-green-50' :
                          isActive ? 'text-blue-600 bg-blue-50' :
                          'text-gray-400 bg-gray-50'
                        }`}>
                          {(phase.status || 'pending').replace('_', ' ')}
                        </span>
                      </div>
                      {phase.description && <p className="text-xs text-gray-500 mt-1">{phase.description}</p>}
                      <div className="flex gap-4 mt-1.5 text-[10px] text-gray-400">
                        {phase.start_date && <span>Start: {formatDate(phase.start_date)}</span>}
                        {phase.end_date && <span>End: {formatDate(phase.end_date)}</span>}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 mt-8">
        <div className="max-w-3xl mx-auto px-4 py-4 text-center">
          <p className="text-[10px] text-gray-400">Powered by <span className="font-semibold">Projex</span> — Construction management, reimagined.</p>
        </div>
      </div>
    </div>
  )
}
