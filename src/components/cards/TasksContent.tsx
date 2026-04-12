'use client'

import { useState } from 'react'
import { CheckSquare, Plus, X, Trash2, MessageCircle, Calendar, User } from 'lucide-react'
import Popup from '@/components/ui/Popup'

interface Task {
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

interface TaskComment {
  id: string
  commenterName: string
  content: string
  createdAt: string
}

interface Project {
  id: string
  name: string
}

interface TeamMember {
  id: string
  name: string
}

interface TasksContentProps {
  tasks: Task[]
  projects: Project[]
  teamMembers: TeamMember[]
  onCreateTask: (data: any) => Promise<any>
  onUpdateTask: (id: string, updates: Partial<Task>) => Promise<void>
  onDeleteTask: (id: string) => Promise<void>
onAddComment: (taskId: string, content: string) => Promise<void>}

export default function TasksContent({
  tasks,
  projects,
  teamMembers,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
  onAddComment,
}: TasksContentProps) {
  const [selectedProject, setSelectedProject] = useState<string>('all')
  const [showAddTask, setShowAddTask] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
const [newComment, setNewComment] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    projectId: '',
    priority: 'medium',
    assignedTo: '',
    dueDate: '',
  })

  const filteredTasks = tasks.filter(task => {
    if (selectedProject !== 'all' && task.projectId !== selectedProject) return false
    return true
  })

  const tasksByStatus = {
    'todo': filteredTasks.filter(t => t.status === 'todo'),
    'in-progress': filteredTasks.filter(t => t.status === 'in-progress'),
    'review': filteredTasks.filter(t => t.status === 'review'),
    'completed': filteredTasks.filter(t => t.status === 'completed'),
  }

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    await onCreateTask({
      ...formData,
      status: 'todo',
    })
    setFormData({
      title: '',
      description: '',
      projectId: '',
      priority: 'medium',
      assignedTo: '',
      dueDate: '',
    })
    setShowAddTask(false)
  }

  const handleStatusChange = async (taskId: string, newStatus: Task['status']) => {
    await onUpdateTask(taskId, { status: newStatus })
  }

const handleAddComment = async () => {
  if (!selectedTask || !newComment.trim()) return
  await onAddComment(selectedTask.id, newComment.trim())  // Removed commenterName
  setNewComment('')
}

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-300'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-50 border-green-200'
      case 'in-progress': return 'bg-blue-50 border-blue-200'
      case 'review': return 'bg-purple-50 border-purple-200'
      default: return 'bg-gray-50 border-gray-200'
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white dark:bg-[#1a1a1a] border-b dark:border-[#2a2a2a] px-3 md:px-6 py-3 md:py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <CheckSquare className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold">Tasks</h2>
          </div>
          <button
            onClick={() => setShowAddTask(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Task
          </button>
        </div>

        <select
          value={selectedProject}
          onChange={e => setSelectedProject(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Projects</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto overflow-y-auto p-3 md:p-6">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-[#222] flex items-center justify-center mb-4">
              <CheckSquare className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">No tasks yet</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs mb-4">Add tasks to organize your work and track progress across projects.</p>
          </div>
        ) : (
        <div className="flex flex-col md:flex-row gap-4 md:min-w-max md:h-full">
          {/* To Do Column */}
          <div className="flex-1 min-w-0 md:min-w-[300px]">
            <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border dark:border-[#2a2a2a] md:h-full max-h-[50vh] md:max-h-none flex flex-col">
              <div className="px-4 py-3 border-b bg-gray-50">
                <h3 className="font-semibold text-gray-700">To Do ({tasksByStatus['todo'].length})</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {tasksByStatus['todo'].map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onStatusChange={handleStatusChange}
                    onDelete={onDeleteTask}
                    onViewDetails={setSelectedTask}
                    getPriorityColor={getPriorityColor}
                    formatDate={formatDate}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* In Progress Column */}
          <div className="flex-1 min-w-0 md:min-w-[300px]">
            <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border dark:border-[#2a2a2a] md:h-full max-h-[50vh] md:max-h-none flex flex-col">
              <div className="px-4 py-3 border-b bg-blue-50">
                <h3 className="font-semibold text-blue-700">In Progress ({tasksByStatus['in-progress'].length})</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {tasksByStatus['in-progress'].map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onStatusChange={handleStatusChange}
                    onDelete={onDeleteTask}
                    onViewDetails={setSelectedTask}
                    getPriorityColor={getPriorityColor}
                    formatDate={formatDate}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Review Column */}
          <div className="flex-1 min-w-0 md:min-w-[300px]">
            <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border dark:border-[#2a2a2a] md:h-full max-h-[50vh] md:max-h-none flex flex-col">
              <div className="px-4 py-3 border-b bg-purple-50">
                <h3 className="font-semibold text-purple-700">Review ({tasksByStatus['review'].length})</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {tasksByStatus['review'].map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onStatusChange={handleStatusChange}
                    onDelete={onDeleteTask}
                    onViewDetails={setSelectedTask}
                    getPriorityColor={getPriorityColor}
                    formatDate={formatDate}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Completed Column */}
          <div className="flex-1 min-w-0 md:min-w-[300px]">
            <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border dark:border-[#2a2a2a] md:h-full max-h-[50vh] md:max-h-none flex flex-col">
              <div className="px-4 py-3 border-b bg-green-50">
                <h3 className="font-semibold text-green-700">Completed ({tasksByStatus['completed'].length})</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {tasksByStatus['completed'].map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onStatusChange={handleStatusChange}
                    onDelete={onDeleteTask}
                    onViewDetails={setSelectedTask}
                    getPriorityColor={getPriorityColor}
                    formatDate={formatDate}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
        )}
      </div>

      {/* Add Task Modal */}
      <Popup isOpen={showAddTask} onClose={() => setShowAddTask(false)} title="New Task" size="md">
        <div className="p-6">
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project *</label>
                <select
                  required
                  value={formData.projectId}
                  onChange={e => setFormData({ ...formData, projectId: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">Select project</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={formData.priority}
                  onChange={e => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
                <select
                  value={formData.assignedTo}
                  onChange={e => setFormData({ ...formData, assignedTo: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">Unassigned</option>
                  {teamMembers.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddTask(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Task
                </button>
              </div>
            </form>
        </div>
      </Popup>

      {/* Task Details Modal */}
      <Popup isOpen={!!selectedTask} onClose={() => setSelectedTask(null)} title={selectedTask?.title || 'Task Details'} size="lg">
        {selectedTask && (
        <div className="p-6">

            {selectedTask.description && (
              <p className="text-gray-700 mb-4">{selectedTask.description}</p>
            )}

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-sm">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(selectedTask.priority)}`}>
                  {selectedTask.priority.toUpperCase()}
                </span>
                {selectedTask.assignedToName && (
                  <div className="flex items-center gap-1 text-gray-600">
                    <User className="w-4 h-4" />
                    <span>{selectedTask.assignedToName}</span>
                  </div>
                )}
                {selectedTask.dueDate && (
                  <div className="flex items-center gap-1 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(selectedTask.dueDate)}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <select
                  value={selectedTask.status}
                  onChange={e => handleStatusChange(selectedTask.id, e.target.value as Task['status'])}
                  className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="review">Review</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            {/* Comments */}
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                Comments ({selectedTask.comments?.length || 0})
              </h4>

              <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                {selectedTask.comments?.map(comment => (
                  <div key={comment.id} className="bg-gray-50 rounded p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{comment.commenterName}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(comment.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{comment.content}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleAddComment()
                    }}
                    className="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleAddComment}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    Comment
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Popup>
    </div>
  )
}

// Task Card Component
function TaskCard({
  task,
  onStatusChange,
  onDelete,
  onViewDetails,
  getPriorityColor,
  formatDate,
}: {
  task: Task
  onStatusChange: (id: string, status: Task['status']) => void
  onDelete: (id: string) => void
  onViewDetails: (task: Task) => void
  getPriorityColor: (priority: string) => string
  formatDate: (date: string) => string
}) {
  return (
    <div className="bg-white border rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-start justify-between mb-2">
        <h4 
          className="font-medium text-sm flex-1 cursor-pointer hover:text-blue-600"
          onClick={() => onViewDetails(task)}
        >
          {task.title}
        </h4>
<div className="flex items-start justify-between mb-2">
  <div className="flex-1">
    <h4 
      className="font-medium text-sm cursor-pointer hover:text-blue-600"
      onClick={() => onViewDetails(task)}
    >
      {task.title}
    </h4>
    {task.projectName && (
      <p className="text-xs text-gray-500 mt-0.5">{task.projectName}</p>
    )}
  </div>
  <button
    onClick={() => onDelete(task.id)}
    className="text-gray-400 hover:text-red-600 ml-2"
  >
    <Trash2 className="w-3 h-3" />
  </button>
</div>
        
      </div>

      {task.description && (
        <p className="text-xs text-gray-600 mb-2 line-clamp-2">{task.description}</p>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(task.priority)}`}>
          {task.priority}
        </span>
        
        {task.assignedToName && (
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <User className="w-3 h-3" />
            <span>{task.assignedToName}</span>
          </div>
        )}
        
        {task.dueDate && (
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <Calendar className="w-3 h-3" />
            <span>{formatDate(task.dueDate)}</span>
          </div>
        )}

        {task.comments && task.comments.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <MessageCircle className="w-3 h-3" />
            <span>{task.comments.length}</span>
          </div>
        )}
      </div>

      <select
        value={task.status}
        onChange={e => {
          e.stopPropagation()
          onStatusChange(task.id, e.target.value as Task['status'])
        }}
        onClick={e => e.stopPropagation()}
        className="w-full mt-2 px-2 py-1 border rounded text-xs focus:ring-2 focus:ring-blue-500"
      >
        <option value="todo">To Do</option>
        <option value="in-progress">In Progress</option>
        <option value="review">Review</option>
        <option value="completed">Completed</option>
      </select>
    </div>
  )
}