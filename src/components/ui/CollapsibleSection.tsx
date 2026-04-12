'use client'

import { useState } from 'react'

interface CollapsibleSectionProps {
  title: string
  id: string
  children: React.ReactNode
  defaultOpen?: boolean
}

export default function CollapsibleSection({ title, id, children, defaultOpen = false }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border border-gray-200 dark:border-[#2a2a2a] rounded-xl overflow-hidden mb-4 flex-shrink-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-gray-50 dark:bg-[#222222] flex items-center justify-between hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors"
      >
        <span className="font-medium text-gray-800 dark:text-gray-200">{title}</span>
        <svg
          className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div 
        className={`transition-all duration-300 ease-in-out ${
          isOpen ? 'opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
        }`}
      >
        <div className="p-4 bg-white dark:bg-[#1a1a1a] max-h-[350px] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  )
}
