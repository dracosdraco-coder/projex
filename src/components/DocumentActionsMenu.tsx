'use client'

import { useState } from 'react'
import { 
  Edit, 
  Copy, 
  Send, 
  Download,
  Trash2,
  ArrowRightLeft,
  Eye,
  FileText,
  Mail,
  Share2,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react'

interface DocumentActionsMenuProps {
  document: any
  onEdit: () => void
  onDuplicate: () => void
  onConvert: () => void
  onSend: () => void
  onDownload: () => void
  onDelete: () => void
  onUpdateStatus: (status: string) => void
  onView?: () => void
}

export default function DocumentActionsMenu({
  document,
  onEdit,
  onDuplicate,
  onConvert,
  onSend,
  onDownload,
  onDelete,
  onUpdateStatus,
  onView,
}: DocumentActionsMenuProps) {
  const [showStatusMenu, setShowStatusMenu] = useState(false)

  const statusOptions = [
    { value: 'draft', label: 'Draft', icon: Clock, color: 'gray' },
    { value: 'sent', label: 'Sent', icon: Send, color: 'blue' },
    { value: 'approved', label: 'Approved', icon: CheckCircle, color: 'green' },
    { value: 'rejected', label: 'Rejected', icon: XCircle, color: 'red' },
    ...(document.type === 'invoice' ? [
      { value: 'paid', label: 'Paid', icon: CheckCircle, color: 'emerald' }
    ] : []),
  ]

  return (
    <div className="relative">
      <div className="bg-white dark:bg-[#1a1a1a] rounded-lg shadow-lg border border-gray-200 dark:border-[#2a2a2a] py-1 min-w-48">
        {/* View/Edit */}
        {onView && (
          <button
            onClick={onView}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-[#252525] flex items-center gap-3 text-gray-700 dark:text-gray-300"
          >
            <Eye className="w-4 h-4" />
            View Details
          </button>
        )}
        
        <button
          onClick={onEdit}
          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-[#252525] flex items-center gap-3 text-gray-700 dark:text-gray-300"
        >
          <Edit className="w-4 h-4" />
          Edit
        </button>

        <div className="border-t border-gray-100 dark:border-[#2a2a2a] my-1" />

        {/* Status */}
        <div className="relative">
          <button
            onClick={() => setShowStatusMenu(!showStatusMenu)}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-[#252525] flex items-center gap-3 text-gray-700 dark:text-gray-300"
          >
            <FileText className="w-4 h-4" />
            Change Status
          </button>

          {showStatusMenu && (
            <div className="absolute left-full top-0 ml-1 bg-white dark:bg-[#1a1a1a] rounded-lg shadow-lg border border-gray-200 dark:border-[#2a2a2a] py-1 min-w-40">
              {statusOptions.map(status => {
                const Icon = status.icon
                return (
                  <button
                    key={status.value}
                    onClick={() => {
                      onUpdateStatus(status.value)
                      setShowStatusMenu(false)
                    }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-[#252525] flex items-center gap-3 ${
                      document.status === status.value
                        ? 'bg-gray-50 dark:bg-[#252525]'
                        : ''
                    }`}
                  >
                    <Icon className={`w-4 h-4 text-${status.color}-600`} />
                    {status.label}
                    {document.status === status.value && (
                      <span className="ml-auto text-xs text-gray-500">✓</span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 dark:border-[#2a2a2a] my-1" />

        {/* Actions */}
        <button
          onClick={onDuplicate}
          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-[#252525] flex items-center gap-3 text-gray-700 dark:text-gray-300"
        >
          <Copy className="w-4 h-4" />
          Duplicate
        </button>

        <button
          onClick={onConvert}
          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-[#252525] flex items-center gap-3 text-gray-700 dark:text-gray-300"
        >
          <ArrowRightLeft className="w-4 h-4" />
          Convert To...
        </button>

        <div className="border-t border-gray-100 dark:border-[#2a2a2a] my-1" />

        {/* Communication */}
        <button
          onClick={onSend}
          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-[#252525] flex items-center gap-3 text-gray-700 dark:text-gray-300"
        >
          <Send className="w-4 h-4" />
          Send to Client
        </button>

        <button
          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-[#252525] flex items-center gap-3 text-gray-700 dark:text-gray-300"
        >
          <Mail className="w-4 h-4" />
          Email Preview
        </button>

        <button
          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-[#252525] flex items-center gap-3 text-gray-700 dark:text-gray-300"
        >
          <Share2 className="w-4 h-4" />
          Share Link
        </button>

        <div className="border-t border-gray-100 dark:border-[#2a2a2a] my-1" />

        {/* Download */}
        <button
          onClick={onDownload}
          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-[#252525] flex items-center gap-3 text-gray-700 dark:text-gray-300"
        >
          <Download className="w-4 h-4" />
          Download PDF
        </button>

        <button
          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-[#252525] flex items-center gap-3 text-gray-700 dark:text-gray-300"
        >
          <FileText className="w-4 h-4" />
          Download .PX (Editable)
        </button>

        <div className="border-t border-gray-100 dark:border-[#2a2a2a] my-1" />

        {/* Delete */}
        <button
          onClick={onDelete}
          className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 text-red-600 dark:text-red-400"
        >
          <Trash2 className="w-4 h-4" />
          Delete
        </button>
      </div>
    </div>
  )
}

// Compact version for inline actions
export function DocumentQuickActions({
  document,
  onEdit,
  onDuplicate,
  onConvert,
  onSend,
  onDownload,
  onDelete,
}: Omit<DocumentActionsMenuProps, 'onUpdateStatus'>) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={onEdit}
        className="p-2 hover:bg-gray-100 dark:hover:bg-[#252525] rounded-lg transition-colors"
        title="Edit"
      >
        <Edit className="w-4 h-4" />
      </button>
      
      <button
        onClick={onDuplicate}
        className="p-2 hover:bg-gray-100 dark:hover:bg-[#252525] rounded-lg transition-colors"
        title="Duplicate"
      >
        <Copy className="w-4 h-4" />
      </button>
      
      <button
        onClick={onConvert}
        className="p-2 hover:bg-gray-100 dark:hover:bg-[#252525] rounded-lg transition-colors"
        title="Convert"
      >
        <ArrowRightLeft className="w-4 h-4" />
      </button>
      
      <button
        onClick={onSend}
        className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
        title="Send"
      >
        <Send className="w-4 h-4 text-blue-600" />
      </button>
      
      <button
        onClick={onDownload}
        className="p-2 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
        title="Download"
      >
        <Download className="w-4 h-4 text-green-600" />
      </button>
      
      <button
        onClick={onDelete}
        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
        title="Delete"
      >
        <Trash2 className="w-4 h-4 text-red-600" />
      </button>
    </div>
  )
}
