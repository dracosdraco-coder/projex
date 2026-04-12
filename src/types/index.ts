export interface Card {
  id: string
  title: string
  icon: string 
  type: string
  position: { x: number; y: number }
  size: { width: number; height: number }
  minimized: boolean
  fullscreen: boolean
  closed: boolean
  showInDock?: boolean
}

export interface TeamMember {
  id: string
  name: string
  role: 'admin' | 'manager' | 'supervisor' | 'worker',
  email?: string     
  phone?: string 
  avatar?: string
  createdAt: string
  updatedAt: string
}

export interface Expense {
  id: string
  projectId: string  // ← Make sure this exists
  type: 'labor' | 'materials' | 'equipment' | 'subcontractor' | 'other'
  description: string
  amount: number
  date: string
  createdAt: string
  updatedAt: string
}

// Timeline event for project activity log
export interface TimelineEvent {
  id: string
  type: 'proposal' | 'contract' | 'start' | 'milestone' | 'invoice' | 'payment' | 'completion' | 'note' | 'status-change' | 'progress-update'
  title: string
  description?: string
  date: string
  amount?: number
  user?: string
  metadata?: Record<string, any>
  createdAt: string
}

export interface Project {
  id: string
  name: string
  status: 'active' | 'completed' | 'on-hold'
  progress: number
  dueDate: string
  branch: string
  contractAmount: number
  expenses: Expense[]
  team: TeamMember[]
  description?: string
  client?: string
  startDate?: string
  address?: string

  

  
  // Timeline/milestone dates
  proposalDate?: string      // When proposal was sent
  contractSignedDate?: string // When contract was signed
  actualStartDate?: string   // When work actually started
  actualEndDate?: string     // When work actually ended/completed
  
  // Activity timeline
  timeline: TimelineEvent[]
  
  // Timestamps
  createdAt: string
  updatedAt: string
}


export interface ProjectFormData {
  name: string
  description?: string
  client?: string
  address?: string
  status: 'active' | 'completed' | 'on-hold'
  contractAmount?: number
  startDate?: string
  dueDate?: string
  branch?: string
}

export interface LineItem {
  id: string
  description: string
  materialCost: number
  laborCost: number
  materialMargin: number
  laborMargin: number
  quantity: number
}

export interface FormDocument {
  id: string
  title: string
  type: 'estimate' | 'invoice' | 'proposal' | 'contract' | 'change-order' | 'purchase-order' | 'work-order'
  status: 'draft' | 'sent' | 'approved' | 'paid' | 'rejected'
  date: string
  formNumber?: string
  projectId: string
  lineItems: LineItem[]
  createdAt: string
  updatedAt: string
  
  // Invoice specific
  invoiceDate?: string
  dueDate?: string
  paidDate?: string
}

export interface Message {
  id: string
  from: string
  subject: string
  preview: string
  date: string
  read: boolean
}

export interface ChatMessage {
  id: string
  sender: string
  message: string
  timestamp: string
  projectId?: string
}

export interface Meeting {
  id: string
  title: string
  date: string
  time: string
  attendees: string[]
  projectId?: string
  branchId?: string
  createdAt: string
  updatedAt: string
}

export interface Branch {
  id: string
  name: string
  location: string
  projects: string[]
  createdAt: string
  updatedAt: string
}

export type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'
