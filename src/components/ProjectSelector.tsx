'use client'

import { Project } from '@/types'

interface ProjectSelectorProps {
  projects: Project[]
  selectedProjectId: string
  onProjectSelect: (projectId: string) => void
}

export default function ProjectSelector({
  projects,
  selectedProjectId,
  onProjectSelect,
}: ProjectSelectorProps) {
  const selectedProject = projects.find(p => p.id === selectedProjectId)

  return (
    <div className="relative">
      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
        Active Project
      </label>
      <div className="relative">
        <select
          value={selectedProjectId}
          onChange={(e) => onProjectSelect(e.target.value)}
          className="w-64 pl-3 pr-10 py-2.5 bg-white dark:bg-[#1c1c1e] border border-gray-300 dark:border-[#2c2c2e] rounded-lg text-sm font-medium text-gray-900 dark:text-white appearance-none cursor-pointer hover:border-gray-400 dark:hover:border-[#3c3c3e] focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white transition-colors"
        >
          <option value="">All Projects</option>
          {projects.map(project => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {selectedProject && (
        <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
          {selectedProject.status} • {selectedProject.branch}
        </p>
      )}
    </div>
  )
}
