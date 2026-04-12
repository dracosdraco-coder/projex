'use client'

import { useState } from 'react'
import { 
  X, 
  MessageSquare, 
  FileText, 
  Calendar,
  Users,
  MapPin,
  Edit,
  Trash2,
  Target,
  DollarSign,
  Image as ImageIcon,
  Download,
  Eye,
  Plus,
  Upload
} from 'lucide-react'

export default function ProjectDetailModal({
  project,
  phases,
  messages,
  documents,
  events,
  onClose,
  onEdit,
  onDelete,
  onOpenPhaseManager,
  onOpenMessages,
  onOpenDocuments,
  onOpenBudgeting,
  onOpenCalendar,
}: {
  project: any
  phases: any[]
  messages: any[]
  documents: any[]
  events: any[]
  onClose: () => void
  onEdit: (project: any) => void
  onDelete: (id: string) => void
  onOpenPhaseManager: (projectId: string) => void
  onOpenMessages: (projectId: string) => void
  onOpenDocuments: (projectId: string) => void
  onOpenBudgeting: (projectId: string) => void
    onOpenCalendar: (projectId: string) => void  

}) {
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'financials' | 'documents' | 'calendar'>('overview')

  const projectPhases = phases.filter((p: any) => p.projectId === project.id)
  const projectMessages = messages.filter((m: any) => m.projectId === project.id)
  const projectDocuments = documents.filter((d: any) => d.projectId === project.id)
  const projectEvents = events.filter((e: any) => e.projectId === project.id)
  const projectExpenses = project.expenses || []
  
  const allTasks = projectPhases.flatMap((p: any) => p.tasks || [])
  const mediaFiles = projectDocuments.filter((d: any) => 
    ['photo', 'video', 'drawing'].includes(d.type)
  )

  // Calculate financials
  const totalExpenses = projectExpenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0)
  const grossProfit = (project.contractAmount || 0) - totalExpenses
  const profitMargin = project.contractAmount ? ((grossProfit / project.contractAmount) * 100).toFixed(1) : '0'

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (date: string) => {
    if (!date) return 'Not set'
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'on-hold': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const tabs = [
    { id: 'overview' as const, label: 'Overview' },
    { id: 'timeline' as const, label: 'Timeline', badge: projectPhases.length },
    { id: 'financials' as const, label: 'Financials', badge: projectExpenses.length },
    { id: 'documents' as const, label: 'Documents', badge: projectDocuments.length },
    { id: 'calendar' as const, label: 'Events', badge: projectEvents.length },
  ]

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4" style={{ animation: 'popup-in 0.15s ease-out' }}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-[#1a1a1a] rounded-xl md:rounded-2xl w-full max-w-3xl max-h-[95vh] md:max-h-[85vh] mx-2 md:mx-0 flex flex-col shadow-2xl border border-gray-200 dark:border-[#2a2a2a]">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-[#2a2a2a] px-6 py-4 flex-shrink-0">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-1">
                {project.name}
              </h2>
              {project.client && (
                <p className="text-sm text-gray-600 dark:text-gray-400">{project.client}</p>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                {project.status}
              </span>
              <button
                onClick={() => {
                  onClose()
                  onEdit(project)
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-[#252525] rounded-lg transition-colors"
                title="Edit"
              >
                <Edit className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to delete this project?')) {
                    onDelete(project.id)
                    onClose()
                  }
                }}
                className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4 text-red-600" />
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-[#252525] rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto pb-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 font-medium text-sm transition-all whitespace-nowrap rounded ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#252525]'
                }`}
              >
                {tab.label}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className={`ml-2 px-1.5 py-0.5 rounded text-xs ${
                    activeTab === tab.id 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 dark:bg-[#252525] text-gray-700 dark:text-gray-300'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 dark:bg-[#111] rounded-lg p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Budget</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {formatCurrency(project.contractAmount || 0)}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-[#111] rounded-lg p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Spent</p>
                  <p className="text-lg font-semibold text-red-600">
                    {formatCurrency(totalExpenses)}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-[#111] rounded-lg p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Profit</p>
                  <p className={`text-lg font-semibold ${grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(grossProfit)}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-[#111] rounded-lg p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Due Date</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {formatDate(project.dueDate)}
                  </p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    onClose()
                    onOpenPhaseManager(project.id)
                  }}
                  className="flex items-center gap-2 p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Target className="w-4 h-4" />
                  <div className="text-left">
                    <p className="font-medium text-sm">Phases</p>
                    <p className="text-xs opacity-90">{projectPhases.length} phases</p>
                  </div>
                </button>
                <button
                  onClick={() => {
                    onClose()
                    onOpenMessages(project.id)
                  }}
                  className="flex items-center gap-2 p-3 bg-gray-100 dark:bg-[#252525] text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-200 dark:hover:bg-[#333]"
                >
                  <MessageSquare className="w-4 h-4" />
                  <div className="text-left">
                    <p className="font-medium text-sm">Messages</p>
                    <p className="text-xs opacity-75">{projectMessages.length} chats</p>
                  </div>
                </button>
              </div>

              {project.description && (
                <div className="bg-gray-50 dark:bg-[#111] rounded-lg p-3">
                  <h3 className="text-sm font-semibold mb-2">Description</h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{project.description}</p>
                </div>
              )}

              {project.address && (
                <div className="bg-gray-50 dark:bg-[#111] rounded-lg p-3">
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Location
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{project.address}</p>
                </div>
              )}

              {project.team && project.team.length > 0 && (
                <div className="bg-gray-50 dark:bg-[#111] rounded-lg p-3">
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Team ({project.team.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {project.team.slice(0, 6).map((member: any) => (
                      <div key={member.id} className="flex items-center gap-2 px-2 py-1 bg-white dark:bg-[#1a1a1a] rounded text-sm">
                        <div className="w-5 h-5 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold text-xs">
                          {member.name?.charAt(0) || '?'}
                        </div>
                        <span>{member.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">Phases & Tasks</h3>
                <button
                  onClick={() => {
                    onClose()
                    onOpenPhaseManager(project.id)
                  }}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Manage
                </button>
              </div>

              {projectPhases.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Target className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No phases yet</p>
                </div>
              ) : (
                projectPhases.map((phase: any, i: number) => (
                  <div key={phase.id} className="bg-gray-50 dark:bg-[#111] rounded-lg p-3">
                    <div className="flex gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-white font-semibold text-sm" style={{ backgroundColor: phase.color }}>
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm mb-1">{phase.name}</h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{formatDate(phase.startDate)} - {formatDate(phase.endDate)}</p>
                        <p className="text-xs text-gray-500 mt-1">{phase.tasks?.length || 0} tasks</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'financials' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">Budget & Expenses</h3>
                <button
                  onClick={() => {
                    onClose()
                    onOpenBudgeting(project.id)
                  }}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Manage
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Budget</p>
                  <p className="text-lg font-bold text-blue-600">{formatCurrency(project.contractAmount || 0)}</p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Spent</p>
                  <p className="text-lg font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
                </div>
                <div className={`rounded-lg p-3 ${grossProfit >= 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Profit</p>
                  <p className={`text-lg font-bold ${grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(grossProfit)}</p>
                </div>
              </div>

              {projectExpenses.length > 0 ? (
                <div className="bg-gray-50 dark:bg-[#111] rounded-lg p-3">
                  <h4 className="font-semibold text-sm mb-2">Recent Expenses</h4>
                  <div className="space-y-2">
                    {projectExpenses.slice(0, 8).map((exp: any) => (
                      <div key={exp.id} className="flex justify-between text-sm">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{exp.description}</p>
                          <p className="text-xs text-gray-500 capitalize">{exp.type}</p>
                        </div>
                        <span className="font-semibold ml-2">{formatCurrency(exp.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <DollarSign className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No expenses yet</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">Files & Media</h3>
                <button
                  onClick={() => {
                    onClose()
                    onOpenDocuments(project.id)
                  }}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
                >
                  <Upload className="w-4 h-4" />
                  Manage
                </button>
              </div>

              {projectDocuments.length > 0 ? (
                <div className="space-y-2">
                  {projectDocuments.slice(0, 8).map((doc: any) => (
                    <div key={doc.id} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-[#111] rounded-lg hover:bg-gray-100 dark:hover:bg-[#1e1e1e]">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{doc.name}</p>
                          <p className="text-xs text-gray-500 capitalize">{doc.type}</p>
                        </div>
                      </div>
                      <div className="flex gap-1 ml-2">
                        <button className="p-1 hover:bg-gray-200 dark:hover:bg-[#252525] rounded">
                          <Eye className="w-3 h-3" />
                        </button>
                        <button className="p-1 hover:bg-gray-200 dark:hover:bg-[#252525] rounded">
                          <Download className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No documents yet</p>
                </div>
              )}

              {mediaFiles.length > 0 && (
                <div className="bg-gray-50 dark:bg-[#111] rounded-lg p-3">
                  <h4 className="font-semibold text-sm mb-2">Media ({mediaFiles.length})</h4>
                  <div className="grid grid-cols-4 gap-2">
                    {mediaFiles.slice(0, 8).map((doc: any) => (
                      <div key={doc.id} className="aspect-square bg-gray-200 dark:bg-[#252525] rounded flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-gray-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'calendar' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">Project Events</h3>
                <button
                  onClick={() => {
                    onClose()
                    onOpenCalendar?.(project.id)
                  }}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Event
                </button>
              </div>

              {projectEvents.length > 0 ? (
                <div className="space-y-2">
                  {projectEvents.map((event: any) => (
                    <div key={event.id} className="p-3 bg-gray-50 dark:bg-[#111] rounded-lg border-l-4" style={{ borderColor: event.color || '#3B82F6' }}>
                      <h5 className="font-medium text-sm mb-1">{event.title}</h5>
                      {event.description && <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{event.description}</p>}
                      <div className="flex gap-3 text-xs text-gray-500">
                        <span>{formatDate(event.startTime)}</span>
                        {event.location && <span>📍 {event.location}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No events scheduled</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}