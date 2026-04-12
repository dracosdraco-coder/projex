'use client'

import { memo } from 'react'
import { Card, ResizeDirection } from '@/types'
import WindowControls from '@/components/ui/WindowControls'

interface WindowProps {
  card: Card
  isActive: boolean
  isDragging: boolean
  isResizing: boolean
  dockHeight: number
  children: React.ReactNode
  onMouseDown: (e: React.MouseEvent, cardId: string) => void
  onResizeMouseDown: (e: React.MouseEvent, cardId: string, direction: ResizeDirection) => void
  onClose: (cardId: string) => void
  onMinimize: (cardId: string) => void
  onFullscreen: (cardId: string) => void
  onClick: () => void
}

// Minimum pixel dimensions — content won't render smaller than this
const MIN_W = 320
const MIN_H = 240

const RESIZE_DIRS: { className: string; dir: ResizeDirection }[] = [
  { className: 'top-0 left-0 w-6 h-6 cursor-nw-resize', dir: 'nw' },
  { className: 'top-0 right-0 w-6 h-6 cursor-ne-resize', dir: 'ne' },
  { className: 'bottom-0 left-0 w-6 h-6 cursor-sw-resize', dir: 'sw' },
  { className: 'bottom-0 right-0 w-6 h-6 cursor-se-resize', dir: 'se' },
  { className: 'top-0 left-6 right-6 h-2 cursor-n-resize', dir: 'n' },
  { className: 'bottom-0 left-6 right-6 h-2 cursor-s-resize', dir: 's' },
  { className: 'left-0 top-6 bottom-6 w-2 cursor-w-resize', dir: 'w' },
  { className: 'right-0 top-6 bottom-6 w-2 cursor-e-resize', dir: 'e' },
]

const WindowComponent = ({
  card,
  isActive,
  isDragging,
  isResizing,
  dockHeight,
  children,
  onMouseDown,
  onResizeMouseDown,
  onClose,
  onMinimize,
  onFullscreen,
  onClick,
}: WindowProps) => {
  const w = Math.max(card.size.width, MIN_W)
  const h = Math.max(card.size.height, MIN_H)

  // Fullscreen: escape canvas, render in viewport
  if (card.fullscreen) {
    return (
      <div
        onClick={onClick}
        className="fixed bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-[#2a2a2a] z-[100] ring-1 ring-gray-200 dark:ring-[#3a3a3a]"
        style={{
          left: 16,
          top: 72,
          width: 'calc(100vw - 32px)',
          height: `calc(100vh - ${72 + dockHeight + 16}px)`,
          transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <div className="w-full h-full flex flex-col">
          <TitleBar card={card} onMouseDown={onMouseDown} onClose={onClose} onMinimize={onMinimize} onFullscreen={onFullscreen} />
          <div className="flex-1 overflow-auto bg-white dark:bg-[#1a1a1a]">
            {children}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      onClick={onClick}
      className={`absolute bg-white dark:bg-[#1a1a1a] rounded-2xl overflow-visible border border-gray-200 dark:border-[#2a2a2a] ${
        isActive
          ? 'shadow-2xl z-50 ring-1 ring-gray-200 dark:ring-[#3a3a3a]'
          : 'shadow-lg z-10'
      }`}
      style={{
        // Use translate3d for GPU acceleration during drag
        transform: `translate3d(${card.position.x}px, ${card.position.y}px, 0)`,
        width: w,
        height: card.minimized ? 'auto' : h,
        // No transitions during drag/resize for instant response
        transition: isDragging || isResizing ? 'none' : 'box-shadow 0.15s ease-out',
        // Hint to browser this element will move
        willChange: isDragging ? 'transform' : 'auto',
      }}
    >
      {/* Resize handles */}
      {!card.minimized && RESIZE_DIRS.map(({ className, dir }) => (
        <div
          key={dir}
          className={`absolute ${className} z-50`}
          onMouseDown={(e) => {
            e.stopPropagation()
            onResizeMouseDown(e, card.id, dir)
          }}
        />
      ))}

      <div className="w-full h-full rounded-2xl overflow-hidden flex flex-col">
        <TitleBar card={card} onMouseDown={onMouseDown} onClose={onClose} onMinimize={onMinimize} onFullscreen={onFullscreen} />
        {!card.minimized && (
          <div className="flex-1 overflow-auto bg-white dark:bg-[#1a1a1a]">
            {children}
          </div>
        )}
      </div>
    </div>
  )
}

// Memoize to prevent re-renders of windows that haven't changed
const Window = memo(WindowComponent, (prev, next) => {
  // Only re-render if meaningful props changed
  return (
    prev.card === next.card &&
    prev.isActive === next.isActive &&
    prev.isDragging === next.isDragging &&
    prev.isResizing === next.isResizing &&
    prev.children === next.children
  )
})

export default Window

function TitleBar({ card, onMouseDown, onClose, onMinimize, onFullscreen }: {
  card: Card
  onMouseDown: (e: React.MouseEvent, cardId: string) => void
  onClose: (cardId: string) => void
  onMinimize: (cardId: string) => void
  onFullscreen: (cardId: string) => void
}) {
  return (
    <div
      className={`flex items-center justify-between gap-2 px-4 py-3 bg-gray-50 dark:bg-[#222222] select-none flex-shrink-0 border-b border-gray-100 dark:border-[#2a2a2a] ${
        card.fullscreen ? '' : 'cursor-move'
      }`}
      onMouseDown={(e) => {
        if (!card.fullscreen) {
          e.stopPropagation()
          onMouseDown(e, card.id)
        }
      }}
    >
      <div className="flex items-center gap-3">
        <WindowControls
          onClose={() => onClose(card.id)}
          onMinimize={() => onMinimize(card.id)}
          onFullscreen={() => onFullscreen(card.id)}
        />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{card.title}</span>
      </div>
    </div>
  )
}
