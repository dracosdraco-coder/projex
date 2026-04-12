'use client'

import { useState } from 'react'
import { X, Save, Briefcase } from 'lucide-react'

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

export default function CreateProjectModal({
  initialData,
  onSave,
  onClose,
}: CreateProjectModalProps) {
  const [formData, setFormData] = useState({
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
  })

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
  }

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4" style={{ animation: 'popup-in 0.15s ease-out' }}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-[#1a1a1a] rounded-2xl w-full max-w-2xl shadow-2xl border border-gray-200 dark:border-[#2a2a2a] max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-[#2a2a2a] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Create New Project</h2>
              <p className="text-sm text-gray-500">Link this document to a project</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-[#252525] rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Project Name */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Project Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-[#333] rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Johnson Roof Replacement"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-[#333] rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Project details..."
            />
          </div>

          {/* Client Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Client Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.client}
                onChange={e => setFormData({ ...formData, client: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-[#333] rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Client name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Client Email</label>
              <input
                type="email"
                value={formData.clientEmail}
                onChange={e => setFormData({ ...formData, clientEmail: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-[#333] rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="client@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Client Phone</label>
              <input
                type="tel"
                value={formData.clientPhone}
                onChange={e => setFormData({ ...formData, clientPhone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-[#333] rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="(555) 123-4567"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-[#333] rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Project address"
              />
            </div>
          </div>

          {/* Dates & Budget */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-[#333] rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Due Date</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-[#333] rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Contract Amount</label>
              <input
                type="number"
                step="0.01"
                value={formData.contractAmount}
                onChange={e => setFormData({ ...formData, contractAmount: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-[#333] rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={formData.status}
              onChange={e => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-[#333] rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="on-hold">On Hold</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </form>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-[#2a2a2a] px-6 py-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-[#333] rounded-lg hover:bg-gray-50 dark:hover:bg-[#252525]"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Create Project
          </button>
        </div>
      </div>
    </div>
  )
}
