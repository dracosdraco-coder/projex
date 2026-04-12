'use client'

import { useState, useCallback, useRef } from 'react'
import { Card, ResizeDirection } from '@/types'

interface CanvasTransform {
  x: number
  y: number
  scale: number
}

export function useWindowManager(initialCards: Card[]) {
  const [cards, setCards] = useState<Card[]>(initialCards)
  const [activeCard, setActiveCard] = useState<string | null>('dashboard')
  const [dragging, setDragging] = useState<string | null>(null)
  const [resizing, setResizing] = useState<string | null>(null)
  const [resizeDirection, setResizeDirection] = useState<ResizeDirection | null>(null)

  const dragStartCanvas = useRef({ x: 0, y: 0 })
  const dragStartCardPos = useRef({ x: 0, y: 0 })
  const resizeStart = useRef({ x: 0, y: 0, width: 0, height: 0, posX: 0, posY: 0 })
  const transformRef = useRef<CanvasTransform>({ x: 0, y: 0, scale: 1 })
  const rafRef = useRef<number | null>(null)

  const setTransformRef = useCallback((t: CanvasTransform) => {
    transformRef.current = t
  }, [])

  const handleToggleDockItem = useCallback((cardId: string) => {
    setCards(prev => prev.map(card =>
      card.id === cardId
        ? { ...card, showInDock: card.showInDock === false ? true : false }
        : card
    ))
  }, [])

  const handleDockReorder = useCallback((newOrder: Card[]) => {
    setCards(newOrder)
  }, [])

  const openCards = cards.filter(card => !card.closed)

  // Convert screen → canvas coordinates
  const screenToCanvas = useCallback((clientX: number, clientY: number, containerRect: DOMRect) => {
    const t = transformRef.current
    return {
      x: (clientX - containerRect.left - t.x) / t.scale,
      y: (clientY - containerRect.top - t.y) / t.scale,
    }
  }, [])

  const getContainerRect = useCallback((el: HTMLElement): DOMRect | null => {
    const container = el.closest('[data-canvas-container]')
    return container?.getBoundingClientRect() || null
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent, cardId: string) => {
    if (e.button !== 0) return

    const card = cards.find(c => c.id === cardId)
    if (!card || card.fullscreen) return

    e.preventDefault()
    e.stopPropagation()

    const rect = getContainerRect(e.currentTarget as HTMLElement)
    if (!rect) return

    const canvasPos = screenToCanvas(e.clientX, e.clientY, rect)

    setDragging(cardId)
    setActiveCard(cardId)
    dragStartCanvas.current = canvasPos
    dragStartCardPos.current = { x: card.position.x, y: card.position.y }
  }, [cards, screenToCanvas, getContainerRect])

  const handleResizeMouseDown = useCallback((e: React.MouseEvent, cardId: string, direction: ResizeDirection) => {
    e.preventDefault()
    e.stopPropagation()

    const card = cards.find(c => c.id === cardId)
    if (!card) return

    const rect = getContainerRect(e.currentTarget as HTMLElement)
    if (!rect) return

    const canvasPos = screenToCanvas(e.clientX, e.clientY, rect)

    setResizing(cardId)
    setResizeDirection(direction)
    setActiveCard(cardId)
    resizeStart.current = {
      x: canvasPos.x,
      y: canvasPos.y,
      width: card.size.width,
      height: card.size.height,
      posX: card.position.x,
      posY: card.position.y,
    }
  }, [cards, screenToCanvas, getContainerRect])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging && !resizing) return

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const canvasPos = screenToCanvas(e.clientX, e.clientY, rect)

    // Cancel any pending frame
    if (rafRef.current) cancelAnimationFrame(rafRef.current)

    rafRef.current = requestAnimationFrame(() => {
      if (dragging) {
        const dx = canvasPos.x - dragStartCanvas.current.x
        const dy = canvasPos.y - dragStartCanvas.current.y

        setCards(prev => prev.map(card => {
          if (card.id !== dragging) return card
          return {
            ...card,
            position: {
              x: dragStartCardPos.current.x + dx,
              y: dragStartCardPos.current.y + dy,
            }
          }
        }))
      }

      if (resizing && resizeDirection) {
        const dx = canvasPos.x - resizeStart.current.x
        const dy = canvasPos.y - resizeStart.current.y

        setCards(prev => prev.map(card => {
          if (card.id !== resizing) return card

          let nw = resizeStart.current.width
          let nh = resizeStart.current.height
          let nx = resizeStart.current.posX
          let ny = resizeStart.current.posY

          if (resizeDirection.includes('e')) nw = Math.max(320, resizeStart.current.width + dx)
          if (resizeDirection.includes('w')) { nw = Math.max(320, resizeStart.current.width - dx); nx = resizeStart.current.posX + dx }
          if (resizeDirection.includes('s')) nh = Math.max(240, resizeStart.current.height + dy)
          if (resizeDirection.includes('n')) { nh = Math.max(240, resizeStart.current.height - dy); ny = resizeStart.current.posY + dy }

          return { ...card, size: { width: nw, height: nh }, position: { x: nx, y: ny } }
        }))
      }
    })
  }, [dragging, resizing, resizeDirection, screenToCanvas])

  const handleMouseUp = useCallback(() => {
    setDragging(null)
    setResizing(null)
    setResizeDirection(null)
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  const handleClose = useCallback((cardId: string) => {
    setCards(prev => prev.map(card =>
      card.id === cardId ? { ...card, closed: true, fullscreen: false } : card
    ))
    if (activeCard === cardId) {
      const remaining = cards.filter(c => !c.closed && c.id !== cardId)
      setActiveCard(remaining.length > 0 ? remaining[0].id : null)
    }
  }, [activeCard, cards])

  const handleMinimize = useCallback((cardId: string) => {
    setCards(prev => prev.map(card =>
      card.id === cardId ? { ...card, minimized: !card.minimized } : card
    ))
  }, [])

  const handleFullscreen = useCallback((cardId: string) => {
    setCards(prev => prev.map(card =>
      card.id === cardId ? { ...card, fullscreen: !card.fullscreen } : card
    ))
  }, [])

  const handleDockClick = useCallback((cardId: string) => {
    setCards(prev => prev.map(card => {
      if (card.id === cardId) {
        if (card.closed) return { ...card, closed: false, minimized: false }
        if (activeCard === cardId) return { ...card, minimized: !card.minimized }
      }
      return card
    }))
    setActiveCard(cardId)
  }, [activeCard])

  return {
    cards,
    openCards,
    activeCard,
    dragging,
    resizing,
    setActiveCard,
    setTransformRef,
    handleMouseDown,
    handleResizeMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleClose,
    handleMinimize,
    handleFullscreen,
    handleDockClick,
    handleDockReorder,
    handleToggleDockItem,
  }
}
