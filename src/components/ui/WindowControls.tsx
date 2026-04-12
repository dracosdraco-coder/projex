'use client'

import { useState } from 'react'

interface WindowControlsProps {
  onClose: () => void
  onMinimize: () => void
  onFullscreen: () => void
}

export default function WindowControls({ onClose, onMinimize, onFullscreen }: WindowControlsProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <div 
      className="flex items-center gap-1.5"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => { e.stopPropagation(); e.preventDefault(); onClose() }}
        className="w-5 h-5 rounded-md bg-gray-200 dark:bg-[#3a3a3a] hover:bg-red-500 hover:text-white flex items-center justify-center transition-all duration-150"
        aria-label="Close window"
      >
        <svg 
          className={`w-3 h-3 transition-opacity duration-150 ${hovered ? 'opacity-100' : 'opacity-0'}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      
      <button
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => { e.stopPropagation(); e.preventDefault(); onMinimize() }}
        className="w-5 h-5 rounded-md bg-gray-200 dark:bg-[#3a3a3a] hover:bg-yellow-500 hover:text-white flex items-center justify-center transition-all duration-150"
        aria-label="Minimize window"
      >
        <svg 
          className={`w-3 h-3 transition-opacity duration-150 ${hovered ? 'opacity-100' : 'opacity-0'}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
        </svg>
      </button>
      
      <button
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => { e.stopPropagation(); e.preventDefault(); onFullscreen() }}
        className="w-5 h-5 rounded-md bg-gray-200 dark:bg-[#3a3a3a] hover:bg-green-500 hover:text-white flex items-center justify-center transition-all duration-150"
        aria-label="Fullscreen window"
      >
        <svg 
          className={`w-3 h-3 transition-opacity duration-150 ${hovered ? 'opacity-100' : 'opacity-0'}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
        </svg>
      </button>
    </div>
  )
}
