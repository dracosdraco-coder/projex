import { Card } from '@/types'

// Initial card configuration for the workspace
export const initialCards: Card[] = [
  { id: 'dashboard', title: 'Dashboard', icon: '📁', type: 'dashboard', position: { x: 20, y: 20 }, size: { width: 600, height: 500 }, minimized: false, fullscreen: false, closed: false },
  { id: 'projects', title: 'Projects', icon: '📁', type: 'projects', position: { x: 660, y: 20 }, size: { width: 500, height: 450 }, minimized: false, fullscreen: false, closed: true },
  { id: 'tasks', title: 'Tasks', icon: '📁', type: 'tasks', position: { x: 20, y: 540 }, size: { width: 1200, height: 600 }, minimized: false, fullscreen: false, closed: true },
  { id: 'phases', title: 'Phases', icon: '📁', type: 'phases', position: { x: 1200, y: 20 }, size: { width: 700, height: 600 }, minimized: false, fullscreen: false, closed: true },
  { id: 'timeline', title: 'Timeline', icon: '📁', type: 'timeline', position: { x: 20, y: 20 }, size: { width: 900, height: 600 }, minimized: false, fullscreen: false, closed: true },
  { id: 'budgeting', title: 'Budgeting', icon: '📁', type: 'budgeting', position: { x: 640, y: 20 }, size: { width: 500, height: 400 }, minimized: false, fullscreen: false, closed: true },
  { id: 'kpi', title: 'KPI Dashboard', icon: '📁', type: 'kpi', position: { x: 100, y: 100 }, size: { width: 1000, height: 700 }, minimized: false, fullscreen: false, closed: true },
  { id: 'team', title: 'Team', icon: '📁', type: 'team', position: { x: 200, y: 150 }, size: { width: 400, height: 350 }, minimized: false, fullscreen: false, closed: true },
  { id: 'messages', title: 'Messages', icon: '📁', type: 'messages', position: { x: 20, y: 20 }, size: { width: 1200, height: 600 }, minimized: false, fullscreen: false, closed: true },
  { id: 'forms', title: 'Forms', icon: '📁', type: 'forms', position: { x: 300, y: 50 }, size: { width: 700, height: 500 }, minimized: false, fullscreen: false, closed: true },
  { id: 'documents', title: 'Documents', icon: '📁', type: 'documents', position: { x: 150, y: 200 }, size: { width: 450, height: 400 }, minimized: false, fullscreen: false, closed: true },
  { id: 'templates', title: 'Templates', icon: '📁', type: 'templates', position: { x: 100, y: 100 }, size: { width: 800, height: 600 }, minimized: false, fullscreen: false, closed: true },
  { id: 'calendar', title: 'Calendar', icon: '📁', type: 'calendar', position: { x: 250, y: 100 }, size: { width: 500, height: 450 }, minimized: false, fullscreen: false, closed: true },
  { id: 'communication', title: 'Communication', icon: '📁', type: 'communication', position: { x: 350, y: 150 }, size: { width: 450, height: 400 }, minimized: false, fullscreen: false, closed: true },
  { id: 'drawings', title: 'Drawings', icon: '📁', type: 'drawings', position: { x: 100, y: 50 }, size: { width: 900, height: 700 }, minimized: false, fullscreen: false, closed: true },
  { id: 'maps', title: 'Maps', icon: '📁', type: 'maps', position: { x: 200, y: 100 }, size: { width: 600, height: 500 }, minimized: false, fullscreen: false, closed: true },
  { id: 'branches', title: 'Branches', icon: '📁', type: 'branches', position: { x: 250, y: 130 }, size: { width: 450, height: 400 }, minimized: false, fullscreen: false, closed: true },
  { id: 'settings', title: 'Settings', icon: '📁', type: 'settings', position: { x: 300, y: 150 }, size: { width: 700, height: 500 }, minimized: false, fullscreen: false, closed: true },
  { id: 'integrations', title: 'Integrations', icon: '📁', type: 'integrations', position: { x: 350, y: 100 }, size: { width: 800, height: 600 }, minimized: false, fullscreen: false, closed: true },
  { id: 'accounting', title: 'Accounting', icon: '📁', type: 'accounting', position: { x: 100, y: 50 }, size: { width: 800, height: 600 }, minimized: false, fullscreen: false, closed: true },
  { id: 'photos', title: 'Photos', icon: '📁', type: 'photos', position: { x: 200, y: 100 }, size: { width: 900, height: 650 }, minimized: false, fullscreen: false, closed: true },
  { id: 'comms', title: 'Communications', icon: '📁', type: 'comms', position: { x: 150, y: 80 }, size: { width: 700, height: 600 }, minimized: false, fullscreen: false, closed: true },
  { id: 'leads', title: 'Leads', icon: '📁', type: 'leads', position: { x: 250, y: 120 }, size: { width: 800, height: 600 }, minimized: false, fullscreen: false, closed: true },
]

// Form type options for the forms card
export const formTypes = [
  { id: 'estimate', name: 'Estimate' },
  { id: 'invoice', name: 'Invoice' },
  { id: 'proposal', name: 'Proposal' },
  { id: 'contract', name: 'Contract' },
  { id: 'change-order', name: 'Change Order' },
  { id: 'purchase-order', name: 'Purchase Order' },
  { id: 'work-order', name: 'Work Order' },
]

// Menu items for the header dropdown
export const menuItems = [
  'Settings',
  'Help & Support',
  'Keyboard Shortcuts',
  'What\'s New',
  'Give Feedback',
] as const

// Mock messages for Communication card (if needed for demo)
export const mockMessages = [
  {
    id: 'msg1',
    from: 'Client Services',
    subject: 'Project Update Required',
    preview: 'Please provide an update on the downtown office renovation...',
    date: '2024-12-20',
    read: false,
  },
  {
    id: 'msg2',
    from: 'Accounting',
    subject: 'Invoice #1247 - Payment Received',
    preview: 'Payment of $24,500 has been received and processed...',
    date: '2024-12-19',
    read: true,
  },
  {
    id: 'msg3',
    from: 'Safety Coordinator',
    subject: 'Monthly Safety Meeting - Dec 28',
    preview: 'Reminder: Monthly safety meeting scheduled for December 28th...',
    date: '2024-12-18',
    read: false,
  },
]

// Mock chat messages for Chat card (if needed for demo)
export const mockChatMessages = [
  {
    id: 'chat1',
    sender: 'John Smith',
    message: 'Team meeting at 2pm to discuss the electrical rough-in schedule.',
    timestamp: '10:30 AM',
    projectId: 'proj1',
  },
  {
    id: 'chat2',
    sender: 'Sarah Johnson',
    message: 'Just confirmed delivery for the HVAC equipment - arriving Monday.',
    timestamp: '11:45 AM',
    projectId: 'proj1',
  },
  {
    id: 'chat3',
    sender: 'Mike Williams',
    message: 'Permits have been approved. We\'re good to proceed with foundation work.',
    timestamp: '2:15 PM',
    projectId: 'proj2',
  },
]