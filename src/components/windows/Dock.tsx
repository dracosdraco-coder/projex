'use client'

import { Card } from '@/types'

interface DockProps {
  cards: Card[]
  activeCard: string | null
  onDockClick: (cardId: string) => void
  height: number
}

export default function Dock({ cards, activeCard, onDockClick, height }: DockProps) {
  return (
    <div 
      className="fixed bottom-0 left-0 right-0 bg-white/60 dark:bg-[#1a1a1a]/80 backdrop-blur-md border-t border-gray-200/50 dark:border-[#2a2a2a] px-8 py-3 z-[100]"
      style={{ height }}
    >
      <div className="flex justify-center gap-2 overflow-x-auto">
        {cards.map(card => (
          <button
            key={card.id}
            onClick={() => onDockClick(card.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap hover:scale-105 ${
              activeCard === card.id && !card.closed
                ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                : card.closed
                  ? 'bg-gray-200/70 dark:bg-[#2a2a2a] text-gray-500 dark:text-gray-400 hover:bg-gray-300/70 dark:hover:bg-[#333333]'
                  : 'bg-gray-100/70 dark:bg-[#222222] text-gray-700 dark:text-gray-300 hover:bg-gray-200/70 dark:hover:bg-[#2a2a2a]'
            }`}
          >
            {card.title}
          </button>
        ))}
      </div>
    </div>
  )
}
