'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useData } from '@/hooks/useData'
import { Project, Expense, TeamMember, Meeting, Branch, ResizeDirection } from '@/types'
import { useWindowManager } from '@/hooks/useWindowManager'
import { useCanvas } from '@/hooks/useCanvas'
import { useTheme } from '@/hooks/useTheme'
import { useToast } from '@/hooks/useToast'
import { ProjectPhase } from '@/types/project-types-enhanced'
import { Phase } from '@/hooks/useData'
import { Card } from '@/types'

// UI Components
import FilterBar, { FilterState } from '@/components/ui/FilterBar'
import UserProfileDropdown from '@/components/ui/UserProfileDropdown'
import DocumentViewer from '@/components/ui/DocumentViewer'
import Logo from '@/components/ui/Logo'
import ThemeToggle from '@/components/ui/ThemeToggle'
import { ToastContainer } from '@/components/ui/Toast'
import Window from '@/components/windows/Window'
import DraggableDock from '@/components/windows/DraggableDock'
import GlobalSearchModal from '@/components/ui/GlobalSearchModal'
import { ConfirmDialog } from '@/components/ui/Modal'

// Modal Components
import EditProjectModal from '@/components/ui/EditProjectModal'
import AddExpenseModal from '@/components/ui/AddExpenseModal'
import AddTeamMemberModal from '@/components/ui/AddTeamMemberModal'
import AddMeetingModal from '@/components/ui/AddMeetingModal'
import AddBranchModal from '@/components/ui/AddBranchModal'
import PhaseManagerModal from '@/components/PhaseManagerModal'
import TaskBoard from '@/components/TaskBoard'
import ProjectInitializeModal from '@/components/ProjectInitializeModal'

// Forms System Components
import TemplateManager from '@/components/TemplateManager'
import DocumentEditor from '@/components/DocumentEditor'
import ProposalBuilder from '@/components/ProposalBuilder'
import InspectionFormBuilder from '@/components/InspectionFormBuilder'
import ConversionModal from '@/components/ConversionModal'
import SendDocumentModal from '@/components/SendDocumentModal'
import CreateProjectModal from '@/components/CreateProjectModal'
import PaymentModal from '@/components/PaymentModal'
import QuickAddLineItemModal from '@/components/QuickAddLineItemModal'
import DocumentActionsMenu from '@/components/DocumentActionsMenu'

// Card Components
import MessagesContent from '@/components/cards/MessagesContent'
import TasksContent from '@/components/cards/TasksContent'
import TimelineView from '@/components/TimelineView'
import CalendarContent from '@/components/cards/CalendarContent'
import TemplatesContent from '@/components/cards/TemplatesContent'

import {
  DashboardContent,
  BudgetingContent,
  ProjectsContent,
  TeamContent,
  FormsContent,
  DocumentsContent,
  CommunicationContent,
  DrawingsContent,
  MapsContent,
  BranchesContent,
  KPIContent,
  MeetingsContent,
  ScheduleContent,
  EstimatingContent,
  InvoicingContent,
  ChatContent,
  SettingsContent,
  IntegrationsContent,
  AccountingContent,
  PhotosContent,
  CommsHubContent,
  LeadGenContent,
} from '@/components/cards'

// Context and Utilities
import { FileProvider } from '@/context/FileContext'
import { useGlobalSearch, SearchResult } from '@/hooks/useGlobalSearch'
import { generateDocumentPDF, saveProjectXFormat } from '@/lib/pdf-generator'
import { convertDocument, quickConvert } from '@/lib/document-converter'
import { useRealtime, usePresence } from '@/hooks/useRealtime'
import { useStorage } from '@/hooks/useStorage'
import { useRoles, RolesProvider, CanDo } from '@/hooks/useRoles'
import { useNotifications } from '@/hooks/useNotifications'
import NotificationBell from '@/components/ui/NotificationBell'
import { 
  initialCards, 
  mockMessages, 
  mockChatMessages, 
  formTypes,
  menuItems 
} from '@/data/mockData'
import MobileLayout from '@/components/ui/MobileLayout'
import MobileDashboard from '@/components/MobileDashboard'
import Onboarding, { HelpButton } from '@/components/Onboarding'
import { useSubscription } from '@/hooks/useSubscription'
import { useLeads } from '@/hooks/useLeads'
import { usePhotos } from '@/hooks/usePhotos'
import { useCommsLogs } from '@/hooks/useCommsLogs'
import { meetsMinimumPlan, CARD_PLAN_REQUIREMENTS, PlanId } from '@/lib/stripe-plans'

const DOCK_HEIGHT = 60

export default function AccessClient() {
  const { user, loading: authLoading, signOut } = useAuth()
  const router = useRouter()
  const { theme, toggleTheme, mounted } = useTheme()
  const [isMobile, setIsMobile] = useState(false)
  const [mobileCard, setMobileCard] = useState('dashboard')
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])
  const subscription = useSubscription()
  const searchParams = useSearchParams()
  const checkoutTriggered = useRef(false)
  const [showOnboarding, setShowOnboarding] = useState(false)

  // Show onboarding on first visit
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const seen = localStorage.getItem('projex_onboarding_seen')
      if (!seen) setShowOnboarding(true)
    }
  }, [])

  const completeOnboarding = () => {
    setShowOnboarding(false)
    if (typeof window !== 'undefined') localStorage.setItem('projex_onboarding_seen', '1')
  }

  // Auto-trigger checkout if user came from landing page with a plan selected
  useEffect(() => {
    const planParam = searchParams.get('plan') as PlanId | null
    const intervalParam = (searchParams.get('interval') || 'monthly') as 'monthly' | 'annual'
    if (planParam && !subscription.loading && !subscription.isActive && user?.id && !checkoutTriggered.current) {
      checkoutTriggered.current = true
      // Clean URL params before redirecting
      window.history.replaceState({}, '', '/access')
      subscription.startCheckout(planParam, intervalParam)
    }
  }, [searchParams, subscription.loading, subscription.isActive, user?.id])

  const { toasts, removeToast, success, error, info } = useToast()
  
  // Data hook with all forms system values
  const {
    // Org
    orgId,
    // Project data
    projects,
    meetings,
    documents,
    storageDocuments,
    branches,
    phases,
    
    // Project operations
    createProject: createProjectHook,
    updateProject: updateProjectHook,
    deleteProject: deleteProjectHook,
    
    // Phase operations
    createPhase,
    updatePhase,
    deletePhase,
    updateTaskPhase,
    
    // Expense operations
    addExpense: addExpenseHook,
    deleteExpense: deleteExpenseHook,
    updateExpense: updateExpenseHook,
    
    // Team operations
    teamMembers,
    createTeamMember,
    updateTeamMember,
    deleteTeamMember,
    assignTeamMemberToProject,
    removeTeamMemberFromProject,
    
    // Meeting operations
    createMeeting: createMeetingHook,
    deleteMeeting,
    
    // Document operations
    uploadDocument: uploadDocumentHook,
    deleteDocument: deleteDocumentHook,
    downloadDocument: downloadDocumentHook,
    
    // Branch operations
    createBranch: createBranchHook,
    updateBranch,
    deleteBranch,
    
    // Calendar operations
    events,
    createEvent,
    updateEvent,
    deleteEvent,
    
    // Message operations
    messages,
    createMessage,
    deleteMessage,
    uploadMessageAttachment,
    
    // Task operations
    tasks,
    createTask,
    updateTask,
    deleteTask,
    addTaskComment,
    
    // Forms system - Line Item Templates
    lineItemTemplates,
    createLineItemTemplate,
    updateLineItemTemplate,
    deleteLineItemTemplate,
    
    // Forms system - Form Templates
    formTemplates,
    createFormTemplate,
    updateFormTemplate,
    deleteFormTemplate,
    
    // Forms system - Generated Documents
    generatedDocuments,
    createGeneratedDocument,
    updateGeneratedDocument,
    deleteGeneratedDocument,
    getNextDocumentNumber,
    
    // Calculated values
    totalContractAmount,
    totalExpenses,
    grossProfit,
    
    // Utility
    loading: dataLoading,
    refetch,
    updateTimeline,
    updateProjectDates,
  } = useData()
  
  // Window Manager
  const {
    cards,
    openCards,
    activeCard,
    dragging,
    resizing,
    setActiveCard,
    setTransformRef,
    handleMouseDown,
    handleResizeMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleClose,
    handleMinimize,
    handleFullscreen,
    handleDockClick,
    handleDockReorder,
    handleToggleDockItem
  } = useWindowManager(initialCards)

  // Infinite canvas
  const {
    transform: canvasTransform,
    isPanning,
    mode: canvasMode,
    setMode: setCanvasMode,
    containerRef: canvasRef,
    handleCanvasMouseDown,
    onPanMove,
    endPan,
    zoomIn,
    zoomOut,
    resetView,
    fitToContent,
    zoomPercent,
  } = useCanvas()

  // --- New systems: Realtime, Storage, Notifications ---
  const storage = useStorage(user?.id)
  const { notifications, unreadCount, markRead, markAllRead, dismiss: dismissNotification, notify } = useNotifications(user?.id)
  const { leads, loadLeads, createLead, updateLead: updateLeadHook, deleteLead } = useLeads(user?.id, orgId)
  const { photos, loadPhotos, uploadPhoto, deletePhoto } = usePhotos(user?.id, orgId)
  const { logs: commsLogs, loadLogs: loadCommsLogs, addLog: addCommsLog } = useCommsLogs(user?.id, orgId)

  // Load leads, photos, commsLogs once user/org is available
  useEffect(() => {
    if (user?.id) {
      loadLeads()
      loadPhotos()
      loadCommsLogs()
    }
  }, [user?.id, orgId])

  // Realtime: subscribe to key tables and refresh local state on changes
  useRealtime({
    userId: user?.id,
    orgId,
    tables: ['projects', 'tasks', 'generated_documents', 'messages', 'notifications', 'team_members', 'org_members', 'leads', 'photos', 'comms_logs'],
    enabled: !!user?.id,
    onEvent: (event) => {
      if (event.table === 'leads') {
        loadLeads()
      } else if (event.table === 'photos') {
        loadPhotos()
      } else if (event.table === 'comms_logs') {
        loadCommsLogs()
      } else if (event.table !== 'notifications') {
        refetch()
      }
    },
  })

  // Presence — track who's online in the org
  const userName = (user as any)?.user_metadata?.full_name || user?.email?.split('@')[0] || ''
  const { onlineUsers, isOnline } = usePresence(orgId, user?.id, user?.email || '', userName)

  // Keep window manager in sync with canvas transform
  useEffect(() => {
    setTransformRef(canvasTransform)
  }, [canvasTransform, setTransformRef])

// Add state for search
const [searchQuery, setSearchQuery] = useState('')
const [showSearchModal, setShowSearchModal] = useState(false)

// Use the simpler search hook
const { search, recentSearches } = useGlobalSearch({ 
  projects, 
  documents: storageDocuments as any,
  meetings,
  branches,
  tasks,
  teamMembers,
})

// Create search results from hook
const searchResults = search(searchQuery)
const isSearching = false
const handleSearch = (query: string) => {
  setSearchQuery(query)
  setShowSearchModal(true)
}

  // Canvas zoom is handled by useCanvas hook
const [filterState, setFilterState] = useState<FilterState>({
  userRole: ['all'],
  branches: [],
  workspace: ['default'],
  dateRange: ['all-time'],
  dateCategory: ['any'],
  months: [],
  years: []
})

  // Project Management State
  const [selectedProjectForPM, setSelectedProjectForPM] = useState<string>('')
  const [initModalOpen, setInitModalOpen] = useState(false)
  const [initModalProject, setInitModalProject] = useState<{ id: string; name: string; type: string } | null>(null)
  const [selectedPhaseProject, setSelectedPhaseProject] = useState<string>('')
  const [selectedTimelineProject, setSelectedTimelineProject] = useState<string>('')
  
  // General Modals State
  const [showCreateProject, setShowCreateProject] = useState(false)
  const [showPhaseManager, setShowPhaseManager] = useState(false)
  const [selectedProjectForPhases, setSelectedProjectForPhases] = useState<string | null>(null)
  const [showEditProject, setShowEditProject] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [expenseProjectId, setExpenseProjectId] = useState<string>('')
  const [showAddMeeting, setShowAddMeeting] = useState(false)
  const [showAddTeamMember, setShowAddTeamMember] = useState(false)
  const [teamMemberProjectId, setTeamMemberProjectId] = useState<string>('')
  const [showAddBranch, setShowAddBranch] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<any | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<any>(null)

  // Forms System State
  const [showTemplateManager, setShowTemplateManager] = useState(false)
  const [showDocumentEditor, setShowDocumentEditor] = useState(false)
  const [showProposalBuilder, setShowProposalBuilder] = useState(false)
  const [showInspectionForm, setShowInspectionForm] = useState(false)
  const [showConversionModal, setShowConversionModal] = useState(false)
  const [showSendModal, setShowSendModal] = useState(false)
  const [showCreateProjectFromDoc, setShowCreateProjectFromDoc] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showQuickAddLineItem, setShowQuickAddLineItem] = useState(false)
  const [editingDocument, setEditingDocument] = useState<any | null>(null)
  const [documentType, setDocumentType] = useState<string>('estimate')

  // ============================================
  // GENERAL CRUD FUNCTIONS
  // ============================================

interface ProjectFormData {
  name: string
  description?: string
  clientName?: string
  clientEmail?: string
  clientPhone?: string
  address?: string
  startDate?: string
  endDate?: string
  dueDate?: string
  contractAmount: number
  status?: 'active' | 'completed' | 'on-hold'
}

  const createProject = async (data: ProjectFormData) => {
    try {
      // Check project limits for Duo plan (5 projects max)
      if (subscription.plan === 'duo' && projects.length >= 5) {
        error('Your Duo plan supports up to 5 active projects. Upgrade to create more.')
        return
      }

      await createProjectHook({
      ...data,
      contractAmount: data.contractAmount || 0,
      dueDate: data.dueDate || data.endDate || ''
      })
      success('Project created successfully')
      notify({ type: 'system', title: 'New Project', body: `Project "${data.name}" was created` })
      setShowCreateProject(false)
      setShowCreateProjectFromDoc(false)
    } catch (err: any) {
      error(err?.message || 'Failed to create project')
    }
  }

  const updateProject = async (projectId: string, updates: Partial<Project>) => {
    try {
      if (!projectId) {
        // Create mode — EditProjectModal sends empty id for new projects
        await createProject(updates as any)
        return
      }
      await updateProjectHook(projectId, updates)
      success('Project updated successfully')
      setShowEditProject(false)
    } catch (err) {
      error('Failed to update project')
    }
  }

  const deleteProject = async (projectId: string) => {
    try {
      await deleteProjectHook(projectId)
      success('Project deleted successfully')
    } catch (err) {
      error('Failed to delete project')
    }
  }

  const addExpense = async (expense: Omit<Expense, 'id'>) => {
    try {
      if (!expenseProjectId) throw new Error('Project ID required')
      await addExpenseHook(expenseProjectId, expense)
      success('Expense added successfully')
      setShowAddExpense(false)
      setExpenseProjectId('')
    } catch (err) {
      error('Failed to add expense')
    }
  }

  const deleteDocument = async (id: string) => {
    try {
      await deleteDocumentHook(id)
      success('Document deleted successfully')
    } catch (err) {
      error('Failed to delete document')
    }
  }

  const createMeeting = async (data: any) => {
    try {
      await createMeetingHook(data)
      success('Meeting created successfully')
      setShowAddMeeting(false)
    } catch (err) {
      error('Failed to create meeting')
    }
  }

  const createBranch = async (data: { name: string; location: string; manager?: string }) => {
    try {
      await createBranchHook(data)
      success('Branch created successfully')
      setShowAddBranch(false)
    } catch (err) {
      error('Failed to create branch')
    }
  }

  // ============================================
  // FORMS SYSTEM HANDLERS
  // ============================================

  const handleCreateDocument = (type: string) => {
    setDocumentType(type)
    setEditingDocument(null)
    
    if (type === 'proposal' || type === 'contract') {
      setShowProposalBuilder(true)
    } else if (type === 'inspection') {
      setShowInspectionForm(true)
    } else {
      setShowDocumentEditor(true)
    }
  }

  const handleEditDocument = (doc: any) => {
    setEditingDocument(doc)
    setDocumentType(doc.type)
    
    if (doc.type === 'proposal' || doc.type === 'contract') {
      setShowProposalBuilder(true)
    } else if (doc.type === 'inspection') {
      setShowInspectionForm(true)
    } else {
      setShowDocumentEditor(true)
    }
  }

  const handleSaveDocument = async (data: any) => {
    try {
      let savedDoc
      
      if (editingDocument) {
        savedDoc = await updateGeneratedDocument(editingDocument.id, data)
        if (!savedDoc) throw new Error('Update failed — check required fields')
        success('Document updated successfully!')
      } else {
        savedDoc = await createGeneratedDocument(data)
        if (!savedDoc) throw new Error('Create failed — check required fields')
        success('Document created successfully!')
      }
      
      setShowDocumentEditor(false)
      setShowProposalBuilder(false)
      setShowInspectionForm(false)
      setEditingDocument(null)

      // Notify about new document
      if (!editingDocument && savedDoc) {
        notify({ type: 'system', title: 'Document Created', body: `${savedDoc.type?.replace('_', ' ')} ${savedDoc.documentNumber} saved`, documentId: savedDoc.id })
      }
    } catch (err: any) {
      error(err?.message || 'Failed to save document')
      throw err // re-throw so the editor can show the error too
    }
  }

  const handleExportPDF = async (documentId: string) => {
    try {
      const doc = generatedDocuments.find((d: any) => d.id === documentId)
      if (!doc) {
        error('Document not found')
        return
      }
      
      await generateDocumentPDF(doc)
      
      await updateGeneratedDocument(doc.id, { 
        status: doc.status === 'draft' ? 'sent' : doc.status,
      })
      
      success('PDF downloaded')
    } catch (err) {
      error('Failed to generate PDF')
    }
  }

  const handleDuplicateDocument = async (doc: any) => {
    try {
      const duplicate = {
        ...doc,
        status: 'draft',
        dateIssued: new Date().toISOString().split('T')[0],
        notes: `${doc.notes || ''}\n\nDuplicated from ${doc.documentNumber}`,
      }
      
      delete duplicate.id
      delete duplicate.documentNumber
      delete duplicate.pxFilePath
      delete duplicate.pdfFilePath
      delete duplicate.dateSent
      delete duplicate.dateApproved
      delete duplicate.datePaid
      
      const saved = await createGeneratedDocument(duplicate)
      if (saved) {
        success(`Document duplicated as ${saved.documentNumber}`)
      }
    } catch (err) {
      error('Failed to duplicate document')
    }
  }

  const handleConvertDocument = (doc: any) => {
    setEditingDocument(doc)
    setShowConversionModal(true)
  }

  const handleSaveConvertedDocument = async (converted: any) => {
    try {
      const saved = await createGeneratedDocument(converted)
      if (saved) {
        success(`Converted to ${saved.type.replace('_', ' ')} - ${saved.documentNumber}`)
        setShowConversionModal(false)
        setEditingDocument(null)
      }
    } catch (err) {
      error('Failed to convert document')
    }
  }

  const handleSendDocument = (doc: any) => {
    setEditingDocument(doc)
    setShowSendModal(true)
  }

  const handleSendEmail = async (emailData: any) => {
    try {
      // Send email via API
      const emailRes = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: emailData.to,
          cc: emailData.cc || undefined,
          subject: emailData.subject,
          text: emailData.message,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="margin-bottom: 24px;">
                <h1 style="font-size: 16px; font-weight: 700; color: #111; letter-spacing: -0.3px; margin: 0;">PROJEX</h1>
              </div>
              <div style="color: #333; font-size: 14px; line-height: 1.7; white-space: pre-wrap;">${emailData.message}</div>
              ${emailData.attachPdf ? '<p style="margin-top: 24px; padding: 16px; background: #f5f5f5; border-radius: 8px; font-size: 13px; color: #666;">📎 PDF document attached to this email.</p>' : ''}
              <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0 16px;" />
              <p style="font-size: 11px; color: #999;">Sent via Projex — projex.live</p>
            </div>
          `,
        }),
      })

      if (!emailRes.ok) {
        const errData = await emailRes.json().catch(() => ({}))
        throw new Error(errData.error || 'Email failed to send')
      }

      await updateGeneratedDocument(editingDocument.id, {
        status: 'sent',
        dateSent: new Date().toISOString(),
      })
      
      success('Email sent successfully!')
      setShowSendModal(false)
      setEditingDocument(null)
    } catch (err: any) {
      error(err.message || 'Failed to send email')
    }
  }

  const handleRecordPayment = (invoice: any) => {
    setEditingDocument(invoice)
    setShowPaymentModal(true)
  }

  const handleCreateProjectFromDocument = (doc: any) => {
    setEditingDocument(doc)
    setShowCreateProjectFromDoc(true)
  }

  const handleUpdateDocumentStatus = async (docId: string, status: string) => {
    try {
await updateGeneratedDocument(docId, { 
  status: status as 'draft' | 'sent' | 'viewed' | 'approved' | 'rejected' | 'paid' | 'void'
})
      success(`Document status updated to ${status}`)
    } catch (err) {
      error('Failed to update status')
    }
  }

  // ============================================
  // PROJECT MANAGEMENT FUNCTIONS
  // ============================================

  const getProjectPhases = useCallback((projectId: string): ProjectPhase[] => {
    if (!projectId) return []
    const storageKey = `projex-project-phases-${projectId}`
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {
        return []
      }
    }
    return []
  }, [])

  const updateProjectPhases = useCallback((projectId: string, phases: ProjectPhase[]) => {
    if (!projectId) return
    const storageKey = `projex-project-phases-${projectId}`
    localStorage.setItem(storageKey, JSON.stringify(phases))
  }, [])

  // ============================================
  // AUTHENTICATION & ROUTING
  // ============================================

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/')
    }
  }, [user, authLoading, router])

  if (authLoading || dataLoading || !user || !mounted) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50 dark:bg-[#111]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading Projex...</p>
        </div>
      </div>
    )
  }

  // ============================================
  // BULK IMPORT HANDLERS (CSV)
  // ============================================

  const bulkCreateProjects = async (rows: any[]) => {
    let created = 0
    for (const row of rows) {
      try {
        await createProjectHook({
          name: row.name,
          description: row.description || '',
          status: row.status || 'active',
          client: row.client_name || '',
          address: row.address || '',
          contractAmount: parseFloat(row.contract_amount) || 0,
          startDate: row.start_date || '',
          dueDate: row.end_date || '',
        })
        created++
      } catch (err) {
        console.error(`Failed to create project: ${row.name}`, err)
      }
    }
    success(`Imported ${created} of ${rows.length} projects`)
    notify({ type: 'system', title: 'CSV Import', body: `${created} projects imported` })
  }

  const bulkCreateTasks = async (rows: any[]) => {
    let created = 0
    for (const row of rows) {
      try {
        // Find matching project by name
        const matchedProject = projects.find((p: any) => p.name.toLowerCase() === (row.project_name || '').toLowerCase())
        await createTask({
          title: row.title,
          description: row.description || '',
          status: row.status || 'todo',
          priority: row.priority || 'medium',
          assignedTo: row.assignee || '',
          dueDate: row.due_date || '',
          projectId: matchedProject?.id || '',
        })
        created++
      } catch (err) {
        console.error(`Failed to create task: ${row.title}`, err)
      }
    }
    success(`Imported ${created} of ${rows.length} tasks`)
    notify({ type: 'system', title: 'CSV Import', body: `${created} tasks imported` })
  }

  const bulkCreateExpenses = async (rows: any[]) => {
    let created = 0
    for (const row of rows) {
      try {
        const matchedProject = projects.find((p: any) => p.name.toLowerCase() === (row.project_name || '').toLowerCase())
        if (matchedProject) {
          await addExpenseHook(matchedProject.id, {
            description: row.description,
            amount: parseFloat(row.amount) || 0,
            type: row.category || 'other',
            date: row.date || new Date().toISOString().split('T')[0],
          })
          created++
        }
      } catch (err) {
        console.error(`Failed to create expense: ${row.description}`, err)
      }
    }
    success(`Imported ${created} of ${rows.length} expenses`)
    notify({ type: 'system', title: 'CSV Import', body: `${created} expenses imported` })
  }

  // ============================================
  // RENDER CARD CONTENT
  // ============================================

  const renderCardContent = (cardType: string) => {
    // Plan gating — check if user's subscription covers this card
    const requiredPlan = CARD_PLAN_REQUIREMENTS[cardType]
    if (requiredPlan && !meetsMinimumPlan(subscription.plan as PlanId | 'free', requiredPlan)) {
      return (
        <div className="h-full flex flex-col items-center justify-center p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-[#222] flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"/></svg>
          </div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">Upgrade to unlock</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-xs">
            This feature requires the <span className="font-medium text-gray-900 dark:text-gray-100 capitalize">{requiredPlan}</span> plan or higher.
          </p>
          <button onClick={() => subscription.startCheckout(requiredPlan, 'monthly')} className="px-5 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full text-sm font-medium hover:bg-gray-700 dark:hover:bg-gray-200 transition-colors">
            Upgrade to {requiredPlan}
          </button>
        </div>
      )
    }

    const commonProps = {
      projects,
      meetings,
      documents,
      branches,
      totalContractAmount,
      totalExpenses,
      grossProfit,
      updateTimeline,
      updateProjectDates,
    }

    // Wrapper functions for phase/timeline
    const handlePhaseUpdate = (projectId: string, phaseId: string, updates: any) => {
      updatePhase(phaseId, updates)
    }
    
    const handleTaskAddToPhase = (projectId: string, phaseId: string, task: any) => {
      createTask({
        projectId,
        phaseId,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        assignedTo: task.assignedTo,
        dueDate: task.dueDate,
      })
    }
    
    const handleTaskUpdateInPhase = (projectId: string, phaseId: string, taskId: string, updates: any) => {
      updateTask(taskId, updates)
    }
    
    const handleMilestoneAdd = (projectId: string, phaseId: string, milestone: any) => {
      createTask({
        projectId,
        phaseId,
        title: `🏁 ${milestone.name || milestone.title || 'Milestone'}`,
        description: milestone.description || 'Phase milestone',
        status: 'todo',
        priority: 'high',
        dueDate: milestone.dueDate || milestone.date || '',
      })
    }
        
    switch (cardType) {
      case 'dashboard':
        if (isMobile) {
          return (
            <MobileDashboard
              projects={projects}
              tasks={tasks}
              documents={generatedDocuments}
              teamMembers={teamMembers}
              totalContractAmount={totalContractAmount}
              totalExpenses={totalExpenses}
              grossProfit={grossProfit}
              onlineUsers={onlineUsers}
              recentActivity={[
                ...projects.slice(0, 5).map((p: any) => ({ id: `p-${p.id}`, type: 'project', title: p.name, subtitle: p.status || 'active', time: p.updatedAt || p.createdAt || new Date().toISOString() })),
                ...tasks.slice(0, 5).map((t: any) => ({ id: `t-${t.id}`, type: 'task', title: t.title, subtitle: `${t.status} ${t.assignee ? '• ' + t.assignee : ''}`, time: t.updatedAt || t.createdAt || new Date().toISOString() })),
                ...generatedDocuments.slice(0, 5).map((d: any) => ({ id: `d-${d.id}`, type: 'document', title: `${d.type} ${d.documentNumber}`, subtitle: d.status || 'draft', time: d.dateIssued || d.createdAt || new Date().toISOString() })),
              ].sort((a: any, b: any) => new Date(b.time).getTime() - new Date(a.time).getTime())}
              onNavigate={(cardId: string) => setMobileCard(cardId)}
            />
          )
        }
        return (
          <DashboardContent 
            {...commonProps}
            orgId={orgId}
            onlineUsers={onlineUsers}
            documents={generatedDocuments}
            onEditProject={(project) => {
              setEditingProject(project)
              setShowEditProject(true)
            }}
            onDeleteProject={(id, name) => {
              setConfirmDialog({
                open: true,
                title: 'Delete Project',
                message: `Are you sure you want to delete "${name}"?`,
                onConfirm: () => {
                  deleteProject(id)
                  setConfirmDialog(null)
                }
              })
            }}
          />
        )

      case 'phases':
        return (
          <div className="h-full flex flex-col bg-gray-50 dark:bg-[#111]">
            <div className="bg-white dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-[#2a2a2a] px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Phase Manager</h2>
              <select
                value={selectedPhaseProject}
                onChange={(e) => {
                  setSelectedPhaseProject(e.target.value)
                  if (e.target.value) {
                    setSelectedProjectForPhases(e.target.value)
                    setShowPhaseManager(true)
                  }
                }}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-lg text-sm"
              >
                <option value="">Select a project...</option>
                {projects.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {projects.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm">Create a project first</div>
              ) : (
                <div className="space-y-2">
                  {projects.map((p: any) => {
                    const projPhases = phases.filter((ph: Phase) => ph.projectId === p.id)
                    return (
                      <div key={p.id}
                        onClick={() => { setSelectedProjectForPhases(p.id); setShowPhaseManager(true) }}
                        className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#2a2a2a] p-4 hover:shadow-md transition-all cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{p.name}</h3>
                            <p className="text-xs text-gray-500">{projPhases.length} phase{projPhases.length !== 1 ? 's' : ''}</p>
                          </div>
                          <span className="text-xs text-blue-600">Open →</span>
                        </div>
                        {projPhases.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {projPhases.slice(0, 5).map((ph: Phase) => (
                              <div key={ph.id} className="h-1.5 flex-1 rounded-full" style={{ backgroundColor: (ph as any).color || '#3B82F6' }} />
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )

      case 'timeline':
        return (
          <TimelineView
            allProjects={projects}
            getProjectPhases={(projectId: string) => 
              phases.filter((p: Phase) => p.projectId === projectId) as any
            }
            selectedProjectId={selectedTimelineProject}
            onProjectSelect={setSelectedTimelineProject}
            onPhaseUpdate={handlePhaseUpdate}
            onTaskUpdate={handleTaskUpdateInPhase}
          />
        )

      case 'projects':
        return (
          <ProjectsContent
            projects={projects}
            messages={messages}
            phases={phases}
            documents={storageDocuments}
            events={events}
            onCreateProject={() => setShowCreateProject(true)}
            onEditProject={(project: any) => {
              setEditingProject(project)
              setShowEditProject(true)
            }}
            onDeleteProject={deleteProject}
            onOpenPhaseManager={(projectId: string) => {
              setSelectedProjectForPhases(projectId)
              setShowPhaseManager(true)
            }}
            onOpenMessages={(projectId: string) => {
              handleDockClick('messages')
            }}
            onOpenDocuments={(projectId: string) => {
              handleDockClick('documents')
            }}
            onOpenBudgeting={(projectId: string) => {
              handleDockClick('budgeting')
            }}
            onOpenCalendar={(projectId: string) => {
              handleDockClick('calendar')
            }}
          />
        )
          
      case 'calendar':
        return (
          <CalendarContent
            projects={projects}
            events={events}
            onCreateEvent={createEvent}
            onUpdateEvent={updateEvent}
            onDeleteEvent={deleteEvent}
          />
        )

      case 'budgeting':
        return (
          <BudgetingContent
            projects={projects}
            onAddExpense={async (projectId, expense) => {
              await addExpenseHook(projectId, expense)
            }}
            onDeleteExpense={deleteExpenseHook}
            onUpdateExpense={async (projectId, expenseId, updates) => {
              await updateExpenseHook(projectId, expenseId, updates as any)
            }}
          />
        )
            
      case 'team':
        return (
          <TeamContent
            teamMembers={teamMembers}
            projects={projects}
            orgId={orgId}
            isOnline={isOnline}
            onCreateMember={createTeamMember}
            onUpdateMember={updateTeamMember}
            onDeleteMember={deleteTeamMember}
            onAssignToProject={assignTeamMemberToProject}
            onRemoveFromProject={removeTeamMemberFromProject}
          />
        )

      case 'messages':
        return (
          <MessagesContent
            messages={messages}
            projects={projects}
            branches={branches}
            notifications={notifications}
            teamMembers={teamMembers}
            onCreateMessage={async (data: any) => {
              const msg = await createMessage(data)
              notify({ type: 'message', title: 'Message Sent', body: data.content?.substring(0, 80) || '', projectId: data.projectId })
              return msg
            }}
            onDeleteMessage={deleteMessage}
            onUploadAttachment={uploadMessageAttachment}
          />
        )

      case 'tasks':
        return (
          <TasksContent
            tasks={tasks}
            projects={projects}
            teamMembers={teamMembers}
            onCreateTask={createTask}
            onUpdateTask={updateTask}
            onDeleteTask={deleteTask}
            onAddComment={addTaskComment}
          />
        )

      case 'forms':
        return (
          <FormsContent
            documents={generatedDocuments as any}
            lineItemTemplates={lineItemTemplates}
            formTemplates={formTemplates}
            onCreateDocument={handleCreateDocument}
            onEditDocument={handleEditDocument}
            onDeleteDocument={deleteGeneratedDocument}
            onDuplicateDocument={async (doc: any) => {
              const dup = { ...doc, id: undefined, documentNumber: undefined, status: 'draft' }
              await handleSaveDocument(dup)
            }}
            onSendDocument={(doc: any) => {
              setEditingDocument(doc)
              setShowSendModal(true)
            }}
            onDownloadDocument={(doc: any) => {
              handleExportPDF(doc.id)
            }}
            onConvertDocument={handleConvertDocument}
            onOpenTemplates={() => setShowTemplateManager(true)}
          />
        )

      case 'documents':
        return (
          <DocumentsContent
            projects={projects}
            documents={storageDocuments}
            onUploadDocument={async (projectId: string, file: File, type: string) => {
              await uploadDocumentHook(projectId, file, type)
              notify({ type: 'system', title: 'Document Uploaded', body: `File uploaded successfully` })
            }}
            onDeleteDocument={deleteDocumentHook}
            onDownloadDocument={downloadDocumentHook}
          />
        )

case 'branches':
  return (
    <BranchesContent
      branches={branches}
      projects={projects}
      teamMembers={teamMembers}
      onCreateBranch={createBranch}
      onUpdateBranch={updateBranch}
      onDeleteBranch={deleteBranch}
    />
  )

case 'communication':
  return <CommunicationContent teamMembers={teamMembers} />

case 'drawings':
  return <DrawingsContent projectId={projects[0]?.id} />

      case 'portal':
        return (
          <div className="h-full flex flex-col bg-gray-50 dark:bg-[#111]">
            <div className="bg-white dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-[#2a2a2a] px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Client Portals</h2>
              <p className="text-xs text-gray-500 mt-1">Share read-only project views with your clients</p>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {projects.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm">No projects yet</div>
              ) : (
                projects.map((p: any) => {
                  const portalUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/portal/${p.id}`
                  return (
                    <div key={p.id} className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#2a2a2a] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{p.name}</h3>
                          <p className="text-[10px] text-gray-400 mt-0.5 truncate">{p.client || 'No client'}</p>
                          <p className="text-[10px] text-blue-600 dark:text-blue-400 mt-1 truncate font-mono">{portalUrl}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => navigator.clipboard?.writeText(portalUrl)}
                            className="px-2.5 py-1.5 text-[10px] font-medium bg-gray-100 dark:bg-[#222] text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-[#333]"
                          >
                            Copy
                          </button>
                          <a
                            href={portalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1.5 text-[10px] font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            Open ↗
                          </a>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )

case 'maps':
  return <MapsContent projects={projects} />

      case 'kpi':
        return <KPIContent {...commonProps} tasks={tasks} phases={phases} />

      case 'templates':
        return <TemplatesContent />

      case 'meetings':
        return (
          <MeetingsContent
            meetings={meetings}
            projects={projects}
            onAddMeeting={() => setShowAddMeeting(true)}
            onDeleteMeeting={deleteMeeting}
          />
        )

      case 'schedule':
        return (
          <ScheduleContent
            projects={projects}
            meetings={meetings}
            branches={branches}
          />
        )

      case 'estimating':
        return (
          <EstimatingContent
            projects={projects}
            documents={generatedDocuments as any}
            onNewEstimate={() => {
              setDocumentType('estimate')
              setShowDocumentEditor(true)
            }}
          />
        )

      case 'invoicing':
        return (
          <InvoicingContent
            projects={projects}
            documents={generatedDocuments as any}
            onNewInvoice={() => {
              setDocumentType('invoice')
              setShowDocumentEditor(true)
            }}
          />
        )

      case 'chat':
        return <ChatContent projects={projects} messages={mockChatMessages} />

      case 'settings':
        return <SettingsContent />

      case 'integrations':
        return (
          <IntegrationsContent
            projects={projects}
            tasks={tasks}
            teamMembers={teamMembers}
            userId={user?.id}
            orgId={orgId ?? undefined}
            onBulkCreateProjects={bulkCreateProjects}
            onBulkCreateTasks={bulkCreateTasks}
            onBulkCreateExpenses={bulkCreateExpenses}
          />
        )

      case 'accounting':
        return (
          <AccountingContent
            projects={projects}
            documents={generatedDocuments}
            totalContractAmount={totalContractAmount}
            totalExpenses={totalExpenses}
            grossProfit={grossProfit}
            onUpdateDocument={updateGeneratedDocument}
            onNotify={notify}
          />
        )

      case 'photos':
        return (
          <PhotosContent
            projects={projects}
            photos={photos}
            onUploadPhoto={async (projectId: string, file: File, caption: string, category: string) => {
              return await uploadPhoto(projectId, file, caption, category)
            }}
            onDeletePhoto={deletePhoto}
          />
        )

      case 'comms':
        return (
          <CommsHubContent
            contacts={[]}
            teamMembers={teamMembers}
            projects={projects}
            commsLogs={commsLogs}
            onAddCommsLog={addCommsLog}
            onSendEmail={async (data) => {
              await fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
              })
            }}
          />
        )

      case 'leads':
        return (
          <LeadGenContent
            leads={leads}
            onCreateLead={createLead}
            onUpdateLead={updateLeadHook}
            onDeleteLead={deleteLead}
            onSendEmail={async (data) => {
              await fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
              })
            }}
          />
        )

      default:
        return <div className="p-4 text-gray-500">Content for {cardType} coming soon...</div>
    }
  }

  // ============================================
  // PAYWALL — show plan picker if no active subscription
  // ============================================
  if (!subscription.loading && !subscription.isActive) {
    return (
      <div className="min-h-screen bg-[#fafafa] dark:bg-[#111] flex items-center justify-center p-4">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight mb-2">Choose your plan</h1>
            <p className="text-gray-500 dark:text-gray-400">Start your 7-day free trial. No credit card required.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {([
              { id: 'duo' as PlanId, name: 'Duo', price: 19.99, users: 2, desc: 'Up to 2 users, 5 projects' },
              { id: 'team' as PlanId, name: 'Team', price: 49.99, users: 5, desc: 'Up to 5 users, unlimited projects', popular: true },
              { id: 'business' as PlanId, name: 'Business', price: 99.99, users: 10, desc: 'Up to 10 users, branches, reports' },
              { id: 'enterprise' as PlanId, name: 'Enterprise', price: 149.99, users: 20, desc: 'Up to 20 users, API, SSO' },
            ]).map((plan) => (
              <div key={plan.id} className={`rounded-2xl p-6 border transition-all ${
                plan.popular ? 'bg-gray-900 text-white border-gray-900 shadow-xl scale-[1.02]' : 'bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a]'
              }`}>
                <h3 className={`text-lg font-semibold mb-1 ${plan.popular ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>{plan.name}</h3>
                <p className={`text-xs mb-3 ${plan.popular ? 'text-gray-400' : 'text-gray-500'}`}>{plan.desc}</p>
                <div className="mb-4">
                  <span className={`text-3xl font-bold ${plan.popular ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>${plan.price}</span>
                  <span className={`text-xs ${plan.popular ? 'text-gray-400' : 'text-gray-500'}`}>/mo</span>
                </div>
                <button
                  onClick={() => subscription.startCheckout(plan.id, 'monthly')}
                  className={`w-full py-2.5 rounded-full text-sm font-medium transition-all ${
                    plan.popular ? 'bg-white text-gray-900 hover:bg-gray-100' : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-200'
                  }`}
                >Start free trial</button>
              </div>
            ))}
          </div>
          <p className="text-center mt-6 text-xs text-gray-400">Need 20+ users? <a href="mailto:sales@projex.live" className="text-gray-900 dark:text-gray-100 font-medium hover:underline">Contact sales</a></p>
          <div className="text-center mt-4">
            <button onClick={() => signOut()} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Sign out</button>
          </div>
        </div>
      </div>
    )
  }

  // ============================================
  // MAIN RENDER
  // ============================================

  return (
    <RolesProvider userId={user?.id}>
    <FileProvider>
      {/* Trial banner */}
      {subscription.isTrialing && subscription.trialDaysLeft > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800/30 px-4 py-2 text-center text-sm shrink-0 z-[300] relative">
          <span className="text-amber-800 dark:text-amber-200">
            {subscription.trialDaysLeft} day{subscription.trialDaysLeft !== 1 ? 's' : ''} left in your trial.
          </span>
          <button onClick={() => {
            if (isMobile) setMobileCard('settings')
            else handleDockClick('settings')
          }} className="ml-2 text-amber-900 dark:text-amber-100 font-medium underline hover:no-underline">
            Upgrade now
          </button>
        </div>
      )}
      {isMobile ? (
        <MobileLayout
          cards={cards}
          activeCard={mobileCard}
          onSelectCard={setMobileCard}
          unreadCount={unreadCount}
          renderContent={(cardType: string) => renderCardContent(cardType)}
          onCreateProject={() => setShowCreateProject(true)}
          onNewEstimate={() => { setDocumentType('estimate'); setShowDocumentEditor(true) }}
          onNewInvoice={() => { setDocumentType('invoice'); setShowDocumentEditor(true) }}
          onNewInspection={() => setShowInspectionForm(true)}
          userName={userName}
          userEmail={user?.email || ''}
          orgName={''}
          onlineCount={onlineUsers.length}
          onSignOut={signOut}
        />
      ) : (
      <div className="h-screen w-screen overflow-hidden bg-gray-100 dark:bg-[#111] flex flex-col">
        {/* Header */}
        <div className="h-14 bg-white dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-[#2a2a2a] flex items-center justify-between px-4 z-[200] relative shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <Logo />
            <div className="relative z-[201]">
              <FilterBar 
                branches={branches}
                currentFilters={filterState}
                onFilterChange={setFilterState}
              />
            </div>
          </div>
          
          {/* Canvas Toolbar */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-[#252525]/50 rounded-xl px-2 py-1">
            <button
              onClick={() => setCanvasMode('select')}
              className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm transition-colors ${canvasMode === 'select' ? 'bg-white dark:bg-[#333] shadow-sm text-gray-700 dark:text-gray-200' : 'text-gray-500 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-[#333]/50'}`}
              title="Select (V)"
            >
              ↖
            </button>
            <button
              onClick={() => setCanvasMode('pan')}
              className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm transition-colors ${canvasMode === 'pan' || isPanning ? 'bg-white dark:bg-[#333] shadow-sm text-gray-700 dark:text-gray-200' : 'text-gray-500 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-[#333]/50'}`}
              title="Pan (H or hold Space)"
            >
              ✋
            </button>
            <div className="w-px h-5 bg-gray-300 dark:bg-[#333] mx-1" />
            <button
              onClick={zoomOut}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-[#333]/50 transition-colors"
              title="Zoom Out"
            >
              −
            </button>
            <button
              onClick={resetView}
              className="px-2 h-8 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-[#333]/50 rounded-lg transition-colors tabular-nums min-w-[44px] flex items-center justify-center"
              title="Reset zoom"
            >
              {zoomPercent}%
            </button>
            <button
              onClick={zoomIn}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-[#333]/50 transition-colors"
              title="Zoom In"
            >
              +
            </button>
            <button
              onClick={() => fitToContent(openCards.map((c: any) => ({ x: c.position.x, y: c.position.y, w: c.size.width, h: c.size.height })))}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-[#333]/50 transition-colors"
              title="Fit all windows"
            >
              ⊞
            </button>
          </div>

          <div className="flex items-center gap-2">
            <NotificationBell
              notifications={notifications}
              unreadCount={unreadCount}
              onMarkRead={markRead}
              onMarkAllRead={markAllRead}
              onDismiss={dismissNotification}
              onClickNotification={(n) => {
                if (n.taskId) handleDockClick('tasks')
                else if (n.documentId) handleDockClick('forms')
                else if (n.projectId) handleDockClick('projects')
              }}
            />
<ThemeToggle theme={theme} onToggle={toggleTheme} />
            <UserProfileDropdown />
          </div>
        </div>

        {/* Infinite Canvas Workspace */}
        <div
          ref={canvasRef}
          data-canvas-container
          className={`flex-1 relative overflow-hidden ${canvasMode === 'pan' ? 'cursor-grab' : ''} ${isPanning ? '!cursor-grabbing' : ''}`}
          style={{ height: `calc(100vh - ${56 + DOCK_HEIGHT}px)` }}
          onMouseDown={(e) => {
            handleCanvasMouseDown(e)
          }}
          onMouseMove={(e) => {
            if (isPanning) {
              onPanMove(e)
            } else {
              handleMouseMove(e)
            }
          }}
          onMouseUp={() => {
            endPan()
            handleMouseUp()
          }}
          onMouseLeave={() => {
            endPan()
            handleMouseUp()
          }}
        >
          {/* Canvas dot grid background */}
          <div
            className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-20"
            style={{
              backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`,
              backgroundSize: `${24 * canvasTransform.scale}px ${24 * canvasTransform.scale}px`,
              backgroundPosition: `${canvasTransform.x % (24 * canvasTransform.scale)}px ${canvasTransform.y % (24 * canvasTransform.scale)}px`,
              color: 'rgb(156, 163, 175)',
            }}
          />

          {/* Transform layer — all windows live here */}
          <div
            className="absolute"
            style={{
              transform: `translate(${canvasTransform.x}px, ${canvasTransform.y}px) scale(${canvasTransform.scale})`,
              transformOrigin: '0 0',
              willChange: 'transform',
            }}
          >
            {openCards.map((card: any) => (
<Window
  key={card.id}
  card={card}
  isActive={activeCard === card.id}
  isDragging={dragging === card.id}
  isResizing={resizing !== null}
  dockHeight={DOCK_HEIGHT}
  onClose={handleClose}
  onMinimize={handleMinimize}
  onFullscreen={handleFullscreen}
  onMouseDown={handleMouseDown}
  onResizeMouseDown={handleResizeMouseDown}
  onClick={() => setActiveCard(card.id)}
>
{renderCardContent(card.type || card.id || 'dashboard')}

</Window>
          ))}
          </div>
        </div>

        {/* Dock */}
<DraggableDock
  cards={cards}
  onCardClick={handleDockClick}
  onReorder={handleDockReorder}
  onMinimize={handleMinimize}
/>

        {/* ========================================== */}
        {/* END DESKTOP LAYOUT */}
        {/* ========================================== */}
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
      )}
      {isMobile && <ToastContainer toasts={toasts} onRemove={removeToast} />}

        {/* ========================================== */}
        {/* MODALS - GENERAL (render in both layouts) */}
        {/* ========================================== */}

{showCreateProject && (
  <EditProjectModal
    isOpen={showCreateProject}
    onClose={() => setShowCreateProject(false)}
    onSubmit={async (projectId: string, updates: Partial<Project>) => {
      await createProject(updates as any)
    }}
    project={null}
    branches={branches}
  />
)}

{showEditProject && editingProject && (
  <EditProjectModal
    isOpen={showEditProject}
    onClose={() => {
      setShowEditProject(false)
      setEditingProject(null)
    }}
    onSubmit={updateProject}
    project={editingProject}
    branches={branches}
  />
)}

{showAddExpense && expenseProjectId && (
  <AddExpenseModal
    isOpen={showAddExpense}
    onClose={() => {
      setShowAddExpense(false)
      setExpenseProjectId('')
    }}
    onSubmit={addExpense}
    projectId={expenseProjectId}
    projectName={projects.find((p: any) => p.id === expenseProjectId)?.name || 'Project'}
  />
)}

{showAddTeamMember && (
  <AddTeamMemberModal
    isOpen={showAddTeamMember}
    onClose={() => setShowAddTeamMember(false)}
    onSubmit={async (data: any) => {
      await createTeamMember(data)
      setShowAddTeamMember(false)
    }}
    projectName=""  // ✅ Add this (or use actual project name)
  />
)}

{showAddMeeting && (
  <AddMeetingModal
    isOpen={showAddMeeting}
    onClose={() => setShowAddMeeting(false)}
    onSubmit={createMeeting}
    projects={projects}
  />
)}

{showAddBranch && (
  <AddBranchModal
    isOpen={showAddBranch}
    onClose={() => setShowAddBranch(false)}
    onSubmit={createBranch}
  />
)}

        {showPhaseManager && selectedProjectForPhases && (
          <PhaseManagerModal
projectId={selectedProjectForPhases}  
    projectName={projects.find((p: any) => p.id === selectedProjectForPhases)?.name || ''}  // ✅ Use projectName

onClose={() => {
              setShowPhaseManager(false)
              setSelectedProjectForPhases(null)
            }}
            phases={phases.filter((p: Phase) => p.projectId === selectedProjectForPhases)}
            onCreatePhase={async (data: any) => {
              await createPhase({ ...data, projectId: selectedProjectForPhases })
            }}
            onUpdatePhase={updatePhase}
            onDeletePhase={deletePhase}
            onCreateTask={createTask}
            onUpdateTask={updateTask}
            onDeleteTask={deleteTask}
            teamMembers={teamMembers}
          />
        )}

        {initModalOpen && initModalProject && (
<ProjectInitializeModal
  isOpen={initModalOpen}
  onClose={() => {
    setInitModalOpen(false)
    setInitModalProject(null)
  }}
  projectId={initModalProject?.id || ''}
  projectName={initModalProject?.name || ''}
  projectType={initModalProject?.type || ''}
  onInitialize={(projectId: string, phases: ProjectPhase[]) => {
    updateProjectPhases(projectId, phases)
    setInitModalOpen(false)
    setInitModalProject(null)
  }}
/>
        )}

{showSearchModal && (
  <GlobalSearchModal
    isOpen={showSearchModal}
    onClose={() => setShowSearchModal(false)}
    onSearch={search}
    onSelectResult={(result: SearchResult) => {
      setShowSearchModal(false)
      if (result.type === 'project') {
        handleDockClick('projects')
      } else if (result.type === 'document') {
        handleDockClick('documents')
      }
    }}
    recentSearches={recentSearches}
  />
)}

{selectedDocument && (
  <DocumentViewer
    isOpen={true}  // ✅ Add isOpen
    onClose={() => setSelectedDocument(null)}
    documentUrl={selectedDocument.url}  // ✅ Add documentUrl
    documentName={selectedDocument.name}  // ✅ Add documentName
    documentType="pdf"  // ✅ Add documentType
  />
)}

        {confirmDialog && (
          <ConfirmDialog
            isOpen={confirmDialog.open}
            title={confirmDialog.title}
            message={confirmDialog.message}
            onConfirm={confirmDialog.onConfirm}
            onClose={() => setConfirmDialog(null)}
          />
        )}

        {/* ========================================== */}
        {/* FORMS SYSTEM MODALS */}
        {/* ========================================== */}

        {showTemplateManager && (
          <TemplateManager
            lineItemTemplates={lineItemTemplates}
            formTemplates={formTemplates}
            onClose={() => setShowTemplateManager(false)}
            onCreateLineItem={createLineItemTemplate}
            onUpdateLineItem={updateLineItemTemplate}
            onDeleteLineItem={deleteLineItemTemplate}
            onCreateFormTemplate={createFormTemplate}
            onUpdateFormTemplate={updateFormTemplate}
            onDeleteFormTemplate={deleteFormTemplate}
          />
        )}

        {showDocumentEditor && (
          <DocumentEditor
            document={editingDocument}
            type={documentType as any}
            lineItemTemplates={lineItemTemplates}
            projects={projects}
            onSave={handleSaveDocument}
            onClose={() => {
              setShowDocumentEditor(false)
              setEditingDocument(null)
            }}
            onExportPDF={handleExportPDF}
          />
        )}

{showProposalBuilder && (
  <ProposalBuilder
    isOpen={showProposalBuilder}
    onClose={() => {
      setShowProposalBuilder(false)
      setEditingDocument(null)
    }}
    document={editingDocument}
    type={documentType as 'proposal' | 'contract'}
    projects={projects}
    onSave={(data) => {
      handleSaveDocument(data)
      setShowProposalBuilder(false)
    }}
  />
)}

{showInspectionForm && (
  <InspectionFormBuilder
    isOpen={showInspectionForm}
    onClose={() => {
      setShowInspectionForm(false)
      setEditingDocument(null)
    }}
    document={editingDocument}
    projects={projects}
    onSave={(data) => {
      handleSaveDocument(data)
      setShowInspectionForm(false)
    }}
  />
)}

        {showConversionModal && editingDocument && (
          <ConversionModal
            document={editingDocument}
            onConvert={handleSaveConvertedDocument}
            onClose={() => {
              setShowConversionModal(false)
              setEditingDocument(null)
            }}
          />
        )}

        {showSendModal && editingDocument && (
          <SendDocumentModal
            document={editingDocument}
            onSend={handleSendEmail}
            onClose={() => {
              setShowSendModal(false)
              setEditingDocument(null)
            }}
          />
        )}

        {showCreateProjectFromDoc && editingDocument && (
          <CreateProjectModal
            initialData={{
              clientName: editingDocument.clientName,
              clientEmail: editingDocument.clientEmail,
              clientPhone: editingDocument.clientPhone,
              clientAddress: editingDocument.clientAddress,
            }}
            onSave={async (projectData) => {
              await createProject(projectData)
              if (editingDocument) {
                const project = projects[projects.length - 1]
                if (project) {
                  await updateGeneratedDocument(editingDocument.id, {
                    projectId: project.id,
                  })
                }
              }
              setShowCreateProjectFromDoc(false)
              setEditingDocument(null)
            }}
            onClose={() => {
              setShowCreateProjectFromDoc(false)
              setEditingDocument(null)
            }}
          />
        )}

        {showPaymentModal && editingDocument && (
          <PaymentModal
            invoice={editingDocument}
            onSave={async (paymentData) => {
              await updateGeneratedDocument(editingDocument.id, paymentData)
              setShowPaymentModal(false)
              setEditingDocument(null)
            }}
            onClose={() => {
              setShowPaymentModal(false)
              setEditingDocument(null)
            }}
          />
        )}

        {showQuickAddLineItem && (
          <QuickAddLineItemModal
            onSave={async (data) => {
              if (data.saveAsTemplate) {
                await createLineItemTemplate(data.lineItem)
              }
              setShowQuickAddLineItem(false)
            }}
            onClose={() => setShowQuickAddLineItem(false)}
          />
        )}

      {/* Onboarding */}
      <Onboarding visible={showOnboarding} onComplete={completeOnboarding} />
      <HelpButton onClick={() => setShowOnboarding(true)} />

    </FileProvider>
    </RolesProvider>
  )
}
