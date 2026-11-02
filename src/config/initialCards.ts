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
