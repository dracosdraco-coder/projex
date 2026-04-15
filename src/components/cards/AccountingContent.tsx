'use client'

import { useState, useMemo } from 'react'
import { Project } from '@/types'
import { formatCurrency, calculateFormTotals } from '@/lib/utils'
import {
  DollarSign, TrendingUp, TrendingDown, CheckCircle, Clock,
  AlertTriangle, PieChart, BarChart3, Search, Check
} from 'lucide-react'
import type { Notification } from '@/hooks/useNotifications'

interface AccountingContentProps {
  projects: Project[]
  documents: any[]
  totalContractAmount: number
  totalExpenses: number
  grossProfit: number
  onUpdateDocument?: (id: string, updates: any) => Promise<any>
  onNotify?: (data: { type: Notification['type']; title: string; body: string; documentId?: string }) => void
}

type Tab = 'overview' | 'revenue' | 'expenses' | 'pnl'

const EXPENSE_COLORS: Record<string, string> = {
  materials: 'bg-blue-500', labor: 'bg-green-500', equipment: 'bg-purple-500',
  permits: 'bg-orange-500', subcontractor: 'bg-pink-500', other: 'bg-gray-400',
}

export default function AccountingContent({
  projects, documents = [], totalContractAmount, totalExpenses, grossProfit, onUpdateDocument, onNotify
}: AccountingContentProps) {
  const [tab, setTab] = useState<Tab>('overview')
  const [search, setSearch] = useState('')
  const [markingPaid, setMarkingPaid] = useState<string | null>(null)

  const invoices = useMemo(() => documents.filter((d: any) => d.type === 'invoice'), [documents])
  const estimates = useMemo(() => documents.filter((d: any) => d.type === 'estimate'), [documents])

  const financials = useMemo(() => {
    const paidInvoices = invoices.filter((i: any) => i.status === 'paid')
    const sentInvoices = invoices.filter((i: any) => i.status === 'sent')
    const overdueInvoices = sentInvoices.filter((i: any) => i.dateDue && new Date(i.dateDue) < new Date())
    const draftInvoices = invoices.filter((i: any) => i.status === 'draft')

    const calc = (arr: any[]) => arr.reduce((s: number, i: any) => s + (i.total || calculateFormTotals(i.lineItems || []).totalPrice), 0)

    const totalPaid = calc(paidInvoices)
    const totalOutstanding = calc(sentInvoices)
    const totalOverdue = calc(overdueInvoices)
    const totalDraft = calc(draftInvoices)
    const totalEstimated = calc(estimates)

    const expensesByCategory: Record<string, number> = {}
    projects.forEach((p: any) => {
      (p.expenses || []).forEach((e: any) => {
        const cat = e.type || e.category || 'other'
        expensesByCategory[cat] = (expensesByCategory[cat] || 0) + (e.amount || 0)
      })
    })

    return {
      totalPaid, totalOutstanding, totalOverdue, totalDraft, totalEstimated,
      paidCount: paidInvoices.length, outstandingCount: sentInvoices.length, overdueCount: overdueInvoices.length,
      expensesByCategory,
      netProfit: totalPaid - totalExpenses,
      profitMargin: totalPaid > 0 ? Math.round(((totalPaid - totalExpenses) / totalPaid) * 100) : 0,
    }
  }, [invoices, estimates, projects, totalExpenses])

  const handleMarkPaid = async (docId: string) => {
    if (!onUpdateDocument) return
    setMarkingPaid(docId)
    try {
      await onUpdateDocument(docId, { status: 'paid', datePaid: new Date().toISOString() })
      const inv = invoices.find((i: any) => i.id === docId)
      if (onNotify && inv) {
        onNotify({
          type: 'payment_received',
          title: 'Payment Received',
          body: `Invoice ${inv.documentNumber} marked as paid`,
          documentId: docId,
        })
      }
    } catch {}
    setMarkingPaid(null)
  }

  const TABS: { id: Tab; label: string; icon: any }[] = [
    { id: 'overview', label: 'Overview', icon: PieChart },
    { id: 'revenue', label: 'Revenue', icon: TrendingUp },
    { id: 'expenses', label: 'Expenses', icon: TrendingDown },
    { id: 'pnl', label: 'P&L', icon: BarChart3 },
  ]

  const filteredInvoices = invoices.filter((i: any) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (i.documentNumber || '').toLowerCase().includes(q) || (i.clientName || '').toLowerCase().includes(q)
  })

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-[#111]">
      <div className="bg-white dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-[#2a2a2a] px-6 py-4">
        <div className="flex items-center gap-3 mb-3">
          <DollarSign className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Accounting</h2>
        </div>
        <div className="flex gap-1 bg-gray-100 dark:bg-[#222] p-0.5 rounded-lg w-fit">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                tab === t.id ? 'bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}>
              <t.icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {tab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: CheckCircle, iconColor: 'text-green-500', label: 'Revenue Collected', value: financials.totalPaid, sub: `${financials.paidCount} paid`, color: '' },
                { icon: Clock, iconColor: 'text-blue-500', label: 'Outstanding', value: financials.totalOutstanding, sub: `${financials.outstandingCount} pending`, color: '' },
                { icon: AlertTriangle, iconColor: 'text-red-500', label: 'Overdue', value: financials.totalOverdue, sub: `${financials.overdueCount} past due`, color: 'text-red-600' },
                { icon: TrendingUp, iconColor: 'text-green-500', label: 'Net Profit', value: financials.netProfit, sub: `${financials.profitMargin}% margin`, color: financials.netProfit >= 0 ? 'text-green-600' : 'text-red-600' },
              ].map(stat => (
                <div key={stat.label} className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#2a2a2a] p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <stat.icon className={`w-3.5 h-3.5 ${stat.iconColor}`} />
                    <span className="text-[10px] text-gray-400 uppercase tracking-wide">{stat.label}</span>
                  </div>
                  <p className={`text-xl font-bold ${stat.color || 'text-gray-900 dark:text-gray-100'}`}>{formatCurrency(stat.value)}</p>
                  <p className="text-[10px] text-gray-400 mt-1">{stat.sub}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#2a2a2a] p-5">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Revenue Breakdown</h3>
                <div className="space-y-2.5">
                  {[
                    { l: 'Total Contract Value', v: totalContractAmount, c: 'text-gray-900 dark:text-gray-100' },
                    { l: 'Revenue Collected', v: financials.totalPaid, c: 'text-green-600' },
                    { l: 'Outstanding', v: financials.totalOutstanding, c: 'text-blue-600' },
                    { l: 'Draft Invoices', v: financials.totalDraft, c: 'text-gray-400' },
                    { l: 'Estimated (Unsent)', v: financials.totalEstimated, c: 'text-amber-600' },
                  ].map(r => (
                    <div key={r.l} className="flex justify-between"><span className="text-xs text-gray-500">{r.l}</span><span className={`text-xs font-semibold ${r.c}`}>{formatCurrency(r.v)}</span></div>
                  ))}
                </div>
              </div>
              <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#2a2a2a] p-5">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Expenses by Category</h3>
                {Object.keys(financials.expensesByCategory).length === 0 ? (
                  <p className="text-xs text-gray-400 py-4 text-center">No expenses recorded</p>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(financials.expensesByCategory).sort((a, b) => b[1] - a[1]).map(([cat, amount]) => (
                      <div key={cat} className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${EXPENSE_COLORS[cat] || 'bg-gray-400'}`} />
                        <span className="text-xs text-gray-600 dark:text-gray-400 capitalize flex-1">{cat}</span>
                        <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(amount)}</span>
                      </div>
                    ))}
                    <div className="pt-2 mt-2 border-t border-gray-100 dark:border-[#222] flex justify-between">
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Total</span>
                      <span className="text-xs font-bold text-gray-900 dark:text-gray-100">{formatCurrency(totalExpenses)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {tab === 'revenue' && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search invoices..."
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-lg text-xs" />
            </div>
            {filteredInvoices.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-xs">No invoices found</div>
            ) : (
              <div className="space-y-2">
                {filteredInvoices.map((inv: any) => {
                  const amount = inv.total || calculateFormTotals(inv.lineItems || []).totalPrice
                  const isOverdue = inv.status === 'sent' && inv.dateDue && new Date(inv.dateDue) < new Date()
                  return (
                    <div key={inv.id} className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#2a2a2a] p-4 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">INV {inv.documentNumber}</span>
                          <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full capitalize ${
                            inv.status === 'paid' ? 'text-green-600 bg-green-50 dark:bg-green-900/20' :
                            isOverdue ? 'text-red-600 bg-red-50 dark:bg-red-900/20' :
                            inv.status === 'sent' ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' :
                            'text-gray-500 bg-gray-100 dark:bg-[#222]'
                          }`}>{isOverdue ? 'overdue' : inv.status}</span>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-0.5">{inv.clientName || 'No client'} • {inv.dateIssued ? new Date(inv.dateIssued).toLocaleDateString() : ''}</p>
                      </div>
                      <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{formatCurrency(amount)}</span>
                      {inv.status === 'sent' && (
                        <button onClick={() => handleMarkPaid(inv.id)} disabled={markingPaid === inv.id}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-[10px] font-medium hover:bg-green-700 disabled:opacity-50">
                          {markingPaid === inv.id ? '...' : <><Check className="w-3 h-3" /> Mark Paid</>}
                        </button>
                      )}
                      {inv.status === 'paid' && inv.datePaid && (
                        <span className="text-[10px] text-green-600">Paid {new Date(inv.datePaid).toLocaleDateString()}</span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {tab === 'expenses' && (
          <div className="space-y-4">
            {projects.filter((p: any) => (p.expenses || []).length > 0).length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-xs">No expenses recorded</div>
            ) : (
              projects.filter((p: any) => (p.expenses || []).length > 0).map((project: any) => (
                <div key={project.id} className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#2a2a2a] p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{project.name}</h3>
                    <span className="text-xs font-medium text-gray-500">{formatCurrency((project.expenses || []).reduce((s: number, e: any) => s + (e.amount || 0), 0))}</span>
                  </div>
                  <div className="space-y-1.5">
                    {(project.expenses || []).map((exp: any) => (
                      <div key={exp.id} className="flex items-center gap-3 py-1.5 border-b border-gray-50 dark:border-[#222] last:border-0">
                        <div className={`w-2 h-2 rounded-full ${EXPENSE_COLORS[exp.type || exp.category] || 'bg-gray-400'}`} />
                        <span className="text-xs text-gray-700 dark:text-gray-300 flex-1">{exp.description}</span>
                        <span className="text-[10px] text-gray-400 capitalize">{exp.type || exp.category}</span>
                        <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(exp.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'pnl' && (
          <div className="max-w-xl space-y-4">
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#2a2a2a] p-5">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Profit & Loss Statement</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-2">Revenue</p>
                  <div className="space-y-1.5 pl-3">
                    <div className="flex justify-between text-xs"><span className="text-gray-600 dark:text-gray-400">Collected Payments</span><span className="text-green-600 font-medium">{formatCurrency(financials.totalPaid)}</span></div>
                    <div className="flex justify-between text-xs"><span className="text-gray-600 dark:text-gray-400">Outstanding Receivables</span><span className="text-blue-600 font-medium">{formatCurrency(financials.totalOutstanding)}</span></div>
                  </div>
                  <div className="flex justify-between text-xs font-semibold mt-2 pt-2 border-t border-gray-100 dark:border-[#222]">
                    <span>Total Revenue</span><span>{formatCurrency(financials.totalPaid + financials.totalOutstanding)}</span>
                  </div>
                </div>
                <div className="border-t border-gray-200 dark:border-[#2a2a2a]" />
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-2">Expenses</p>
                  <div className="space-y-1.5 pl-3">
                    {Object.entries(financials.expensesByCategory).sort((a, b) => b[1] - a[1]).map(([cat, amount]) => (
                      <div key={cat} className="flex justify-between text-xs"><span className="text-gray-600 dark:text-gray-400 capitalize">{cat}</span><span className="text-red-600 font-medium">-{formatCurrency(amount)}</span></div>
                    ))}
                  </div>
                  <div className="flex justify-between text-xs font-semibold mt-2 pt-2 border-t border-gray-100 dark:border-[#222]">
                    <span>Total Expenses</span><span className="text-red-600">-{formatCurrency(totalExpenses)}</span>
                  </div>
                </div>
                <div className="border-t-2 border-gray-900 dark:border-gray-100" />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-gray-900 dark:text-gray-100">Net Profit</span>
                  <div className="text-right">
                    <span className={`text-lg font-bold ${financials.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(financials.netProfit)}</span>
                    <p className="text-[10px] text-gray-400">{financials.profitMargin}% margin</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
