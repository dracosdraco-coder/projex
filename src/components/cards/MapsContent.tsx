'use client'

import { useState } from 'react'
import { Project } from '@/types'

interface MapsContentProps {
  projects: Project[]
}

export default function MapsContent({ projects = [] }: MapsContentProps) {
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])

  const projectsWithAddress = projects.filter(p => p.address && p.address.trim() !== '')

  const toggleProject = (id: string) => {
    setSelectedProjects(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
  }

  const selectAll = () => {
    if (selectedProjects.length === projectsWithAddress.length) {
      setSelectedProjects([])
    } else {
      setSelectedProjects(projectsWithAddress.map(p => p.id))
    }
  }

  const openInGoogleMaps = (address: string) => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank')
  }

  const openInAppleMaps = (address: string) => {
    window.open(`https://maps.apple.com/?q=${encodeURIComponent(address)}`, '_blank')
  }

  const openRouteInGoogleMaps = () => {
    const selected = projectsWithAddress.filter(p => selectedProjects.includes(p.id))
    if (selected.length < 2) return

    const origin = encodeURIComponent(selected[0].address || '')
    const destination = encodeURIComponent(selected[selected.length - 1].address || '')
    const waypoints = selected.slice(1, -1).map(p => encodeURIComponent(p.address || '')).join('|')

    let url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`
    if (waypoints) url += `&waypoints=${waypoints}`
    url += '&travelmode=driving'

    window.open(url, '_blank')
  }

  const openRouteInAppleMaps = () => {
    const selected = projectsWithAddress.filter(p => selectedProjects.includes(p.id))
    if (selected.length < 2) return

    const addresses = selected.map(p => encodeURIComponent(p.address || ''))
    // Apple Maps supports daddr for directions
    let url = `https://maps.apple.com/?saddr=${addresses[0]}&daddr=${addresses.slice(1).join('&daddr=')}`
    window.open(url, '_blank')
  }

  if (projectsWithAddress.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-6">
        <div className="text-5xl mb-4">📍</div>
        <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">No Project Locations</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
          Add addresses to your projects to see them here and plan routes between job sites.
        </p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Project Locations</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {projectsWithAddress.length} project{projectsWithAddress.length !== 1 ? 's' : ''} with addresses
          </p>
        </div>
        {selectedProjects.length >= 2 && (
          <div className="flex gap-2">
            <button
              onClick={openRouteInGoogleMaps}
              className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-sm font-medium rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            >
              Route in Google Maps
            </button>
            <button
              onClick={openRouteInAppleMaps}
              className="px-3 py-2 bg-gray-100 dark:bg-[#2a2a2a] text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-[#333] transition-colors"
            >
              Route in Apple Maps
            </button>
          </div>
        )}
      </div>

      {/* Select all */}
      <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100 dark:border-[#2a2a2a]">
        <button
          onClick={selectAll}
          className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
        >
          {selectedProjects.length === projectsWithAddress.length ? 'Deselect all' : 'Select all for route'}
        </button>
        {selectedProjects.length > 0 && (
          <span className="text-xs text-gray-400">{selectedProjects.length} selected</span>
        )}
      </div>

      {/* Project list */}
      <div className="flex-1 overflow-auto space-y-2">
        {projectsWithAddress.map((project) => {
          const isSelected = selectedProjects.includes(project.id)
          const orderNum = isSelected ? selectedProjects.indexOf(project.id) + 1 : null

          return (
            <div
              key={project.id}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-colors cursor-pointer ${
                isSelected
                  ? 'border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10'
                  : 'border-gray-100 dark:border-[#2a2a2a] hover:bg-gray-50 dark:hover:bg-[#222]'
              }`}
              onClick={() => toggleProject(project.id)}
            >
              {/* Route order number or checkbox */}
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold ${
                isSelected
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-[#2a2a2a] text-gray-400'
              }`}>
                {orderNum || '·'}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{project.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{project.address}</p>
                {project.client && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{project.client}</p>
                )}
              </div>

              {/* Status */}
              <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                project.status === 'active' ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400' :
                project.status === 'completed' ? 'bg-gray-100 dark:bg-[#1a1a1a] text-gray-500' :
                'bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
              }`}>
                {project.status}
              </span>

              {/* Quick action buttons */}
              <div className="flex gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => openInGoogleMaps(project.address || '')}
                  className="p-1.5 text-xs rounded-lg hover:bg-gray-100 dark:hover:bg-[#333] text-gray-500 transition-colors"
                  title="Open in Google Maps"
                >
                  🗺️
                </button>
                <button
                  onClick={() => openInAppleMaps(project.address || '')}
                  className="p-1.5 text-xs rounded-lg hover:bg-gray-100 dark:hover:bg-[#333] text-gray-500 transition-colors"
                  title="Open in Apple Maps"
                >
                  📍
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
