'use client'

import { Project, FormDocument } from '@/types'
import { formatCurrency, calculateFormTotals } from '@/lib/utils'
import EmptyState from '@/components/ui/EmptyState'

interface EstimatingContentProps {
  projects: Project[]
  documents: FormDocument[]
  onNewEstimate?: () => void
  onDeleteEstimate?: (estimateId: string) => void
}

export default function EstimatingContent({ 
  projects = [], 
  documents = [], 
  onNewEstimate,
  onDeleteEstimate,
}: EstimatingContentProps) {
  const estimates = documents?.filter(d => d.type === 'estimate') || []
  
  const pending = estimates.filter(e => e.status === 'sent').length
  const approved = estimates.filter(e => e.status === 'approved').length
  const totalValue = estimates.reduce((sum, e) => sum + calculateFormTotals(e.lineItems).totalPrice, 0)

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-900 dark:text-gray-100">Estimates</h3>
        <button 
          onClick={onNewEstimate}
          className="px-3 py-1.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm rounded-lg hover:bg-gray-700 dark:hover:bg-gray-300 transition-colors"
        >
          New Estimate
        </button>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 dark:bg-[#222222] rounded-xl p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Pending</p>
          <p className="text-2xl font-semibold text-orange-600 dark:text-orange-400">{pending}</p>
        </div>
        <div className="bg-gray-50 dark:bg-[#222222] rounded-xl p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Approved</p>
          <p className="text-2xl font-semibold text-green-600 dark:text-green-400">{approved}</p>
        </div>
        <div className="bg-gray-50 dark:bg-[#222222] rounded-xl p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Value</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(totalValue)}</p>
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        {estimates.length === 0 ? (
          <EmptyState
            icon="estimates"
            title="No estimates yet"
            description="Create your first estimate to start tracking."
            actionLabel="Create Estimate"
            onAction={onNewEstimate}
          />
        ) : (
          estimates.map((doc, index) => (
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
                  doc.status === 'approved' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                  doc.status === 'sent' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                  'bg-gray-100 dark:bg-[#2a2a2a] text-gray-700 dark:text-gray-300'
                }`}>
                  {doc.status}
                </span>
                {onDeleteEstimate && (
                  <button
                    onClick={() => onDeleteEstimate(doc.id)}
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