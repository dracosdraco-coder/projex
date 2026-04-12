'use client'

import { useState, useEffect, useCallback } from 'react'
import { Template, FormTemplate, WorkspaceTemplate, CompanyInfoTemplate } from '@/types/templates'

const STORAGE_KEY = 'projex-templates'

export function useTemplates() {
  const [templates, setTemplates] = useState<Template[]>([])

  // Load templates from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        setTemplates(JSON.parse(saved))
      } catch (e) {
      }
    }
  }, [])

  // Save templates to localStorage
  const saveTemplates = useCallback((newTemplates: Template[]) => {
    setTemplates(newTemplates)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newTemplates))
  }, [])

  // Get templates by type
  const getTemplatesByType = useCallback((type: 'form' | 'workspace' | 'company') => {
    return templates.filter(t => t.templateType === type)
  }, [templates])

  // Get form templates by form type
  const getFormTemplatesByType = useCallback((formType: string) => {
    return templates
      .filter(t => t.templateType === 'form')
      .filter(t => (t.data as FormTemplate).type === formType)
  }, [templates])

  // Get default company info
  const getDefaultCompanyInfo = useCallback(() => {
    const companyTemplates = templates.filter(t => t.templateType === 'company')
    const defaultTemplate = companyTemplates.find(t => (t.data as CompanyInfoTemplate).isDefault)
    return defaultTemplate ? (defaultTemplate.data as CompanyInfoTemplate) : null
  }, [templates])

  // Get all company info templates
  const getCompanyInfoTemplates = useCallback(() => {
    return templates
      .filter(t => t.templateType === 'company')
      .map(t => t.data as CompanyInfoTemplate)
  }, [templates])

  // Get company by ID
  const getCompanyById = useCallback((id: string) => {
    const template = templates.find(t => 
      t.templateType === 'company' && (t.data as CompanyInfoTemplate).id === id
    )
    return template ? (template.data as CompanyInfoTemplate) : null
  }, [templates])

  // Create form template
  const createFormTemplate = useCallback((template: Omit<FormTemplate, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTemplate: Template = {
      id: `template-${Date.now()}`,
      templateType: 'form',
      data: {
        ...template,
        id: `form-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    }
    saveTemplates([...templates, newTemplate])
    return newTemplate
  }, [templates, saveTemplates])

  // Create workspace template
  const createWorkspaceTemplate = useCallback((template: Omit<WorkspaceTemplate, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTemplate: Template = {
      id: `template-${Date.now()}`,
      templateType: 'workspace',
      data: {
        ...template,
        id: `workspace-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    }
    saveTemplates([...templates, newTemplate])
    return newTemplate
  }, [templates, saveTemplates])

  // Create company info template
  const createCompanyInfoTemplate = useCallback((template: Omit<CompanyInfoTemplate, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTemplate: Template = {
      id: `template-${Date.now()}`,
      templateType: 'company',
      data: {
        ...template,
        id: `company-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    }
    
    // If this is set as default, unset other defaults
    if (template.isDefault) {
      const updatedTemplates = templates.map(t => {
        if (t.templateType === 'company') {
          return {
            ...t,
            data: { ...t.data, isDefault: false } as CompanyInfoTemplate
          }
        }
        return t
      })
      saveTemplates([...updatedTemplates, newTemplate])
    } else {
      saveTemplates([...templates, newTemplate])
    }
    
    return newTemplate
  }, [templates, saveTemplates])

  // Update template
  const updateTemplate = useCallback((id: string, updates: Partial<CompanyInfoTemplate | FormTemplate | WorkspaceTemplate>) => {
    const updatedTemplates = templates.map(t => {
      if (t.templateType === 'company' && (t.data as CompanyInfoTemplate).id === id) {
        return {
          ...t,
          data: {
            ...t.data,
            ...updates,
            updatedAt: new Date().toISOString(),
          } as CompanyInfoTemplate
        }
      }
      return t
    })
    saveTemplates(updatedTemplates)
  }, [templates, saveTemplates])

  // Delete template
  const deleteTemplate = useCallback((id: string) => {
    const updatedTemplates = templates.filter(t => {
      if (t.templateType === 'company') {
        return (t.data as CompanyInfoTemplate).id !== id
      }
      if (t.templateType === 'form') {
        return (t.data as FormTemplate).id !== id
      }
      if (t.templateType === 'workspace') {
        return (t.data as WorkspaceTemplate).id !== id
      }
      return true
    })
    saveTemplates(updatedTemplates)
  }, [templates, saveTemplates])

  // Set default company info
  const setDefaultCompanyInfo = useCallback((id: string) => {
    const updatedTemplates = templates.map(t => {
      if (t.templateType === 'company') {
        return {
          ...t,
          data: {
            ...t.data,
            isDefault: (t.data as CompanyInfoTemplate).id === id,
            updatedAt: new Date().toISOString(),
          } as CompanyInfoTemplate
        }
      }
      return t
    })
    saveTemplates(updatedTemplates)
  }, [templates, saveTemplates])

  // Get next form number for a company
  const getNextFormNumber = useCallback((companyId: string, formType: keyof CompanyInfoTemplate['formCounters']) => {
    const company = getCompanyById(companyId)
    if (!company) return null

    const currentNumber = company.formCounters[formType]
    const prefix = company.formPrefixes[formType]
    const formattedNumber = String(currentNumber).padStart(3, '0')
    
    // Increment counter
    updateTemplate(companyId, {
      formCounters: {
        ...company.formCounters,
        [formType]: currentNumber + 1,
      },
    } as Partial<CompanyInfoTemplate>)
    
    return `${prefix}${formattedNumber}`
  }, [getCompanyById, updateTemplate])

  return {
    templates,
    getTemplatesByType,
    getFormTemplatesByType,
    getDefaultCompanyInfo,
    getCompanyInfoTemplates,
    getCompanyById,
    createFormTemplate,
    createWorkspaceTemplate,
    createCompanyInfoTemplate,
    updateTemplate,
    deleteTemplate,
    setDefaultCompanyInfo,
    getNextFormNumber,
  }
}