'use client'

import { useState } from 'react'
import { useTemplates } from '@/hooks/useTemplates'
import { CompanyInfoTemplate } from '@/types/templates'

export default function TemplatesContent() {
  const [activeTab, setActiveTab] = useState<'company' | 'form' | 'workspace'>('company')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingCompany, setEditingCompany] = useState<CompanyInfoTemplate | null>(null)
  
  const {
    getCompanyInfoTemplates,
    getDefaultCompanyInfo,
    createCompanyInfoTemplate,
    updateTemplate,
    deleteTemplate,
    setDefaultCompanyInfo,
  } = useTemplates()

  const tabs = [
    { id: 'company' as const, label: 'Company Profiles' },
    { id: 'form' as const, label: 'Form Templates' },
    { id: 'workspace' as const, label: 'Workspaces' },
  ]

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#1a1a1a]">
      {/* Tabs */}
      <div className="flex gap-1 px-6 pt-4 border-b border-gray-200 dark:border-[#2a2a2a]">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all ${
              activeTab === tab.id
                ? 'bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-[#000000]">
        <div className="p-6">
          {/* Company Info Tab */}
          {activeTab === 'company' && (
            <CompanyInfoTab
              companies={getCompanyInfoTemplates()}
              defaultCompany={getDefaultCompanyInfo()}
              onCreateCompany={() => setShowCreateModal(true)}
              onEditCompany={(company) => setEditingCompany(company)}
              onSetDefault={setDefaultCompanyInfo}
              onDelete={deleteTemplate}
            />
          )}

          {/* Form Templates Tab */}
          {activeTab === 'form' && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-[#2c2c2e] flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">Form Templates</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-md">
                Save reusable form templates with pre-filled line items and settings
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-6">Coming Soon</p>
            </div>
          )}

          {/* Workspace Templates Tab */}
          {activeTab === 'workspace' && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-[#2c2c2e] flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">Workspace Templates</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-md">
                Save and restore your window layouts and workspace configurations
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-6">Coming Soon</p>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Company Modal */}
      {(showCreateModal || editingCompany) && (
        <CompanyModal
          company={editingCompany}
          onClose={() => {
            setShowCreateModal(false)
            setEditingCompany(null)
          }}
          onSave={(data) => {
            if (editingCompany) {
              updateTemplate(editingCompany.id, data)
            } else {
              createCompanyInfoTemplate(data)
            }
            setShowCreateModal(false)
            setEditingCompany(null)
          }}
        />
      )}
    </div>
  )
}

// Company Info Tab Component
function CompanyInfoTab({ 
  companies, 
  defaultCompany,
  onCreateCompany,
  onEditCompany,
  onSetDefault,
  onDelete 
}: {
  companies: CompanyInfoTemplate[]
  defaultCompany: CompanyInfoTemplate | null
  onCreateCompany: () => void
  onEditCompany: (company: CompanyInfoTemplate) => void
  onSetDefault: (id: string) => void
  onDelete: (id: string) => void
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            Company Profiles
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage business entities and company information
          </p>
        </div>
        <button
          onClick={onCreateCompany}
          className="px-4 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
        >
          New Company
        </button>
      </div>

      {companies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-gray-300 dark:border-[#2c2c2e] rounded-xl bg-white dark:bg-[#1c1c1e]">
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-[#2c2c2e] flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <p className="text-base font-medium text-gray-900 dark:text-white mb-2">No company profiles</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 text-center max-w-sm">
            Create your first company profile to manage business information and branding
          </p>
          <button
            onClick={onCreateCompany}
            className="px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
          >
            Create Company Profile
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {companies.map(company => (
            <div
              key={company.id}
              className={`p-6 rounded-xl border transition-all ${
                company.isDefault
                  ? 'border-gray-900 dark:border-white bg-white dark:bg-[#1c1c1e] shadow-sm'
                  : 'border-gray-200 dark:border-[#2c2c2e] bg-white dark:bg-[#1c1c1e] hover:border-gray-300 dark:hover:border-[#3c3c3e]'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                      {company.name}
                    </h3>
                    {company.isDefault && (
                      <span className="px-2 py-0.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-medium rounded-md">
                        DEFAULT
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    {company.companyName}
                  </p>
                  <div className="space-y-1.5 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-start gap-2">
                      <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{company.address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span>{company.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span>{company.email}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2 ml-6">
                  <button
                    onClick={() => onEditCompany(company)}
                    className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2c2c2e] rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </button>
                  
                  {!company.isDefault && (
                    <button
                      onClick={() => onSetDefault(company.id)}
                      className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2c2c2e] rounded-lg transition-colors"
                    >
                      Set as Default
                    </button>
                  )}
                  
                  <button
                    onClick={() => {
                      if (confirm('Delete this company profile? This action cannot be undone.')) {
                        onDelete(company.id)
                      }
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Company Create/Edit Modal
function CompanyModal({ 
  company,
  onClose, 
  onSave
}: {
  company: CompanyInfoTemplate | null
  onClose: () => void
  onSave: (data: Omit<CompanyInfoTemplate, 'id' | 'createdAt' | 'updatedAt'>) => void
}) {
  const [formData, setFormData] = useState({
    name: company?.name || '',
    companyName: company?.companyName || '',
    address: company?.address || '',
    phone: company?.phone || '',
    email: company?.email || '',
    website: company?.website || '',
    taxId: company?.taxId || '',
    licenseNumber: company?.licenseNumber || '',
    isDefault: company?.isDefault || false,
  })

  const handleSubmit = () => {
    onSave({
      ...formData,
      formPrefixes: company?.formPrefixes || {
        invoice: 'INV-',
        estimate: 'EST-',
        contract: 'CON-',
        changeOrder: 'CHG-',
        proposal: 'PROP-',
      },
      formCounters: company?.formCounters || {
        invoice: 1,
        estimate: 1,
        contract: 1,
        changeOrder: 1,
        proposal: 1,
      },
    })
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-[10002]" onClick={onClose} />
      <div className="fixed inset-0 z-[10003] flex items-center justify-center p-6">
        <div className="bg-white dark:bg-[#1c1c1e] rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white dark:bg-[#1c1c1e] border-b border-gray-200 dark:border-[#2c2c2e] px-8 py-5 z-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {company ? 'Edit Company Profile' : 'New Company Profile'}
            </h2>
          </div>
          
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Profile Name
                </label>
                <input
                  type="text"
                  placeholder="Main Company"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2.5 bg-white dark:bg-[#000000] border border-gray-300 dark:border-[#2c2c2e] rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:border-transparent transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  placeholder="ABC Roofing LLC"
                  value={formData.companyName}
                  onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                  className="w-full px-3 py-2.5 bg-white dark:bg-[#000000] border border-gray-300 dark:border-[#2c2c2e] rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Address
              </label>
              <input
                type="text"
                placeholder="123 Main St, City, State 12345"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="w-full px-3 py-2.5 bg-white dark:bg-[#000000] border border-gray-300 dark:border-[#2c2c2e] rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:border-transparent transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone
                </label>
                <input
                  type="text"
                  placeholder="(555) 123-4567"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-3 py-2.5 bg-white dark:bg-[#000000] border border-gray-300 dark:border-[#2c2c2e] rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:border-transparent transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="info@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2.5 bg-white dark:bg-[#000000] border border-gray-300 dark:border-[#2c2c2e] rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Website
                </label>
                <input
                  type="text"
                  placeholder="www.company.com"
                  value={formData.website}
                  onChange={(e) => setFormData({...formData, website: e.target.value})}
                  className="w-full px-3 py-2.5 bg-white dark:bg-[#000000] border border-gray-300 dark:border-[#2c2c2e] rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:border-transparent transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tax ID
                </label>
                <input
                  type="text"
                  placeholder="12-3456789"
                  value={formData.taxId}
                  onChange={(e) => setFormData({...formData, taxId: e.target.value})}
                  className="w-full px-3 py-2.5 bg-white dark:bg-[#000000] border border-gray-300 dark:border-[#2c2c2e] rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                License Number
              </label>
              <input
                type="text"
                placeholder="LIC-123456"
                value={formData.licenseNumber}
                onChange={(e) => setFormData({...formData, licenseNumber: e.target.value})}
                className="w-full px-3 py-2.5 bg-white dark:bg-[#000000] border border-gray-300 dark:border-[#2c2c2e] rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:border-transparent transition-all"
              />
            </div>

            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formData.isDefault}
                onChange={(e) => setFormData({...formData, isDefault: e.target.checked})}
                className="w-4 h-4 rounded border-gray-300 dark:border-[#2c2c2e] text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Set as default company
              </span>
            </label>
          </div>

          <div className="sticky bottom-0 bg-white dark:bg-[#1c1c1e] border-t border-gray-200 dark:border-[#2c2c2e] px-8 py-5 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-[#2c2c2e] text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-[#2c2c2e] transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!formData.name || !formData.companyName || !formData.address || !formData.phone || !formData.email}
              className="flex-1 px-4 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {company ? 'Save Changes' : 'Create Company'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}