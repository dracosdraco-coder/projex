'use client'

import { useState, useMemo } from 'react'
import { Project } from '@/types'
import { formatCurrency } from '@/lib/utils'
import ProjectDetailModal from '@/components/ProjectDetailModal'
import EmptyState from '@/components/ui/EmptyState'
import { 
  Search, 
  Grid3x3, 
  List, 
  Plus, 
  Filter,
  SortAsc,
  Calendar,
  DollarSign,
  Users,
  MapPin,
  MoreVertical,
  Edit,
  Trash2,
  Eye
} from 'lucide-react'

interface ProjectsContentProps {
  projects: any[]
  messages?: any[]
  documents?: any[]
  phases?: any[]
  events?: any[]
  teamMembers?: any[]
  onCreateProject?: () => void
  onEditProject?: (project: any) => void
  onDeleteProject?: (projectId: string, projectName: string) => void
    onOpenPhaseManager?: (projectId: string) => void

  onOpenMessages?: (projectId: string) => void
  onCreatePhase?: (projectId: string) => void
  onCreateTask?: (projectId: string, phaseId?: string) => void
  onUploadDocument?: (projectId: string) => void
  onOpenDocuments?: (projectId: string) => void  // ADD
  onOpenBudgeting?: (projectId: string) => void  // ADD
  onOpenCalendar?: (projectId: string) => void
}

type ViewMode = 'grid' | 'list'
type FilterStatus = 'all' | 'active' | 'completed' | 'on-hold'

export default function ProjectsContent({ 
  projects = [], 
  messages = [],
  documents = [],
  events = [],
  phases = [],  // ADD
  teamMembers = [],  // ADD
  onCreateProject,
  onEditProject,
  onDeleteProject,
  onOpenMessages,
  onCreatePhase,  // ADD
  onCreateTask,  // ADD
  onUploadDocument,  // ADD
  onOpenDocuments,  // ADD
  onOpenBudgeting,
  onOpenCalendar,
  onOpenPhaseManager, 
}: ProjectsContentProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all')
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'progress' | 'budget'>('name')
const [selectedProject, setSelectedProject] = useState<any | null>(null)

  // Filter and search projects
  const filteredProjects = useMemo(() => {
    return projects
      .filter(project => {
        const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (project.client || '').toLowerCase().includes(searchQuery.toLowerCase())
        const matchesStatus = statusFilter === 'all' || project.status === statusFilter
        return matchesSearch && matchesStatus
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'name':
            return a.name.localeCompare(b.name)
          case 'date':
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          case 'progress':
            return (b.progress || 0) - (a.progress || 0)
          case 'budget':
            return (b.contractAmount || 0) - (a.contractAmount || 0)
          default:
            return 0
        }
      })
  }, [projects, searchQuery, statusFilter, sortBy])

  const statusColors = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    'on-hold': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
  }

  if (projects.length === 0) {
    return (
      <EmptyState
        icon="projects"
        title="No projects yet"
        description="Create your first project to start managing your work."
        actionLabel="New Project"
        onAction={onCreateProject}
      />
    )
  }


  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-[#111]">
      {/* Header */}
      <div className="bg-white dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-[#2a2a2a] px-3 md:px-6 py-3 md:py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Projects</h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {filteredProjects.length} {filteredProjects.length === 1 ? 'project' : 'projects'}
            </span>
          </div>
          
          <button
            onClick={onCreateProject}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Project
          </button>
        </div>

        {/* Filters & Search */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-[#333] rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#252525] text-gray-900 dark:text-gray-100"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as FilterStatus)}
            className="px-3 py-2 border border-gray-300 dark:border-[#333] rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#252525] text-gray-900 dark:text-gray-100"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="on-hold">On Hold</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 dark:border-[#333] rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#252525] text-gray-900 dark:text-gray-100"
          >
            <option value="name">Name</option>
            <option value="date">Date</option>
            <option value="progress">Progress</option>
            <option value="budget">Budget</option>
          </select>

          {/* View Toggle */}
          <div className="flex bg-gray-100 dark:bg-[#252525] rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-white dark:bg-[#333] shadow-sm' 
                  : 'hover:bg-gray-200 dark:hover:bg-[#333]'
              }`}
            >
              <Grid3x3 className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'list' 
                  ? 'bg-white dark:bg-[#333] shadow-sm' 
                  : 'hover:bg-gray-200 dark:hover:bg-[#333]'
              }`}
            >
              <List className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            </button>
          </div>
        </div>
      </div>

      {/* Projects Grid/List */}
      <div className="flex-1 overflow-y-auto p-6">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map(project => (
              <ProjectCard
                key={project.id}
                project={project}
                statusColors={statusColors}
                onView={() => {
                  setSelectedProject(project)}}
                onEdit={() => onEditProject?.(project)}
                onDelete={() => onDeleteProject?.(project.id, project.name)}
              />
            ))}
          </div>
        ) : (
          <ProjectList
            projects={filteredProjects}
            statusColors={statusColors}
            onView={setSelectedProject}
            onEdit={onEditProject}
            onDelete={onDeleteProject}
          />
        )}

{selectedProject && (
  <ProjectDetailModal
    project={selectedProject}
    phases={phases || []}
    messages={messages}
    documents={documents || []}
    events={events || []}
    onClose={() => setSelectedProject(null)}
    onEdit={(project: any) => {
      setSelectedProject(null)
      onEditProject?.(project)
    }}
    onDelete={(id: string) => {
      setSelectedProject(null)
      onDeleteProject?.(id, selectedProject.name)
    }}
    onOpenPhaseManager={(projectId: string) => {
      setSelectedProject(null)
      onOpenPhaseManager?.(projectId)
    }}
    onOpenMessages={(projectId: string) => {
      setSelectedProject(null)
      onOpenMessages?.(projectId)
    }}
    onOpenCalendar={(projectId: string) => {
  setSelectedProject(null)
  onOpenCalendar?.(projectId)
}}
    onOpenDocuments={(projectId: string) => {  // ADD
      setSelectedProject(null)
      onOpenDocuments?.(projectId)
    }}
    onOpenBudgeting={(projectId: string) => {  // ADD
      setSelectedProject(null)
      onOpenBudgeting?.(projectId)
    }}
  />
)}

        {filteredProjects.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No projects found</p>
            <p className="text-sm">Try adjusting your filters</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Project Card Component
function ProjectCard({ 
  project, 
  statusColors, 
  onView, 
  onEdit, 
  onDelete 
}: {
  project: any  // Change from Project to any
  statusColors: any
  onView: () => void
  onEdit: () => void
  onDelete: () => void
}) {  const [showMenu, setShowMenu] = useState(false)

  return (
    <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#2a2a2a] hover:shadow-lg transition-all cursor-pointer overflow-hidden group">
      <div onClick={onView} className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1 group-hover:text-blue-600 transition-colors">
              {project.name}
            </h3>
            {project.client && (
              <p className="text-sm text-gray-600 dark:text-gray-400">{project.client}</p>
            )}
          </div>
          
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowMenu(!showMenu)
              }}
              className="p-1 hover:bg-gray-100 dark:hover:bg-[#252525] rounded transition-colors"
            >
              <MoreVertical className="w-5 h-5 text-gray-400" />
            </button>
            
            {showMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowMenu(false)
                  }}
                />
                <div className="absolute right-0 top-8 bg-white dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-lg shadow-lg py-1 z-20 min-w-[150px]">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onView()
                      setShowMenu(false)
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-[#333] flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    View Details
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onEdit()
                      setShowMenu(false)
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-[#333] flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete()
                      setShowMenu(false)
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Status Badge */}
        <div className="mb-4">
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${statusColors[project.status]}`}>
            {project.status}
          </span>
        </div>

        {/* Meta Info */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <DollarSign className="w-4 h-4" />
            <span>{formatCurrency(project.contractAmount || 0)}</span>
          </div>
          
          {project.address && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <MapPin className="w-4 h-4" />
              <span className="truncate">{project.address}</span>
            </div>
          )}
          
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Calendar className="w-4 h-4" />
            <span>Due: {new Date(project.dueDate).toLocaleDateString()}</span>
          </div>

          {project.team && project.team.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Users className="w-4 h-4" />
              <span>{project.team.length} team {project.team.length === 1 ? 'member' : 'members'}</span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {project.progress !== undefined && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
              <span>Progress</span>
              <span>{project.progress}%</span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-[#252525] rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 rounded-full transition-all duration-300"
                style={{ width: `${project.progress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Project List Component
function ProjectList({ 
  projects, 
  statusColors, 
  onView, 
  onEdit, 
  onDelete 
}: {
  projects: any[]  // Change from Project[] to any[]
  statusColors: any
  onView: (project: any) => void
  onEdit?: (project: any) => void
  onDelete?: (projectId: string, projectName: string) => void
}) {  return (
    <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#2a2a2a] overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-[#111] border-b border-gray-200 dark:border-[#2a2a2a]">
          <tr>
            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Project</th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Status</th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Budget</th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Due Date</th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Progress</th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-[#2a2a2a]">
          {projects.map((project: Project) => (
            <tr 
              key={project.id}
              onClick={() => onView(project)}
              className="hover:bg-gray-50 dark:hover:bg-[#252525] cursor-pointer transition-colors"
            >
              <td className="px-6 py-4">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{project.name}</p>
                  {project.client && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">{project.client}</p>
                  )}
                </div>
              </td>
              <td className="px-6 py-4">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${statusColors[project.status]}`}>
                  {project.status}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                {formatCurrency(project.contractAmount || 0)}
              </td>
              <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                {new Date(project.dueDate).toLocaleDateString()}
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-200 dark:bg-[#252525] rounded-full overflow-hidden max-w-[100px]">
                    <div 
                      className="h-full bg-blue-600 rounded-full"
                      style={{ width: `${project.progress || 0}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">{project.progress || 0}%</span>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onView(project)
                    }}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-[#333] rounded transition-colors"
                    title="View"
                  >
                    <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onEdit?.(project)
                    }}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-[#333] rounded transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete?.(project.id, project.name)
                    }}
                    className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Import the detail view component at the top
