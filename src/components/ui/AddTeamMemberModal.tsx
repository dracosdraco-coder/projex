'use client'

import { useState } from 'react'
import { Modal } from './Modal'
import  LoadingSpinner  from './Loading'
import { TeamMember } from '@/types'

interface AddTeamMemberModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (member: Omit<TeamMember, 'id'>) => Promise<void>
  projectName: string
}

export default function AddTeamMemberModal({ 
  isOpen, 
  onClose, 
  onSubmit,
  projectName 
}: AddTeamMemberModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    role: 'worker' as TeamMember['role'],
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      setError('Name is required')
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit({
        ...formData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      setFormData({ name: '', role: 'worker' })
      onClose()
    } catch (error) {
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Team Member" size="sm">
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Adding to <span className="font-medium text-gray-700 dark:text-gray-300">{projectName}</span>
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => {
              setFormData(prev => ({ ...prev, name: e.target.value }))
              setError('')
            }}
            className={`w-full px-4 py-2 bg-gray-50 dark:bg-[#222222] border rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
              error ? 'border-red-500' : 'border-gray-200 dark:border-[#333333]'
            }`}
            placeholder="Enter name"
          />
          {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Role
          </label>
          <select
            value={formData.role}
            onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as TeamMember['role'] }))}
            className="w-full px-4 py-2 bg-gray-50 dark:bg-[#222222] border border-gray-200 dark:border-[#333333] rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="admin">Admin</option>
            <option value="editor">Editor</option>
          </select>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-[#2a2a2a]">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-[#2a2a2a] hover:bg-gray-200 dark:hover:bg-[#333333] rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-gray-900 dark:bg-gray-100 dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-300 rounded-lg transition-colors flex items-center gap-2"
          >
            {isSubmitting && <LoadingSpinner size="sm" />}
            Add Member
          </button>
        </div>
      </form>
    </Modal>
  )
}