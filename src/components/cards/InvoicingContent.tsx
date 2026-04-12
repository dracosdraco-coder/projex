'use client'

import { Project, FormDocument } from '@/types'
import { formatCurrency, calculateFormTotals } from '@/lib/utils'
import EmptyState from '@/components/ui/EmptyState'

interface InvoicingContentProps {
  projects: Project[]
  documents: FormDocument[]
  onNewInvoice?: () => void
  onDeleteInvoice?: (invoiceId: string) => void
}

export default function InvoicingContent({ 
  projects = [], 
  documents = [], 
  onNewInvoice,
  onDeleteInvoice,
}: InvoicingContentProps) {
  const invoices = documents?.filter(d => d.type === 'invoice') || []
  
  const outstanding = invoices.filter(i => i.status === 'sent').reduce((sum, i) => sum + calculateFormTotals(i.lineItems).totalPrice, 0)
  const paid = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + calculateFormTotals(i.lineItems).totalPrice, 0)
  const draft = invoices.filter(i => i.status === 'draft').reduce((sum, i) => sum + calculateFormTotals(i.lineItems).totalPrice, 0)

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-900 dark:text-gray-100">Invoices</h3>
        <button 
          onClick={onNewInvoice}
          className="px-3 py-1.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm rounded-lg hover:bg-gray-700 dark:hover:bg-gray-300 transition-colors"
        >
          New Invoice
        </button>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 dark:bg-[#222222] rounded-xl p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Outstanding</p>
          <p className="text-2xl font-semibold text-orange-600 dark:text-orange-400">{formatCurrency(outstanding)}</p>
        </div>
        <div className="bg-gray-50 dark:bg-[#222222] rounded-xl p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Paid</p>
          <p className="text-2xl font-semibold text-green-600 dark:text-green-400">{formatCurrency(paid)}</p>
        </div>
        <div className="bg-gray-50 dark:bg-[#222222] rounded-xl p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Draft</p>
          <p className="text-2xl font-semibold text-gray-600 dark:text-gray-400">{formatCurrency(draft)}</p>
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        {invoices.length === 0 ? (
          <EmptyState
            icon="invoices"
            title="No invoices yet"
            description="Create your first invoice to start tracking payments."
            actionLabel="Create Invoice"
            onAction={onNewInvoice}
          />
        ) : (
          invoices.map((doc, index) => (
            <div
              key={doc.id}
              className={`py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-[#222222] rounded-lg px-2 -mx-2 transition-colors group ${index !== 0 ? 'border-t border-gray-100 dark:border-[#2a2a2a]' : ''}`}
            >
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">{doc.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{projects?.find(p => p.id === doc.projectId)?.name || 'Unknown Project'} • {doc.date}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(calculateFormTotals(doc.lineItems).totalPrice)}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  doc.status === 'paid' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                  doc.status === 'sent' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                  'bg-gray-100 dark:bg-[#2a2a2a] text-gray-700 dark:text-gray-300'
                }`}>
                  {doc.status}
                </span>
                {onDeleteInvoice && (
                  <button
                    onClick={() => onDeleteInvoice(doc.id)}
                    className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}