'use client'

import { useState } from 'react'
import { X, Plus, Calendar, CheckSquare, Trash2, Edit } from 'lucide-react'

interface PhaseManagerModalProps {
  projectId: string
  projectName: string
  phases: any[]
  teamMembers: any[]
  onClose: () => void
  onCreatePhase: (data: any) => Promise<void>
  onUpdatePhase: (id: string, updates: any) => Promise<void>
  onDeletePhase: (id: string) => Promise<void>
  onCreateTask: (data: any) => Promise<void>
  onUpdateTask: (id: string, updates: any) => Promise<void>
  onDeleteTask: (id: string) => Promise<void>
}

export default function PhaseManagerModal({
  projectId,
  projectName,
  phases,
  teamMembers,
  onClose,
  onCreatePhase,
  onUpdatePhase,
  onDeletePhase,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
}: PhaseManagerModalProps) {
  const [selectedPhase, setSelectedPhase] = useState<string | null>(phases[0]?.id || null)
  const [showPhaseForm, setShowPhaseForm] = useState(false)
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [editingPhase, setEditingPhase] = useState<any | null>(null)
  const [editingTask, setEditingTask] = useState<any | null>(null)

  const [phaseForm, setPhaseForm] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    color: '#3B82F6',
  })

  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    assignedTo: '',
    dueDate: '',
  })

  const currentPhase = phases.find(p => p.id === selectedPhase)
  const phaseTasks = currentPhase?.tasks || []

  const handleCreatePhase = async () => {
    await onCreatePhase({
      projectId,
      ...phaseForm,
    })
    setPhaseForm({ name: '', description: '', startDate: '', endDate: '', color: '#3B82F6' })
    setShowPhaseForm(false)
  }

  const handleUpdatePhase = async () => {
    if (!editingPhase) return
    await onUpdatePhase(editingPhase.id, phaseForm)
    setEditingPhase(null)
    setPhaseForm({ name: '', description: '', startDate: '', endDate: '', color: '#3B82F6' })
    setShowPhaseForm(false)
  }

  const handleCreateTask = async () => {
    if (!selectedPhase) return
    await onCreateTask({
      projectId,
      phaseId: selectedPhase,
      ...taskForm,
    })
    setTaskForm({ title: '', description: '', priority: 'medium', assignedTo: '', dueDate: '' })
    setShowTaskForm(false)
  }

  const handleUpdateTask = async () => {
    if (!editingTask) return
    await onUpdateTask(editingTask.id, taskForm)
    setEditingTask(null)
    setTaskForm({ title: '', description: '', priority: 'medium', assignedTo: '', dueDate: '' })
    setShowTaskForm(false)
  }

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4" style={{ animation: 'popup-in 0.15s ease-out' }}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-[#1a1a1a] rounded-2xl w-full max-w-6xl h-[85vh] flex flex-col shadow-2xl border border-gray-200 dark:border-[#2a2a2a]">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-[#2a2a2a] px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Phase Manager</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">{projectName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-[#252525] rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Split View */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Phases */}
          <div className="w-1/2 border-r border-gray-200 dark:border-[#2a2a2a] flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-[#2a2a2a] flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Phases ({phases.length})</h3>
              <button
                onClick={() => {
                  setEditingPhase(null)
                  setPhaseForm({ name: '', description: '', startDate: '', endDate: '', color: '#3B82F6' })
                  setShowPhaseForm(true)
                }}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" />
                New Phase
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {phases.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No phases yet</p>
                  <p className="text-xs">Create your first phase</p>
                </div>
              ) : (
                phases.map((phase, index) => (
                  <div
                    key={phase.id}
                    onClick={() => setSelectedPhase(phase.id)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedPhase === phase.id
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-600'
                        : 'bg-gray-50 dark:bg-[#111] border-2 border-transparent hover:bg-gray-100 dark:hover:bg-[#1e1e1e]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
                        style={{ backgroundColor: phase.color }}
                      >
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-1">{phase.name}</h4>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <span>{new Date(phase.startDate).toLocaleDateString()}</span>
                          <span>→</span>
                          <span>{new Date(phase.endDate).toLocaleDateString()}</span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {phase.tasks?.length || 0} tasks
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingPhase(phase)
                            setPhaseForm({
                              name: phase.name,
                              description: phase.description || '',
                              startDate: phase.startDate,
                              endDate: phase.endDate,
                              color: phase.color,
                            })
                            setShowPhaseForm(true)
                          }}
                          className="p-1 hover:bg-white dark:hover:bg-[#252525] rounded transition-colors"
                        >
                          <Edit className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (confirm('Delete this phase and all its tasks?')) {
                              onDeletePhase(phase.id)
                              if (selectedPhase === phase.id) {
                                setSelectedPhase(phases[0]?.id || null)
                              }
                            }
                          }}
                          className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        >
                          <Trash2 className="w-3 h-3 text-red-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right: Tasks */}
          <div className="w-1/2 flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-[#2a2a2a] flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                Tasks {currentPhase && `(${phaseTasks.length})`}
              </h3>
              {currentPhase && (
                <button
                  onClick={() => {
                    setEditingTask(null)
                    setTaskForm({ title: '', description: '', priority: 'medium', assignedTo: '', dueDate: '' })
                    setShowTaskForm(true)
                  }}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  New Task
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {!currentPhase ? (
                <div className="text-center py-12 text-gray-500">
                  <CheckSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Select a phase to view tasks</p>
                </div>
              ) : phaseTasks.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <CheckSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No tasks in this phase</p>
                  <p className="text-xs">Create your first task</p>
                </div>
              ) : (
                phaseTasks.map((task: any) => (
                  <div
                    key={task.id}
                    className="p-3 bg-gray-50 dark:bg-[#111] rounded-lg hover:bg-gray-100 dark:hover:bg-[#1e1e1e] transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={task.status === 'completed'}
                        onChange={() => {
                          onUpdateTask(task.id, {
                            status: task.status === 'completed' ? 'todo' : 'completed'
                          })
                        }}
                        className="mt-1 rounded"
                      />
                      <div className="flex-1">
                        <h5 className={`font-medium text-sm ${task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900 dark:text-gray-100'}`}>
                          {task.title}
                        </h5>
                        {task.description && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{task.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                          <span className="capitalize">{task.priority}</span>
                          {task.assignedToName && <span>{task.assignedToName}</span>}
                          {task.dueDate && <span>Due {new Date(task.dueDate).toLocaleDateString()}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingTask(task)
                            setTaskForm({
                              title: task.title,
                              description: task.description || '',
                              priority: task.priority,
                              assignedTo: task.assignedTo || '',
                              dueDate: task.dueDate || '',
                            })
                            setShowTaskForm(true)
                          }}
                          className="p-1 hover:bg-white dark:hover:bg-[#252525] rounded transition-colors"
                        >
                          <Edit className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Delete this task?')) {
                              onDeleteTask(task.id)
                            }
                          }}
                          className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        >
                          <Trash2 className="w-3 h-3 text-red-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Phase Form Modal */}
        {showPhaseForm && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-10">
            <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">{editingPhase ? 'Edit Phase' : 'Create Phase'}</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Name *</label>
                  <input
                    type="text"
                    value={phaseForm.name}
                    onChange={e => setPhaseForm({ ...phaseForm, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Phase name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={phaseForm.description}
                    onChange={e => setPhaseForm({ ...phaseForm, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    rows={2}
                    placeholder="Phase description"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Start Date *</label>
                    <input
                      type="date"
                      value={phaseForm.startDate}
                      onChange={e => setPhaseForm({ ...phaseForm, startDate: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">End Date *</label>
                    <input
                      type="date"
                      value={phaseForm.endDate}
                      onChange={e => setPhaseForm({ ...phaseForm, endDate: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Color</label>
                  <input
                    type="color"
                    value={phaseForm.color}
                    onChange={e => setPhaseForm({ ...phaseForm, color: e.target.value })}
                    className="w-full h-10 rounded-lg"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => {
                    setShowPhaseForm(false)
                    setEditingPhase(null)
                  }}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={editingPhase ? handleUpdatePhase : handleCreatePhase}
                  disabled={!phaseForm.name || !phaseForm.startDate || !phaseForm.endDate}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {editingPhase ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Task Form Modal */}
        {showTaskForm && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-10">
            <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">{editingTask ? 'Edit Task' : 'Create Task'}</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Title *</label>
                  <input
                    type="text"
                    value={taskForm.title}
                    onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Task title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={taskForm.description}
                    onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    rows={2}
                    placeholder="Task description"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Priority</label>
                    <select
                      value={taskForm.priority}
                      onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Due Date</label>
                    <input
                      type="date"
                      value={taskForm.dueDate}
                      onChange={e => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Assign To</label>
                  <select
                    value={taskForm.assignedTo}
                    onChange={e => setTaskForm({ ...taskForm, assignedTo: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Unassigned</option>
                    {teamMembers.map(member => (
                      <option key={member.id} value={member.id}>{member.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => {
                    setShowTaskForm(false)
                    setEditingTask(null)
                  }}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={editingTask ? handleUpdateTask : handleCreateTask}
                  disabled={!taskForm.title}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {editingTask ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
