'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

type Tool = 'select' | 'line' | 'rect' | 'circle' | 'text' | 'measure' | 'eraser' | 'pan'

interface DrawingElement {
  id: string; tool: Tool
  x: number; y: number; x2?: number; y2?: number
  width?: number; height?: number; radius?: number
  text?: string; fontSize?: number
  color: string; lineWidth: number
}

interface ImageLayer {
  id: string; name: string; src: string; opacity: number; visible: boolean; img?: HTMLImageElement
}

interface TitleBlock {
  companyName: string; projectName: string; sheetTitle: string
  sheetNumber: string; date: string; drawnBy: string; scale: string
}

const TOOLS: { id: Tool; label: string; icon: string }[] = [
  { id: 'select', label: 'Select', icon: '↖' },
  { id: 'pan', label: 'Pan', icon: '✋' },
  { id: 'line', label: 'Line', icon: '╱' },
  { id: 'rect', label: 'Rectangle', icon: '▭' },
  { id: 'circle', label: 'Circle', icon: '○' },
  { id: 'text', label: 'Text', icon: 'T' },
  { id: 'measure', label: 'Measure', icon: '📐' },
  { id: 'eraser', label: 'Eraser', icon: '⌫' },
]

const COLORS = ['#000000', '#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#FFFFFF']

// 11" × 8.5" at 96 DPI = landscape letter
const PAGE_W = 1056
const PAGE_H = 816

interface DrawingsContentProps {
  projectId?: string
}

export default function DrawingsContent({ projectId }: DrawingsContentProps) {
  const DRAWING_KEY = projectId ? `projex_drawing_${projectId}` : 'projex_drawing'
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [tool, setTool] = useState<Tool>('line')
  const [color, setColor] = useState('#000000')
  const [lineWidth, setLineWidth] = useState(2)
  const [fontSize, setFontSize] = useState(16)
  const [elements, setElements] = useState<DrawingElement[]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentElement, setCurrentElement] = useState<DrawingElement | null>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const panStart = useRef({ x: 0, y: 0 })
  const [layers, setLayers] = useState<ImageLayer[]>([])
  const [showLayers, setShowLayers] = useState(false)
  const [showTitleBlock, setShowTitleBlock] = useState(true)
  const [editTitleBlock, setEditTitleBlock] = useState(false)
  const [exportScale, setExportScale] = useState(2)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [titleBlock, setTitleBlock] = useState<TitleBlock>({
    companyName: 'Your Company', projectName: 'Project Name', sheetTitle: 'Floor Plan',
    sheetNumber: 'A-101', date: new Date().toLocaleDateString(), drawnBy: '', scale: '1/4" = 1\'–0"',
  })

  // Load saved drawing from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAWING_KEY)
      if (saved) {
        const data = JSON.parse(saved)
        if (data.elements) setElements(data.elements)
        if (data.titleBlock) setTitleBlock(data.titleBlock)
      }
    } catch {}
  }, [DRAWING_KEY])

  // Auto-save drawing on changes (debounced)
  const saveTimeout = useRef<NodeJS.Timeout | null>(null)
  useEffect(() => {
    if (elements.length === 0) return
    if (saveTimeout.current) clearTimeout(saveTimeout.current)
    saveTimeout.current = setTimeout(() => {
      try {
        const data = { elements, titleBlock, savedAt: new Date().toISOString() }
        localStorage.setItem(DRAWING_KEY, JSON.stringify(data))
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus('idle'), 1500)
      } catch {}
    }, 1000)
    return () => { if (saveTimeout.current) clearTimeout(saveTimeout.current) }
  }, [elements, titleBlock, DRAWING_KEY])

  const getCoords = useCallback((e: React.MouseEvent) => {
    const c = canvasRef.current; if (!c) return { x: 0, y: 0 }
    const r = c.getBoundingClientRect()
    return { x: (e.clientX - r.left - pan.x) / zoom, y: (e.clientY - r.top - pan.y) / zoom }
  }, [zoom, pan])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const src = ev.target?.result as string
      const img = new Image()
      img.onload = () => setLayers(prev => [...prev, { id: String(Date.now()), name: file.name, src, opacity: 0.3, visible: true, img }])
      img.src = src
    }
    reader.readAsDataURL(file); e.target.value = ''
  }

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (tool === 'pan' || e.button === 1) { setIsPanning(true); panStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y }; return }
    if (tool === 'select') return
    const { x, y } = getCoords(e)
    if (tool === 'eraser') {
      const t = 15 / zoom
      setElements(prev => prev.filter(el => {
        if (el.tool === 'rect') return !(x >= el.x && x <= el.x + (el.width || 0) && y >= el.y && y <= el.y + (el.height || 0))
        if (el.tool === 'circle') return Math.sqrt((x - el.x) ** 2 + (y - el.y) ** 2) > (el.radius || 0) + t
        if (el.tool === 'text') return Math.sqrt((x - el.x) ** 2 + (y - el.y) ** 2) > 20
        const dx = (el.x2 || el.x) - el.x, dy = (el.y2 || el.y) - el.y, lsq = dx * dx + dy * dy
        if (lsq === 0) return Math.sqrt((x - el.x) ** 2 + (y - el.y) ** 2) > t
        const tt = Math.max(0, Math.min(1, ((x - el.x) * dx + (y - el.y) * dy) / lsq))
        return Math.sqrt((x - el.x - tt * dx) ** 2 + (y - el.y - tt * dy) ** 2) > t
      }))
      return
    }
    if (tool === 'text') {
      const text = prompt('Enter text:')
      if (text) setElements(prev => [...prev, { id: `el-${Date.now()}`, tool: 'text', x, y, text, fontSize, color, lineWidth }])
      return
    }
    setIsDrawing(true)
    setCurrentElement({ id: `el-${Date.now()}`, tool, x, y, x2: x, y2: y, width: 0, height: 0, radius: 0, color, lineWidth, fontSize })
  }, [tool, color, lineWidth, fontSize, getCoords, zoom, pan])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) { setPan({ x: e.clientX - panStart.current.x, y: e.clientY - panStart.current.y }); return }
    if (!isDrawing || !currentElement) return
    const { x, y } = getCoords(e)
    setCurrentElement(prev => {
      if (!prev) return prev
      if (prev.tool === 'rect') return { ...prev, width: x - prev.x, height: y - prev.y }
      if (prev.tool === 'circle') return { ...prev, radius: Math.sqrt((x - prev.x) ** 2 + (y - prev.y) ** 2) }
      return { ...prev, x2: x, y2: y }
    })
  }, [isDrawing, currentElement, getCoords, isPanning])

  const handleMouseUp = useCallback(() => {
    if (isPanning) { setIsPanning(false); return }
    if (isDrawing && currentElement) setElements(prev => [...prev, currentElement])
    setIsDrawing(false); setCurrentElement(null)
  }, [isDrawing, currentElement, isPanning])

  useEffect(() => {
    const el = containerRef.current; if (!el) return
    const h = (e: WheelEvent) => { if (e.ctrlKey || e.metaKey) { e.preventDefault(); setZoom(z => Math.min(5, Math.max(0.2, z * (1 - e.deltaY * 0.005)))) } }
    el.addEventListener('wheel', h, { passive: false })
    return () => el.removeEventListener('wheel', h)
  }, [])

  // Render canvas
  const renderCanvas = useCallback((ctx: CanvasRenderingContext2D, scale: number = 1, forExport = false) => {
    const w = PAGE_W, h = PAGE_H
    if (forExport) {
      ctx.setTransform(scale, 0, 0, scale, 0, 0)
    } else {
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
      ctx.setTransform(zoom, 0, 0, zoom, pan.x, pan.y)
    }

    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, w, h)

    // Grid
    if (!forExport) {
      ctx.strokeStyle = 'rgba(200,200,210,0.25)'; ctx.lineWidth = 0.5 / zoom
      for (let x = 0; x <= w; x += 24) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke() }
      for (let y = 0; y <= h; y += 24) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke() }
    }

    // Image layers
    layers.forEach(l => { if (!l.visible || !l.img) return; ctx.globalAlpha = l.opacity; ctx.drawImage(l.img, 0, 0, w, h); ctx.globalAlpha = 1 })

    // Elements
    const allEls = currentElement && !forExport ? [...elements, currentElement] : elements
    allEls.forEach(el => {
      ctx.strokeStyle = el.color; ctx.fillStyle = el.color; ctx.lineWidth = el.lineWidth; ctx.lineCap = 'round'
      if (el.tool === 'line' || el.tool === 'measure') {
        ctx.beginPath(); ctx.moveTo(el.x, el.y); ctx.lineTo(el.x2 || el.x, el.y2 || el.y); ctx.stroke()
        if (el.tool === 'measure') {
          const dx = (el.x2 || el.x) - el.x, dy = (el.y2 || el.y) - el.y, dist = Math.sqrt(dx * dx + dy * dy)
          ctx.font = `bold 14px monospace`; ctx.fillStyle = el.color
          ctx.fillText(`${(dist / 24).toFixed(1)}'`, (el.x + (el.x2 || el.x)) / 2 + 8, (el.y + (el.y2 || el.y)) / 2 - 8)
        }
      } else if (el.tool === 'rect') {
        ctx.strokeRect(el.x, el.y, el.width || 0, el.height || 0)
      } else if (el.tool === 'circle') {
        ctx.beginPath(); ctx.arc(el.x, el.y, el.radius || 0, 0, Math.PI * 2); ctx.stroke()
      } else if (el.tool === 'text') {
        const fs = el.fontSize || 16
        ctx.font = `${fs}px sans-serif`; ctx.fillText(el.text || '', el.x, el.y)
      }
    })

    // Title block
    if (showTitleBlock) {
      const m = 12
      ctx.strokeStyle = '#222'; ctx.lineWidth = 2; ctx.strokeRect(m, m, w - m * 2, h - m * 2)
      ctx.lineWidth = 0.5; ctx.strokeRect(m + 3, m + 3, w - m * 2 - 6, h - m * 2 - 6)

      const tbW = 300, tbH = 80, tbX = w - m - tbW - 5, tbY = h - m - tbH - 5
      ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.fillRect(tbX, tbY, tbW, tbH)
      ctx.strokeStyle = '#222'; ctx.lineWidth = 1.5; ctx.strokeRect(tbX, tbY, tbW, tbH)
      ctx.lineWidth = 0.5
      ctx.beginPath()
      ctx.moveTo(tbX, tbY + 24); ctx.lineTo(tbX + tbW, tbY + 24)
      ctx.moveTo(tbX, tbY + 44); ctx.lineTo(tbX + tbW, tbY + 44)
      ctx.moveTo(tbX, tbY + 62); ctx.lineTo(tbX + tbW, tbY + 62)
      ctx.moveTo(tbX + tbW / 2, tbY + 44); ctx.lineTo(tbX + tbW / 2, tbY + tbH)
      ctx.stroke()

      ctx.fillStyle = '#111'
      ctx.font = 'bold 14px sans-serif'; ctx.fillText(titleBlock.companyName, tbX + 8, tbY + 17)
      ctx.font = '11px sans-serif'; ctx.fillText(titleBlock.projectName, tbX + 8, tbY + 38)
      ctx.font = 'bold 11px sans-serif'; ctx.fillText(titleBlock.sheetTitle, tbX + tbW / 2 + 8, tbY + 38)
      ctx.font = '10px sans-serif'
      ctx.fillText(`Sheet: ${titleBlock.sheetNumber}`, tbX + 8, tbY + 57)
      ctx.fillText(`Scale: ${titleBlock.scale}`, tbX + tbW / 2 + 8, tbY + 57)
      ctx.fillText(`Date: ${titleBlock.date}`, tbX + 8, tbY + 75)
      ctx.fillText(`By: ${titleBlock.drawnBy}`, tbX + tbW / 2 + 8, tbY + 75)
    }
  }, [elements, currentElement, showTitleBlock, titleBlock, zoom, pan, layers])

  useEffect(() => {
    const c = canvasRef.current; if (!c) return
    const ctx = c.getContext('2d'); if (!ctx) return
    renderCanvas(ctx)
  }, [renderCanvas])

  const exportPNG = () => {
    const offscreen = globalThis.document.createElement('canvas')
    offscreen.width = PAGE_W * exportScale; offscreen.height = PAGE_H * exportScale
    const ctx = offscreen.getContext('2d'); if (!ctx) return
    renderCanvas(ctx, exportScale, true)
    const link = globalThis.document.createElement('a')
    link.download = `${titleBlock.sheetNumber || 'drawing'}-${PAGE_W * exportScale}x${PAGE_H * exportScale}.png`
    link.href = offscreen.toDataURL('image/png'); link.click()
  }

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#222] flex-shrink-0 flex-wrap">
        <div className="flex items-center gap-0.5 bg-white dark:bg-[#1a1a1a] rounded-lg p-0.5 border border-gray-200 dark:border-[#333]">
          {TOOLS.map(t => (
            <button key={t.id} onClick={() => setTool(t.id)} title={t.label}
              className={`w-7 h-7 flex items-center justify-center rounded text-xs transition-colors ${tool === t.id ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2a2a2a]'}`}
            >{t.icon}</button>
          ))}
        </div>

        <div className="w-px h-5 bg-gray-200 dark:bg-[#333]" />

        <div className="flex items-center gap-0.5">
          {COLORS.map(c => (
            <button key={c} onClick={() => setColor(c)}
              className={`w-5 h-5 rounded-full border-2 ${color === c ? 'border-gray-900 dark:border-white scale-110' : 'border-gray-300 dark:border-[#333]'}`}
              style={{ backgroundColor: c }} />
          ))}
        </div>

        <div className="w-px h-5 bg-gray-200 dark:bg-[#333]" />

        <div className="flex items-center gap-1">
          <span className="text-[9px] text-gray-400">Line</span>
          <input type="range" min={1} max={8} value={lineWidth} onChange={e => setLineWidth(Number(e.target.value))} className="w-12 h-1 accent-gray-900 dark:accent-white" />
        </div>

        <div className="flex items-center gap-1">
          <span className="text-[9px] text-gray-400">Font</span>
          <select value={fontSize} onChange={e => setFontSize(Number(e.target.value))} className="px-1 py-0.5 bg-white dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded text-[10px]">
            {[10, 12, 14, 16, 20, 24, 28, 32, 40, 48].map(s => <option key={s} value={s}>{s}px</option>)}
          </select>
        </div>

        <div className="w-px h-5 bg-gray-200 dark:bg-[#333]" />

        <button onClick={() => setZoom(z => Math.max(0.2, z / 1.3))} className="px-1 py-0.5 text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] rounded">−</button>
        <span className="text-[10px] text-gray-500 tabular-nums min-w-[32px] text-center">{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom(z => Math.min(5, z * 1.3))} className="px-1 py-0.5 text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] rounded">+</button>
        <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }) }} className="px-1.5 py-0.5 text-[10px] text-gray-500 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] rounded">Fit</button>

        <div className="w-px h-5 bg-gray-200 dark:bg-[#333]" />

        <button onClick={() => fileInputRef.current?.click()} className="px-1.5 py-0.5 text-[10px] text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] rounded">📷 Image</button>
        <button onClick={() => setShowLayers(!showLayers)} className={`px-1.5 py-0.5 text-[10px] rounded ${showLayers ? 'bg-gray-200 dark:bg-[#333]' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-[#2a2a2a]'}`}>Layers</button>
        <button onClick={() => setShowTitleBlock(!showTitleBlock)} className={`px-1.5 py-0.5 text-[10px] rounded ${showTitleBlock ? 'bg-gray-200 dark:bg-[#333]' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-[#2a2a2a]'}`}>Border</button>
        {showTitleBlock && <button onClick={() => setEditTitleBlock(!editTitleBlock)} className="px-1.5 py-0.5 text-[10px] text-gray-500 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] rounded">Edit Info</button>}
        <button onClick={() => elements.length > 0 && setElements(prev => prev.slice(0, -1))} className="px-1.5 py-0.5 text-[10px] text-gray-500 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] rounded">Undo</button>
        {saveStatus === 'saved' && <span className="text-[9px] text-green-500 font-medium">Saved ✓</span>}

        <div className="w-px h-5 bg-gray-200 dark:bg-[#333]" />

        <div className="flex items-center gap-1">
          <span className="text-[9px] text-gray-400">Export</span>
          <select value={exportScale} onChange={e => setExportScale(Number(e.target.value))} className="px-1 py-0.5 bg-white dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded text-[10px]">
            <option value={1}>1x ({PAGE_W}×{PAGE_H})</option>
            <option value={2}>2x ({PAGE_W * 2}×{PAGE_H * 2})</option>
            <option value={3}>3x ({PAGE_W * 3}×{PAGE_H * 3})</option>
          </select>
          <button onClick={exportPNG} className="px-2 py-0.5 text-[10px] text-white bg-gray-900 dark:bg-white dark:text-gray-900 rounded hover:bg-gray-800 dark:hover:bg-gray-100">⬇ PNG</button>
        </div>

        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
      </div>

      {editTitleBlock && (
        <div className="px-3 py-2 bg-gray-50 dark:bg-[#222] border-b border-gray-200 dark:border-[#2a2a2a] flex-shrink-0">
          <div className="grid grid-cols-4 gap-2">
            {(Object.keys(titleBlock) as (keyof TitleBlock)[]).map(key => (
              <div key={key}>
                <label className="block text-[9px] font-medium text-gray-500 uppercase mb-0.5">{key.replace(/([A-Z])/g, ' $1')}</label>
                <input type="text" value={titleBlock[key]} onChange={e => setTitleBlock(prev => ({ ...prev, [key]: e.target.value }))}
                  className="w-full px-2 py-1 text-xs bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded" />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        <div ref={containerRef} className="flex-1 overflow-hidden bg-gray-200 dark:bg-[#111]"
          style={{ cursor: tool === 'pan' || isPanning ? (isPanning ? 'grabbing' : 'grab') : tool === 'eraser' ? 'crosshair' : 'crosshair' }}>
          <canvas ref={canvasRef} width={PAGE_W} height={PAGE_H}
            style={{ width: PAGE_W * zoom, height: PAGE_H * zoom, transform: `translate(${pan.x}px, ${pan.y}px)`, maxWidth: 'none' }}
            onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} />
        </div>

        {showLayers && (
          <div className="w-52 border-l border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] overflow-y-auto flex-shrink-0">
            <div className="p-3">
              <h4 className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 uppercase mb-2">Image Layers</h4>
              {layers.length === 0 ? (
                <p className="text-[10px] text-gray-400">No images. Click 📷 to add.</p>
              ) : (
                <div className="space-y-2">
                  {layers.map(l => (
                    <div key={l.id} className="p-2 bg-gray-50 dark:bg-[#222] rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <label className="flex items-center gap-1.5 text-[10px] text-gray-700 dark:text-gray-300 truncate">
                          <input type="checkbox" checked={l.visible} onChange={() => setLayers(prev => prev.map(ll => ll.id === l.id ? { ...ll, visible: !ll.visible } : ll))} className="rounded" />
                          {l.name}
                        </label>
                        <button onClick={() => setLayers(prev => prev.filter(ll => ll.id !== l.id))} className="text-gray-400 hover:text-red-500 text-[10px]">✕</button>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="range" min={0} max={1} step={0.05} value={l.opacity}
                          onChange={e => setLayers(prev => prev.map(ll => ll.id === l.id ? { ...ll, opacity: Number(e.target.value) } : ll))}
                          className="flex-1 h-1 accent-blue-500" />
                        <span className="text-[9px] text-gray-400 tabular-nums w-6">{Math.round(l.opacity * 100)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
