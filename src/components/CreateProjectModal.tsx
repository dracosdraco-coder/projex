'use client'

import { X, Save, Briefcase, RotateCcw } from 'lucide-react'
import { useFormDraft } from '@/hooks/useFormDraft'

interface CreateProjectModalProps {
  initialData?: {
    clientName?: string
    clientEmail?: string
    clientPhone?: string
    clientAddress?: string
  }
  onSave: (data: any) => void
  onClose: () => void
}

const INPUT = 'bg-gray-50 dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-xl px-3 py-2.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100'

export default function CreateProjectModal({
  initialData,
  onSave,
  onClose,
}: CreateProjectModalProps) {
  const initial = {
    name: '',
    description: '',
    client: initialData?.clientName || '',
    clientEmail: initialData?.clientEmail || '',
    clientPhone: initialData?.clientPhone || '',
    address: initialData?.clientAddress || '',
    startDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    contractAmount: '',
    status: 'active',
  }

  const { values: formData, update, clearDraft, hasDraft } = useFormDraft('create_project', initial)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const projectData = {
      name: formData.name,
      description: formData.description,
      clientName: formData.client,
      clientEmail: formData.clientEmail,
      clientPhone: formData.clientPhone,
      address: formData.address,
      startDate: formData.startDate,
      endDate: formData.dueDate,
      contractAmount: parseFloat(formData.contractAmount) || 0,
      status: formData.status,
    }
    onSave(projectData)
    clearDraft()
  }

  return (
    <div
      className="fixed inset-0 z-[500] flex items-end sm:items-center justify-center"
      style={{ animation: 'popup-in 0.15s ease-out' }}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white dark:bg-[#1a1a1a] rounded-t-3xl sm:rounded-2xl w-full sm:max-w-2xl shadow-2xl border border-gray-200 dark:border-[#2a2a2a] max-h-[92dvh] overflow-y-auto pb-[env(safe-area-inset-bottom)]">
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>

        {/* Header */}
        <div className="border-b border-gray-200 dark:border-[#2a2a2a] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 tracking-[-0.03em]">
                Create New Project
              </h2>
              {hasDraft && (
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[10px] text-amber-600 dark:text-amber-400">Draft restored</span>
                  <button
                    type="button"
                    onClick={clearDraft}
                    className="text-[10px] text-gray-400 hover:text-gray-600 flex items-center gap-0.5"
                  >
                    <RotateCcw className="w-2.5 h-2.5" /> Clear
                  </button>
                </div>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-[#252525] rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Project Name */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Project Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={e => update({ name: e.target.value })}
              className={INPUT}
              placeholder="e.g., Johnson Roof Replacement"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Description</label>
            <textarea
              value={formData.description}
              onChange={e => update({ description: e.target.value })}
              className={INPUT + ' resize-none'}
              rows={2}
              placeholder="Project details..."
            />
          </div>

          {/* Client Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Client Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.client}
                onChange={e => update({ client: e.target.value })}
                className={INPUT}
                placeholder="Client name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Client Email</label>
              <input
                type="email"
                value={formData.clientEmail}
                onChange={e => update({ clientEmail: e.target.value })}
                className={INPUT}
                placeholder="client@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Client Phone</label>
              <input
                type="tel"
                value={formData.clientPhone}
                onChange={e => update({ clientPhone: e.target.value })}
                className={INPUT}
                placeholder="(555) 123-4567"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={e => update({ address: e.target.value })}
                className={INPUT}
                placeholder="Project address"
              />
            </div>
          </div>

          {/* Dates & Budget */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Start Date</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={e => update({ startDate: e.target.value })}
                className={INPUT}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Due Date</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={e => update({ dueDate: e.target.value })}
                className={INPUT}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Contract Amount</label>
              <input
                type="number"
                step="0.01"
                value={formData.contractAmount}
                onChange={e => update({ contractAmount: e.target.value })}
                className={INPUT}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Status</label>
            <select
              value={formData.status}
              onChange={e => update({ status: e.target.value })}
              className={INPUT}
            >
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="on-hold">On Hold</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </form>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-[#2a2a2a] px-6 py-4 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 sm:flex-none sm:w-auto px-4 py-2 border border-gray-300 dark:border-[#333] rounded-xl hover:bg-gray-50 dark:hover:bg-[#252525] text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit as any}
            className="flex-1 sm:flex-none sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center justify-center gap-2 text-sm font-medium"
          >
            <Save className="w-4 h-4" />
            Create Project
          </button>
        </div>
      </div>
    </div>
  )
}
