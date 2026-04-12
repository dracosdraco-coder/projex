'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

interface CanvasTransform {
  x: number
  y: number
  scale: number
}

const MIN_ZOOM = 0.15
const MAX_ZOOM = 3
const ZOOM_STEP = 0.08

export type CanvasMode = 'select' | 'pan'

export function useCanvas() {
  const [transform, setTransform] = useState<CanvasTransform>({ x: 0, y: 0, scale: 1 })
  const [isPanning, setIsPanning] = useState(false)
  const [mode, setMode] = useState<CanvasMode>('select')
  const panStart = useRef({ x: 0, y: 0 })
  const transformRef = useRef(transform)
  const containerRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number | null>(null)

  // Keep ref in sync (avoid stale closures)
  useEffect(() => {
    transformRef.current = transform
  }, [transform])

  // ─── Wheel handler ────────────────────────────────────────
  // Mac trackpad: two-finger scroll = pan, pinch = zoom (sends ctrlKey)
  // Mouse wheel: scroll = zoom, shift+scroll = horizontal pan
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()

    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    const t = transformRef.current

    if (e.ctrlKey || e.metaKey) {
      // ── Pinch-to-zoom (trackpad sends ctrlKey + deltaY) ──
      // Use a dampened sensitivity for smooth pinch feel
      const rawDelta = -e.deltaY
      const dampened = rawDelta * 0.01
      const newScale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, t.scale * (1 + dampened)))
      const ratio = newScale / t.scale

      // Zoom toward cursor
      const cx = e.clientX - rect.left
      const cy = e.clientY - rect.top

      setTransform({
        scale: newScale,
        x: cx - (cx - t.x) * ratio,
        y: cy - (cy - t.y) * ratio,
      })
    } else {
      // ── Two-finger scroll = pan (trackpad default) ──
      // Also handles mouse wheel: deltaY = vertical, deltaX = horizontal
      setTransform(prev => ({
        ...prev,
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY,
      }))
    }
  }, [])

  // Attach with passive: false to enable preventDefault
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

  // ─── Touch support (mobile / tablet) ──────────────────────
  const touchState = useRef<{
    type: 'none' | 'pan' | 'pinch'
    startX: number
    startY: number
    startDist: number
    startScale: number
    startTx: number
    startTy: number
  }>({ type: 'none', startX: 0, startY: 0, startDist: 0, startScale: 1, startTx: 0, startTy: 0 })

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch start
      e.preventDefault()
      const t = transformRef.current
      const dx = e.touches[1].clientX - e.touches[0].clientX
      const dy = e.touches[1].clientY - e.touches[0].clientY
      touchState.current = {
        type: 'pinch',
        startX: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        startY: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        startDist: Math.sqrt(dx * dx + dy * dy),
        startScale: t.scale,
        startTx: t.x,
        startTy: t.y,
      }
    } else if (e.touches.length === 1) {
      // Single finger pan (only in pan mode)
      const t = transformRef.current
      touchState.current = {
        type: 'pan',
        startX: e.touches[0].clientX - t.x,
        startY: e.touches[0].clientY - t.y,
        startDist: 0,
        startScale: t.scale,
        startTx: t.x,
        startTy: t.y,
      }
    }
  }, [])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    const ts = touchState.current

    if (ts.type === 'pinch' && e.touches.length === 2) {
      e.preventDefault()
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return

      const dx = e.touches[1].clientX - e.touches[0].clientX
      const dy = e.touches[1].clientY - e.touches[0].clientY
      const dist = Math.sqrt(dx * dx + dy * dy)
      const scaleRatio = dist / ts.startDist
      const newScale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, ts.startScale * scaleRatio))
      const ratio = newScale / ts.startScale

      const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left
      const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top

      // Also track pan during pinch
      const panDx = midX - (ts.startX - rect.left)
      const panDy = midY - (ts.startY - rect.top)

      setTransform({
        scale: newScale,
        x: ts.startTx * ratio + panDx,
        y: ts.startTy * ratio + panDy,
      })
    } else if (ts.type === 'pan' && e.touches.length === 1) {
      setTransform(prev => ({
        ...prev,
        x: e.touches[0].clientX - ts.startX,
        y: e.touches[0].clientY - ts.startY,
      }))
    }
  }, [])

  const handleTouchEnd = useCallback(() => {
    touchState.current = { type: 'none', startX: 0, startY: 0, startDist: 0, startScale: 1, startTx: 0, startTy: 0 }
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.addEventListener('touchstart', handleTouchStart, { passive: false })
    el.addEventListener('touchmove', handleTouchMove, { passive: false })
    el.addEventListener('touchend', handleTouchEnd)
    return () => {
      el.removeEventListener('touchstart', handleTouchStart)
      el.removeEventListener('touchmove', handleTouchMove)
      el.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd])

  // ─── Click-drag panning (pan mode or middle click) ────────
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    // Middle click always pans
    if (e.button === 1) {
      e.preventDefault()
      setIsPanning(true)
      panStart.current = { x: e.clientX - transformRef.current.x, y: e.clientY - transformRef.current.y }
      return
    }

    // Left click in pan mode
    if (mode === 'pan' && e.button === 0) {
      e.preventDefault()
      setIsPanning(true)
      panStart.current = { x: e.clientX - transformRef.current.x, y: e.clientY - transformRef.current.y }
      return
    }
  }, [mode])

  const onPanMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return
    // Use rAF for smooth movement
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    const clientX = e.clientX
    const clientY = e.clientY
    rafRef.current = requestAnimationFrame(() => {
      setTransform(prev => ({
        ...prev,
        x: clientX - panStart.current.x,
        y: clientY - panStart.current.y,
      }))
    })
  }, [isPanning])

  const endPan = useCallback(() => {
    setIsPanning(false)
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  // ─── Keyboard shortcuts ──────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Space bar toggles pan mode temporarily
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault()
        setMode('pan')
      }
      // V for select mode
      if (e.code === 'KeyV' && e.target === document.body) {
        setMode('select')
      }
      // H for pan mode
      if (e.code === 'KeyH' && e.target === document.body) {
        setMode('pan')
      }
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setMode('select')
        setIsPanning(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  // ─── Button zoom controls ────────────────────────────────
  const zoomIn = useCallback(() => {
    setTransform(prev => {
      const newScale = Math.min(MAX_ZOOM, prev.scale * (1 + ZOOM_STEP * 3))
      const ratio = newScale / prev.scale
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return { ...prev, scale: newScale }
      const cx = rect.width / 2
      const cy = rect.height / 2
      return { scale: newScale, x: cx - (cx - prev.x) * ratio, y: cy - (cy - prev.y) * ratio }
    })
  }, [])

  const zoomOut = useCallback(() => {
    setTransform(prev => {
      const newScale = Math.max(MIN_ZOOM, prev.scale / (1 + ZOOM_STEP * 3))
      const ratio = newScale / prev.scale
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return { ...prev, scale: newScale }
      const cx = rect.width / 2
      const cy = rect.height / 2
      return { scale: newScale, x: cx - (cx - prev.x) * ratio, y: cy - (cy - prev.y) * ratio }
    })
  }, [])

  const resetView = useCallback(() => {
    setTransform({ x: 0, y: 0, scale: 1 })
  }, [])

  const fitToContent = useCallback((windows: { x: number; y: number; w: number; h: number }[]) => {
    if (windows.length === 0) return resetView()
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    const pad = 80
    const minX = Math.min(...windows.map(w => w.x)) - pad
    const minY = Math.min(...windows.map(w => w.y)) - pad
    const maxX = Math.max(...windows.map(w => w.x + w.w)) + pad
    const maxY = Math.max(...windows.map(w => w.y + w.h)) + pad

    const cw = maxX - minX
    const ch = maxY - minY
    const scale = Math.min(rect.width / cw, rect.height / ch, 1)

    setTransform({
      scale,
      x: (rect.width - cw * scale) / 2 - minX * scale,
      y: (rect.height - ch * scale) / 2 - minY * scale,
    })
  }, [resetView])

  const screenToCanvas = useCallback((screenX: number, screenY: number) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return { x: 0, y: 0 }
    return {
      x: (screenX - rect.left - transform.x) / transform.scale,
      y: (screenY - rect.top - transform.y) / transform.scale,
    }
  }, [transform])

  return {
    transform,
    isPanning,
    mode,
    setMode,
    containerRef,
    handleCanvasMouseDown,
    onPanMove,
    endPan,
    zoomIn,
    zoomOut,
    resetView,
    fitToContent,
    screenToCanvas,
    zoomPercent: Math.round(transform.scale * 100),
  }
}
