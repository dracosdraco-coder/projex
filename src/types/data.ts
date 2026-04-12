// ==================== STORAGE & DOCUMENTS ====================

export interface StorageDocument {
  id: string
  projectId: string
  name: string
  type: 'contract' | 'permit' | 'photo' | 'invoice' | 'other' | 'projex'
  fileUrl: string
  fileSize: number
  mimeType: string
  uploadedAt: string
}

// ==================== CALENDAR ====================

export interface CalendarEvent {
  id: string
  title: string
  description?: string
  location?: string
  startTime: string
  endTime: string
  allDay: boolean
  type: 'meeting' | 'deadline' | 'milestone' | 'appointment' | 'reminder' | 'other'
  projectId?: string
  attendees: string[]
  color?: string
  recurring: boolean
  recurrenceRule?: string
  recurrenceEnd?: string
  createdAt: string
  updatedAt: string
}

// ==================== MESSAGES ====================

export interface Message {
  id: string
  projectId?: string
  branchId?: string
  senderName: string
  content: string
  attachments: MessageAttachment[]
  createdAt: string
  updatedAt: string
}

export interface MessageAttachment {
  id: string
  fileName: string
  fileUrl: string
  fileType: string
  fileSize: number
  uploadedAt: string
}

// ==================== TASKS ====================

export interface Task {
  id: string
  projectId: string
  projectName?: string
  title: string
  description?: string
  status: 'todo' | 'in-progress' | 'review' | 'completed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assignedTo?: string
  assignedToName?: string
  dueDate?: string
  completedAt?: string
  comments: TaskComment[]
  createdAt: string
  updatedAt: string
}

export interface TaskComment {
  id: string
  commenterName: string
  content: string
  createdAt: string
}

// ==================== PHASES ====================

export interface Phase {
  id: string
  userId: string
  projectId: string
  name: string
  description?: string
  startDate: string
  endDate: string
  plannedDuration: number
  milestones: Milestone[]
  status: 'not-started' | 'in-progress' | 'completed'
  color: string
  order: number
  tasks: Task[]
  createdAt: string
  updatedAt: string
}

export interface Milestone {
  id: string
  name: string
  date: string
  completed: boolean
}

// ==================== FORMS & TEMPLATES ====================

export interface ProjectFormData {
  name: string
  description?: string
  client?: string
  status?: 'active' | 'completed' | 'on-hold'
  contractAmount: number
  startDate?: string
  dueDate: string
  branch?: string
  address?: string
}

export interface MeetingFormData {
  title: string
  date: string
  time: string
  attendees: string[]
  projectId?: string
  branchId?: string
}

export interface LineItemTemplate {
  id: string
  userId: string
  category: 'labor' | 'materials' | 'equipment' | 'subcontractor' | 'other'
  name: string
  description?: string
  unit: string
  cost: number
  price: number
  marginPercent?: number
  taxRate: number
  isTaxable: boolean
  notes?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface FormTemplate {
  id: string
  userId: string
  type: 'estimate' | 'invoice' | 'work_order' | 'change_order' | 'purchase_order'
  name: string
  companyName?: string
  companyLogoUrl?: string
  companyAddress?: string
  companyPhone?: string
  companyEmail?: string
  companyWebsite?: string
  showMargins: boolean
  terms?: string
  notes?: string
  footer?: string
  lineItems: any[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface GeneratedDocument {
  id: string
  userId: string
  projectId?: string
  type: 'estimate' | 'invoice' | 'work_order' | 'change_order' | 'purchase_order' | 'proposal' | 'contract'
  documentNumber: string
  status: 'draft' | 'sent' | 'viewed' | 'approved' | 'rejected' | 'paid' | 'void'
  dateIssued: string
  dateDue?: string
  dateSent?: string
  dateApproved?: string
  datePaid?: string
  companyName?: string
  companyLogoUrl?: string
  companyAddress?: string
  companyPhone?: string
  companyEmail?: string
  companyWebsite?: string
  clientName?: string
  clientEmail?: string
  clientPhone?: string
  clientAddress?: string
  lineItems: any[]
  subtotal: number
  taxTotal: number
  total: number
  costTotal: number
  profit?: number
  marginPercent?: number
  terms?: string
  notes?: string
  footer?: string
  pxFilePath?: string
  pdfFilePath?: string
  attachedPdfs?: any[]
  parentDocumentId?: string
  paymentMethod?: string
  paymentReference?: string
  amountPaid: number
  createdAt: string
  updatedAt: string
}
