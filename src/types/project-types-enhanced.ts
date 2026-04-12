// Enhanced Project Management Types
// Combines PMBOK structure with Agile flexibility

export type ProjectStatus = 
  | 'backlog'       // Agile: Not started
  | 'planning'      // PMBOK: Initiating/Planning
  | 'in-progress'   // Agile: Active sprint
  | 'on-hold'       // PMBOK: Issue/risk escalation
  | 'review'        // Agile: Sprint review
  | 'completed'     // PMBOK: Closed
  | 'cancelled'

export type ProjectType = 
  | 'residential-new'
  | 'residential-repair'
  | 'commercial-new'
  | 'commercial-repair'
  | 'emergency'

export type TaskStatus =
  | 'todo'
  | 'in-progress'
  | 'blocked'
  | 'review'
  | 'done'

export type TaskPriority = 'critical' | 'high' | 'medium' | 'low'

export interface ProjectPhase {
  id: string
  name: string
  order: number
  status: 'not-started' | 'in-progress' | 'completed'
  startDate?: string
  endDate?: string
  plannedDuration: number // days
  actualDuration?: number
  tasks: Task[]
  milestones: Milestone[]
}

export interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  assignedTo?: string[]
  estimatedHours: number
  actualHours?: number
  estimatedCost?: number
  actualCost?: number
  startDate?: string
  dueDate?: string
  completedDate?: string
  dependencies: string[]
  blockers?: string[]
  tags?: string[]
  createdAt: string
  updatedAt: string
}

export interface Milestone {
  id: string
  name: string
  description?: string
  dueDate: string
  completed: boolean
  completedDate?: string
  type: 'client-approval' | 'payment' | 'permit' | 'inspection' | 'delivery' | 'other'
  linkedTasks: string[] // task IDs that must complete
}

export interface Sprint {
  id: string
  name: string
  goal: string
  startDate: string
  endDate: string
  status: 'planned' | 'active' | 'completed'
  tasks: string[] // task IDs
  velocity?: number // story points or hours completed
  burndown?: BurndownPoint[]
}

export interface BurndownPoint {
  date: string
  remainingWork: number
  idealWork: number
}

export interface Budget {
  id: string
  category: string
  estimated: number
  actual: number
  variance: number
  changeOrders: ChangeOrder[]
}

export interface ChangeOrder {
  id: string
  description: string
  amount: number
  approved: boolean
  approvedBy?: string
  approvedDate?: string
  reason: string
}

export interface RiskRegister {
  id: string
  description: string
  probability: 'low' | 'medium' | 'high'
  impact: 'low' | 'medium' | 'high'
  mitigation: string
  owner: string
  status: 'identified' | 'monitoring' | 'mitigated' | 'occurred'
}

export interface EnhancedProject {
  // Core Info (existing)
  id: string
  name: string
  description: string
  type: ProjectType
  status: ProjectStatus
  
  // PMBOK: Integration Management
  projectCharter?: string
  objectives: string[]
  successCriteria: string[]
  constraints: string[]
  assumptions: string[]
  
  // PMBOK: Scope Management
  scope: string
  deliverables: string[]
  exclusions?: string[]
  
  // PMBOK: Schedule Management
  plannedStartDate: string
  plannedEndDate: string
  actualStartDate?: string
  actualEndDate?: string
  phases: ProjectPhase[]
  
  // Agile: Sprint Management
  sprints?: Sprint[]
  currentSprint?: string // sprint ID
  velocity?: number[] // historical velocity
  
  // PMBOK: Cost Management
  budgets: Budget[]
  totalBudget: number
  totalActual: number
  profitMargin: number
  
  // PMBOK: Quality Management
  qualityMetrics?: QualityMetric[]
  inspections?: Inspection[]
  
  // PMBOK: Resource Management
  teamMembers: TeamMember[]
  equipment?: Equipment[]
  
  // PMBOK: Risk Management
  risks: RiskRegister[]
  
  // PMBOK: Communications
  stakeholders: Stakeholder[]
  communicationPlan?: CommunicationPlan[]
  
  // PMBOK: Procurement
  contracts?: Contract[]
  vendors?: Vendor[]
  
  // Agile: Retrospectives
  retrospectives?: Retrospective[]
  
  // Tracking
  createdAt: string
  updatedAt: string
  createdBy: string
  lastModifiedBy: string
}

export interface TeamMember {
  id: string
  name: string
  role: string
  availability: number // percentage
  assignedTasks: string[]
  skills: string[]
}

export interface QualityMetric {
  id: string
  metric: string
  target: number
  actual?: number
  unit: string
  status: 'on-track' | 'at-risk' | 'off-track'
}

export interface Inspection {
  id: string
  type: string
  scheduledDate: string
  completedDate?: string
  passed: boolean
  notes: string
  inspector?: string
}

export interface Stakeholder {
  id: string
  name: string
  role: 'client' | 'sponsor' | 'team' | 'vendor' | 'authority'
  interest: 'high' | 'medium' | 'low'
  influence: 'high' | 'medium' | 'low'
  communicationPreference: string
}

export interface CommunicationPlan {
  stakeholder: string
  frequency: string
  method: string
  content: string
}

export interface Contract {
  id: string
  vendor: string
  type: string
  value: number
  startDate: string
  endDate: string
  terms: string
}

export interface Vendor {
  id: string
  name: string
  type: string
  contact: string
  rating?: number
}

export interface Equipment {
  id: string
  name: string
  type: string
  assignedTo?: string
  status: 'available' | 'in-use' | 'maintenance'
}

export interface Retrospective {
  id: string
  sprintId?: string
  date: string
  wentWell: string[]
  needsImprovement: string[]
  actionItems: ActionItem[]
}

export interface ActionItem {
  id: string
  description: string
  owner: string
  dueDate: string
  completed: boolean
}

// Default project phases by type
export const DEFAULT_PHASES: Record<ProjectType, Omit<ProjectPhase, 'id' | 'tasks' | 'milestones'>[]> = {
  'residential-new': [
    { name: 'Pre-Construction', order: 1, status: 'not-started', plannedDuration: 14 },
    { name: 'Foundation', order: 2, status: 'not-started', plannedDuration: 7 },
    { name: 'Framing', order: 3, status: 'not-started', plannedDuration: 14 },
    { name: 'MEP Rough-In', order: 4, status: 'not-started', plannedDuration: 10 },
    { name: 'Insulation & Drywall', order: 5, status: 'not-started', plannedDuration: 7 },
    { name: 'Finishes', order: 6, status: 'not-started', plannedDuration: 14 },
    { name: 'Final Inspection', order: 7, status: 'not-started', plannedDuration: 3 },
  ],
  'residential-repair': [
    { name: 'Assessment', order: 1, status: 'not-started', plannedDuration: 2 },
    { name: 'Planning & Permits', order: 2, status: 'not-started', plannedDuration: 5 },
    { name: 'Execution', order: 3, status: 'not-started', plannedDuration: 10 },
    { name: 'Quality Check', order: 4, status: 'not-started', plannedDuration: 2 },
  ],
  'commercial-new': [
    { name: 'Design & Engineering', order: 1, status: 'not-started', plannedDuration: 30 },
    { name: 'Permits & Approvals', order: 2, status: 'not-started', plannedDuration: 14 },
    { name: 'Site Preparation', order: 3, status: 'not-started', plannedDuration: 10 },
    { name: 'Foundation & Structure', order: 4, status: 'not-started', plannedDuration: 45 },
    { name: 'MEP Systems', order: 5, status: 'not-started', plannedDuration: 30 },
    { name: 'Interior Build-Out', order: 6, status: 'not-started', plannedDuration: 45 },
    { name: 'Testing & Commissioning', order: 7, status: 'not-started', plannedDuration: 14 },
    { name: 'Final Inspection & Handover', order: 8, status: 'not-started', plannedDuration: 7 },
  ],
  'commercial-repair': [
    { name: 'Inspection & Assessment', order: 1, status: 'not-started', plannedDuration: 5 },
    { name: 'Design & Permits', order: 2, status: 'not-started', plannedDuration: 10 },
    { name: 'Execution', order: 3, status: 'not-started', plannedDuration: 20 },
    { name: 'Testing & Sign-Off', order: 4, status: 'not-started', plannedDuration: 5 },
  ],
  'emergency': [
    { name: 'Immediate Response', order: 1, status: 'not-started', plannedDuration: 1 },
    { name: 'Assessment', order: 2, status: 'not-started', plannedDuration: 1 },
    { name: 'Temporary Repairs', order: 3, status: 'not-started', plannedDuration: 2 },
    { name: 'Permanent Solution', order: 4, status: 'not-started', plannedDuration: 7 },
  ],
}

// Status workflow rules
export const STATUS_WORKFLOWS: Record<ProjectType, ProjectStatus[]> = {
  'residential-new': ['backlog', 'planning', 'in-progress', 'review', 'completed'],
  'residential-repair': ['backlog', 'planning', 'in-progress', 'completed'],
  'commercial-new': ['backlog', 'planning', 'in-progress', 'on-hold', 'review', 'completed'],
  'commercial-repair': ['backlog', 'planning', 'in-progress', 'review', 'completed'],
  'emergency': ['backlog', 'in-progress', 'completed'],
}
