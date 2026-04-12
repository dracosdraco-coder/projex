'use client'

import { useTemplates } from './useTemplates'

export function useCompanySettings() {
  const { getDefaultCompanyInfo, getNextFormNumber: getTemplateFormNumber } = useTemplates()
  const settings = getDefaultCompanyInfo()

  const getNextFormNumber = (formType: 'invoice' | 'estimate' | 'contract' | 'changeOrder' | 'proposal') => {
    if (!settings) {
      // Fallback if no company set up yet
      return `${formType.toUpperCase().slice(0, 3)}-001`
    }
    
    return getTemplateFormNumber(settings.id, formType) || `${formType.toUpperCase().slice(0, 3)}-001`
  }

  return {
    settings: settings || {
      companyName: 'Your Company Name',
      address: '123 Main St, City, State 12345',
      phone: '(555) 123-4567',
      email: 'info@company.com',
    },
    getNextFormNumber,
  }
}