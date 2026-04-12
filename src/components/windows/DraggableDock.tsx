'use client'

import { useRef, useState } from 'react'
import { Card } from '@/types'
import CardIcon from '@/components/ui/CardIcon'

interface DraggableDockProps {
  cards: Card[]
  onCardClick: (cardId: string) => void
  onMinimize: (cardId: string) => void
  onReorder: (newOrder: Card[]) => void
  onToggleDockItem?: (cardId: string) => void
}

export default function DraggableDock({
  cards,
  onCardClick,
  onMinimize,
  onReorder,
}: DraggableDockProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const dragItem = useRef<number | null>(null)
  const dragOverItem = useRef<number | null>(null)

  const dockCards = cards.filter(card => card.showInDock !== false)

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.stopPropagation()
    dragItem.current = index
    setDraggedIndex(index)
    const img = new Image()
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
    e.dataTransfer.setDragImage(img, 0, 0)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragEnter = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.stopPropagation()
    dragOverItem.current = index
    setDragOverIndex(index)
  }

  const handleDragEnd = () => {
    if (dragItem.current !== null && dragOverItem.current !== null && dragItem.current !== dragOverItem.current) {
      const allCards = [...cards]
      const dockCardsCopy = [...dockCards]
      const draggedCard = dockCardsCopy[dragItem.current]
      dockCardsCopy.splice(dragItem.current, 1)
      dockCardsCopy.splice(dragOverItem.current, 0, draggedCard)
      const reorderedAll = allCards.map(card => {
        const dockIndex = dockCardsCopy.findIndex(dc => dc.id === card.id)
        return dockIndex >= 0 ? dockCardsCopy[dockIndex] : card
      })
      onReorder(reorderedAll)
    }
    dragItem.current = null
    dragOverItem.current = null
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999]">
      <div className="mx-auto w-fit max-w-[90vw]">
        <div className="bg-white/80 dark:bg-[#1a1a1a]/80 backdrop-blur-2xl rounded-t-2xl px-4 py-3 shadow-2xl shadow-black/10 dark:shadow-black/40 border border-b-0 border-gray-200/50 dark:border-[#333]/50">
          <div className="flex items-end gap-1 overflow-x-auto dock-scrollbar-hide">
            {dockCards.map((card, index) => {
              const isOpen = !card.closed && !card.minimized
              const isMinimized = card.minimized && !card.closed

              return (
                <div
                  key={card.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragEnter={(e) => handleDragEnter(e, index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation() }}
                  className="relative flex-shrink-0"
                >
                  {dragOverIndex === index && draggedIndex !== index && draggedIndex !== null && (
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-500 rounded-full -ml-1 z-10" />
                  )}

                  <button
                    onClick={() => onCardClick(card.id)}
                    title={card.title}
                    className={`
                      relative flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl
                      transition-all duration-150 select-none min-w-[56px]
                      hover:bg-gray-100 dark:hover:bg-[#2a2a2a] active:scale-95
                      ${draggedIndex === index ? 'opacity-30 scale-90' : ''}
                    `}
                  >
                    <div className="text-2xl leading-none pointer-events-none flex items-center justify-center w-7 h-7">
                      <CardIcon type={card.type || card.id || 'projects'} size={20} className="text-gray-600 dark:text-gray-400" />
                    </div>
                    <div className="text-[10px] font-medium text-gray-600 dark:text-gray-400 text-center leading-tight pointer-events-none whitespace-nowrap max-w-[64px] truncate">
                      {card.title}
                    </div>

                    {/* Status dot */}
                    {isOpen && (
                      <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-blue-500 rounded-full" />
                    )}
                    {isMinimized && (
                      <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-amber-500 rounded-full" />
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .dock-scrollbar-hide {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .dock-scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}} />
    </div>
  )
}
