export type TemplateType = 'form' | 'workspace' | 'company'

export interface FormTemplate {
  id: string
  name: string
  description?: string
  type: 'invoice' | 'estimate' | 'contract' | 'change-order' | 'proposal'
  lineItems: Array<{
    id: string
    description: string
    materialCost: number
    laborCost: number
    materialMargin: number
    laborMargin: number
    quantity: number
  }>
  notes?: string
  terms?: string
  createdAt: string
  updatedAt: string
}

export interface WorkspaceTemplate {
  id: string
  name: string
  description?: string
  layout: {
    openWindows: string[] // Card IDs
    windowPositions: Record<string, { x: number; y: number }>
    windowSizes: Record<string, { width: number; height: number }>
    activeFilters?: any
    dockOrder?: string[]
  }
  createdAt: string
  updatedAt: string
}

export interface CompanyInfoTemplate {
  id: string
  name: string // e.g., "Main Company", "DBA: Roofing Pro", "LLC Entity"
  isDefault: boolean
  companyName: string
  address: string
  phone: string
  email: string
  website?: string
  logo?: string
  taxId?: string
  licenseNumber?: string
  insuranceInfo?: string
  formPrefixes: {
    invoice: string
    estimate: string
    contract: string
    changeOrder: string
    proposal: string
  }
  formCounters: {
    invoice: number
    estimate: number
    contract: number
    changeOrder: number
    proposal: number
  }
  createdAt: string
  updatedAt: string
}

export interface Template {
  id: string
  templateType: TemplateType
  data: FormTemplate | WorkspaceTemplate | CompanyInfoTemplate
}
