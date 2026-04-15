'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Trash2, Save, Eye, ChevronUp, ChevronDown, Download, RotateCcw } from 'lucide-react'

interface InspectionItem {
  id: string; question: string; type: 'pass_fail' | 'yes_no' | 'text'
  answer: string; notes: string; photo?: string
}

interface InspectionSection { id: string; title: string; items: InspectionItem[] }

interface InspectionFormBuilderProps {
  isOpen: boolean; onClose: () => void; onSave?: (data: any) => void
  document?: any; projects?: any[]; templates?: any[]
}

const DEFAULT_TEMPLATES = [
  { id: 'roof', name: 'Roof Inspection', sections: [
    { title: 'General Condition', items: ['Overall roof condition', 'Evidence of ponding water', 'Debris accumulation', 'Drainage system function', 'Roof slope/pitch adequate'] },
    { title: 'Roofing Material', items: ['Shingles/membrane condition', 'Flashing condition', 'Sealant/caulking condition', 'Fastener condition', 'Edge metal condition'] },
    { title: 'Penetrations', items: ['Vent pipes sealed', 'HVAC curbs condition', 'Skylight seals', 'Pipe boot condition'] },
    { title: 'Structural', items: ['Decking condition', 'Sagging or deflection', 'Fascia board condition', 'Soffit condition', 'Gutters and downspouts'] },
  ]},
  { id: 'site', name: 'Site Inspection', sections: [
    { title: 'Safety', items: ['PPE compliance', 'Fall protection in place', 'Signage posted', 'Fire extinguishers available'] },
    { title: 'Site Conditions', items: ['Work area clean/organized', 'Material storage proper', 'Waste disposal adequate', 'Access paths clear'] },
    { title: 'Quality', items: ['Work matches specifications', 'Materials match submittals', 'Workmanship acceptable', 'Code compliance checked'] },
  ]},
  { id: 'final', name: 'Final Walkthrough', sections: [
    { title: 'Exterior', items: ['Siding/finish complete', 'Paint complete', 'Windows/doors operational', 'Landscaping complete'] },
    { title: 'Interior', items: ['Walls/ceilings finish', 'Flooring complete', 'Trim/molding installed', 'Fixtures operational'] },
    { title: 'Systems', items: ['HVAC operational', 'Electrical tested', 'Plumbing no leaks', 'Smoke/CO detectors'] },
  ]},
]

const mkItem = (q: string): InspectionItem => ({ id: String(Date.now() + Math.random()), question: q, type: 'pass_fail', answer: '', notes: '' })

export default function InspectionFormBuilder({ isOpen, onClose, onSave, document, projects = [], templates = [] }: InspectionFormBuilderProps) {
  const DRAFT_KEY = document?.id
    ? `projex_draft_inspection_${document.id}`
    : 'projex_draft_inspection_new'

  const readDraft = () => {
    if (document || typeof window === 'undefined') return null
    try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null') } catch { return null }
  }
  const draft = readDraft()

  const [hasDraft, setHasDraft] = useState(!!draft)
  const [title, setTitle] = useState(draft?.title ?? document?.title ?? 'Inspection Report')
  const [projectId, setProjectId] = useState(draft?.projectId ?? document?.projectId ?? '')
  const [inspector, setInspector] = useState(draft?.inspector ?? document?.inspector ?? '')
  const [date, setDate] = useState(draft?.date ?? document?.date ?? new Date().toISOString().split('T')[0])
  const [location, setLocation] = useState(draft?.location ?? document?.location ?? '')
  const [showPreview, setShowPreview] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [expandedPhoto, setExpandedPhoto] = useState<string | null>(null)

  const clearInspectionDraft = () => {
    try { localStorage.removeItem(DRAFT_KEY) } catch {}
    setHasDraft(false)
  }

  // Auto-save draft fields (new inspections only)
  useEffect(() => {
    if (document) return
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ title, projectId, inspector, date, location }))
      setHasDraft(true)
    } catch {}
  }, [title, projectId, inspector, date, location])

  const [sections, setSections] = useState<InspectionSection[]>(
    document?.sections || [{ id: '1', title: 'General', items: [mkItem('Item to inspect')] }]
  )

  const allTemplates = [...DEFAULT_TEMPLATES, ...templates]

  const applyTemplate = (t: any) => {
    setSections(t.sections.map((s: any, i: number) => ({
      id: String(Date.now() + i), title: s.title, items: s.items.map((q: string) => mkItem(q)),
    })))
    setTitle(t.name)
  }

  const addSection = () => setSections(prev => [...prev, { id: String(Date.now()), title: 'New Section', items: [mkItem('')] }])
  const removeSection = (id: string) => setSections(prev => prev.filter(s => s.id !== id))
  const updateSectionTitle = (id: string, t: string) => setSections(prev => prev.map(s => s.id === id ? { ...s, title: t } : s))
  const addItem = (sid: string) => setSections(prev => prev.map(s => s.id === sid ? { ...s, items: [...s.items, mkItem('')] } : s))
  const removeItem = (sid: string, iid: string) => setSections(prev => prev.map(s => s.id === sid ? { ...s, items: s.items.filter(i => i.id !== iid) } : s))
  const updateItem = (sid: string, iid: string, field: string, value: string) => {
    setSections(prev => prev.map(s => s.id === sid ? { ...s, items: s.items.map(i => i.id === iid ? { ...i, [field]: value } : i) } : s))
  }
  const moveSection = (idx: number, dir: 'up' | 'down') => {
    const t = dir === 'up' ? idx - 1 : idx + 1
    if (t < 0 || t >= sections.length) return
    const c = [...sections]; [c[idx], c[t]] = [c[t], c[idx]]; setSections(c)
  }

  const handleItemPhoto = (sid: string, iid: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => updateItem(sid, iid, 'photo', ev.target?.result as string)
    reader.readAsDataURL(file); e.target.value = ''
  }

  const handleSave = async () => {
    setSaving(true); setSaveError('')
    try {
      await onSave?.({
        id: document?.id, type: 'inspection',
        documentNumber: title, projectId: projectId || undefined,
        companyName: inspector || 'Inspector', notes: location,
        dateIssued: date, clientName: '',
        terms: JSON.stringify({ inspector, location, title }),
        lineItems: sections.map(s => ({
          description: `__section__:${s.title}`,
          items: s.items.map(i => ({ question: i.question, type: i.type, answer: i.answer, notes: i.notes, photo: i.photo || '' })),
        })),
        subtotal: 0, taxTotal: 0, total: 0, status: document?.status || 'draft',
      })
      clearInspectionDraft()
    } catch (err: any) { setSaveError(err?.message || 'Save failed.') }
    finally { setSaving(false) }
  }

  const exportInspectionPDF = async () => {
    const { default: jsPDF } = await import('jspdf')
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pageW = 210
    const margin = 15
    let y = 0

    // Header
    doc.setFillColor(17, 17, 17)
    doc.rect(0, 0, pageW, 32, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(title, margin, 12)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text(`Inspector: ${inspector || '—'}  |  Date: ${date}  |  Location: ${location || '—'}`, margin, 20)
    doc.text(`Project: ${projects.find((p: any) => p.id === projectId)?.name || '—'}`, margin, 27)

    y = 40

    // Summary bar
    doc.setFillColor(240, 240, 240)
    doc.roundedRect(margin, y, pageW - margin * 2, 10, 2, 2, 'F')
    doc.setTextColor(40, 40, 40)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(22, 163, 74)
    doc.text(`✓ ${passed} Pass`, margin + 4, y + 6.5)
    doc.setTextColor(220, 38, 38)
    doc.text(`✗ ${failed} Fail`, margin + 30, y + 6.5)
    doc.setTextColor(107, 114, 128)
    doc.text(`— ${na} N/A`, margin + 56, y + 6.5)
    doc.text(`⏳ ${pending} Pending`, margin + 80, y + 6.5)

    y += 16

    for (const section of sections) {
      if (y > 270) { doc.addPage(); y = 20 }
      doc.setFillColor(50, 50, 50)
      doc.rect(margin, y, pageW - margin * 2, 7, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.text(section.title.toUpperCase(), margin + 3, y + 5)
      y += 10

      for (const item of section.items) {
        if (y > 275) { doc.addPage(); y = 20 }
        const ans = item.answer

        // Answer badge color
        let [br, bg, bb] = [107, 114, 128]
        if (ans === 'pass' || ans === 'yes') [br, bg, bb] = [22, 163, 74]
        else if (ans === 'fail' || ans === 'no') [br, bg, bb] = [220, 38, 38]

        doc.setFillColor(br, bg, bb)
        doc.roundedRect(margin, y, 18, 5, 1, 1, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(6)
        doc.setFont('helvetica', 'bold')
        const label = ans ? ans.toUpperCase() : 'PEND'
        doc.text(label, margin + 9, y + 3.5, { align: 'center' })

        doc.setTextColor(40, 40, 40)
        doc.setFontSize(7.5)
        doc.setFont('helvetica', 'normal')
        doc.text(item.question || '—', margin + 22, y + 3.5)
        y += 7

        if (item.notes) {
          doc.setTextColor(100, 100, 100)
          doc.setFontSize(6.5)
          doc.text(`Notes: ${item.notes}`, margin + 24, y)
          y += 5
        }
      }
      y += 4
    }

    // Footer
    const totalPages = (doc as any).internal.getNumberOfPages()
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p)
      doc.setTextColor(150)
      doc.setFontSize(6)
      doc.text('projex.live', pageW / 2, 292, { align: 'center' })
    }

    doc.save(`${title.replace(/\s+/g, '-')}-${date}.pdf`)
  }

  const allItems = sections.flatMap(s => s.items)
  const totalItems = allItems.length
  const passed = allItems.filter(i => i.answer === 'pass' || i.answer === 'yes').length
  const failed = allItems.filter(i => i.answer === 'fail' || i.answer === 'no').length
  const na = allItems.filter(i => i.answer === 'na').length
  const pending = totalItems - passed - failed - na

  const answerStyle = (v: string, current: string) =>
    current === v
      ? (v === 'pass' || v === 'yes' ? 'bg-green-100 text-green-700 border-green-300' : v === 'fail' || v === 'no' ? 'bg-red-100 text-red-700 border-red-300' : 'bg-gray-100 text-gray-500 border-gray-300')
      : 'bg-white dark:bg-[#222] text-gray-400 border-gray-200 dark:border-[#333]'

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-2" style={{ animation: 'popup-in 0.15s ease-out' }}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-[#1a1a1a] rounded-none md:rounded-2xl w-full max-w-[100vw] md:max-w-[96vw] h-[100vh] md:h-[93vh] flex flex-col shadow-2xl border border-gray-200 dark:border-[#2a2a2a] overflow-hidden" onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 dark:border-[#2a2a2a] flex-shrink-0 bg-gray-50 dark:bg-[#222]">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Inspection Form</h2>
            <div className="hidden sm:flex items-center gap-2 text-[10px]">
              <span className="text-green-600 font-medium">{passed} Pass</span>
              <span className="text-red-500 font-medium">{failed} Fail</span>
              <span className="text-gray-400">{na} N/A</span>
              <span className="text-gray-400">{pending} Pending</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {saveError && <span className="text-[10px] text-red-500 mr-2">{saveError}</span>}
            {!document && hasDraft && (
              <button onClick={clearInspectionDraft} className="flex items-center gap-0.5 px-1.5 py-1 text-[10px] text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg">
                <RotateCcw className="w-2.5 h-2.5" /> Clear Draft
              </button>
            )}
            <button onClick={() => setShowPreview(!showPreview)} className="px-2 py-1 text-[10px] font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-[#333] rounded-lg flex items-center gap-1"><Eye className="w-3 h-3" /> Preview</button>
            <button onClick={exportInspectionPDF} className="px-2 py-1 text-[10px] font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-[#333] rounded-lg flex items-center gap-1"><Download className="w-3 h-3" /> PDF</button>
            <button onClick={handleSave} disabled={saving} className="px-3 py-1 text-[10px] font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"><Save className="w-3 h-3" /> {saving ? 'Saving...' : 'Save'}</button>
            <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-[#333]"><X className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className={`${showPreview ? 'w-1/2' : 'w-full'} overflow-y-auto border-r border-gray-100 dark:border-[#2a2a2a]`}>
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] text-gray-500 font-medium uppercase">Templates:</span>
                {allTemplates.map(t => (
                  <button key={t.id} onClick={() => applyTemplate(t)} className="px-2 py-1 text-[10px] bg-gray-100 dark:bg-[#2a2a2a] text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-[#333]">{t.name}</button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-[10px] font-medium text-gray-500 mb-0.5 uppercase">Title</label><input value={title} onChange={e => setTitle(e.target.value)} className="w-full px-2 py-1.5 bg-white dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
                <div><label className="block text-[10px] font-medium text-gray-500 mb-0.5 uppercase">Project</label><select value={projectId} onChange={e => setProjectId(e.target.value)} className="w-full px-2 py-1.5 bg-white dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-lg text-sm"><option value="">Optional</option>{projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="block text-[10px] font-medium text-gray-500 mb-0.5 uppercase">Inspector</label><input value={inspector} onChange={e => setInspector(e.target.value)} className="w-full px-2 py-1.5 bg-white dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
                <div><label className="block text-[10px] font-medium text-gray-500 mb-0.5 uppercase">Date</label><input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-2 py-1.5 bg-white dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-lg text-sm" /></div>
                <div><label className="block text-[10px] font-medium text-gray-500 mb-0.5 uppercase">Location</label><input value={location} onChange={e => setLocation(e.target.value)} className="w-full px-2 py-1.5 bg-white dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
              </div>

              {sections.map((section, si) => (
                <div key={section.id} className="border border-gray-200 dark:border-[#333] rounded-xl overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-[#222]">
                    <div className="flex flex-col">
                      <button onClick={() => moveSection(si, 'up')} disabled={si === 0} className="text-gray-400 hover:text-gray-600 disabled:opacity-20"><ChevronUp className="w-3 h-3" /></button>
                      <button onClick={() => moveSection(si, 'down')} disabled={si === sections.length - 1} className="text-gray-400 hover:text-gray-600 disabled:opacity-20"><ChevronDown className="w-3 h-3" /></button>
                    </div>
                    <input value={section.title} onChange={e => updateSectionTitle(section.id, e.target.value)} className="flex-1 px-2 py-0.5 text-sm font-semibold bg-transparent text-gray-900 dark:text-gray-100 focus:outline-none" />
                    <button onClick={() => addItem(section.id)} className="px-1.5 py-0.5 text-[10px] text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"><Plus className="w-3 h-3 inline" /> Item</button>
                    <button onClick={() => removeSection(section.id)} className="text-gray-300 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                  <div className="p-2 space-y-2">
                    {section.items.map(item => (
                      <div key={item.id} className="border border-gray-100 dark:border-[#2a2a2a] rounded-lg p-2 group hover:border-gray-300 dark:hover:border-[#444]">
                        <div className="flex items-center gap-2">
                          <input value={item.question} onChange={e => updateItem(section.id, item.id, 'question', e.target.value)} placeholder="Inspection item..."
                            className="flex-1 px-2 py-1 text-xs bg-white dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
                          <select value={item.type} onChange={e => updateItem(section.id, item.id, 'type', e.target.value)}
                            className="px-1 py-1 text-[10px] bg-white dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded w-20">
                            <option value="pass_fail">Pass/Fail</option><option value="yes_no">Yes/No</option><option value="text">Text</option>
                          </select>
                          <div className="flex gap-0.5">
                            {item.type === 'text' ? (
                              <input value={item.answer} onChange={e => updateItem(section.id, item.id, 'answer', e.target.value)} placeholder="Answer"
                                className="px-1.5 py-0.5 text-[10px] border border-gray-200 dark:border-[#333] rounded w-20 bg-white dark:bg-[#222]" />
                            ) : (
                              (item.type === 'pass_fail' ? ['pass', 'fail', 'na'] : ['yes', 'no', 'na']).map(v => (
                                <button key={v} onClick={() => updateItem(section.id, item.id, 'answer', item.answer === v ? '' : v)}
                                  className={`px-1.5 py-0.5 text-[10px] font-medium rounded border ${answerStyle(v, item.answer)}`}>
                                  {v === 'pass' ? '✓' : v === 'fail' ? '✗' : v === 'yes' ? 'YES' : v === 'no' ? 'NO' : 'N/A'}
                                </button>
                              ))
                            )}
                          </div>
                          <button onClick={() => removeItem(section.id, item.id)} className="p-0.5 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 className="w-3 h-3" /></button>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <input value={item.notes} onChange={e => updateItem(section.id, item.id, 'notes', e.target.value)} placeholder="Add notes..."
                            className="flex-1 px-2 py-1 text-[10px] bg-gray-50 dark:bg-[#1a1a1a] border border-gray-100 dark:border-[#2a2a2a] rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-600 dark:text-gray-400" />
                          {item.photo ? (
                            <div className="flex items-center gap-1">
                              <button onClick={() => setExpandedPhoto(item.photo!)} className="flex-shrink-0">
                                <img src={item.photo} alt="" className="w-10 h-10 rounded object-cover border border-gray-200" />
                              </button>
                              <button onClick={() => updateItem(section.id, item.id, 'photo', '')} className="text-[10px] text-red-400 hover:text-red-500">✕</button>
                            </div>
                          ) : (
                            <label className="px-2 py-1 text-[10px] text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded cursor-pointer">
                              📷 Photo
                              <input type="file" accept="image/*" className="hidden" onChange={e => handleItemPhoto(section.id, item.id, e)} />
                            </label>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <button onClick={addSection} className="w-full py-2 border-2 border-dashed border-gray-300 dark:border-[#444] rounded-xl text-xs text-gray-400 hover:border-blue-400 hover:text-blue-500">+ Add Section</button>
            </div>
          </div>

          {showPreview && (
            <div className="w-1/2 bg-gray-100 dark:bg-[#111] overflow-y-auto flex items-start justify-center p-4">
              <div className="bg-white shadow-lg w-full max-w-[612px] rounded-sm" style={{ fontFamily: 'system-ui' }}>
                <div className="p-8 text-gray-900">
                  <div className="text-center mb-6 pb-4 border-b-2 border-gray-900">
                    <h1 className="text-xl font-bold">{title}</h1>
                    <div className="flex justify-center gap-6 mt-2 text-[11px] text-gray-600">
                      <span>Inspector: {inspector || '—'}</span><span>Date: {date}</span>{location && <span>Location: {location}</span>}
                    </div>
                  </div>
                  <div className="flex gap-4 mb-6 p-3 bg-gray-50 rounded">
                    <div className="text-center flex-1"><div className="text-lg font-bold text-green-600">{passed}</div><div className="text-[9px] text-gray-400 uppercase">Pass</div></div>
                    <div className="text-center flex-1"><div className="text-lg font-bold text-red-500">{failed}</div><div className="text-[9px] text-gray-400 uppercase">Fail</div></div>
                    <div className="text-center flex-1"><div className="text-lg font-bold text-gray-400">{na}</div><div className="text-[9px] text-gray-400 uppercase">N/A</div></div>
                    <div className="text-center flex-1"><div className="text-lg font-bold text-gray-300">{pending}</div><div className="text-[9px] text-gray-400 uppercase">Pending</div></div>
                    <div className="text-center flex-1"><div className="text-lg font-bold">{totalItems > 0 ? Math.round((passed / totalItems) * 100) : 0}%</div><div className="text-[9px] text-gray-400 uppercase">Score</div></div>
                  </div>
                  {sections.map(section => (
                    <div key={section.id} className="mb-5">
                      <h3 className="text-sm font-bold border-b border-gray-200 pb-1 mb-2">{section.title}</h3>
                      <table className="w-full text-[11px]">
                        <thead><tr className="text-[9px] text-gray-400 uppercase"><th className="text-left py-1 w-8">#</th><th className="text-left py-1">Item</th><th className="text-center py-1 w-16">Status</th><th className="text-left py-1 w-28">Notes</th></tr></thead>
                        <tbody>
                          {section.items.map((item, i) => (
                            <tr key={item.id} className="border-b border-gray-100 align-top">
                              <td className="py-1.5 text-gray-400">{i + 1}</td>
                              <td className="py-1.5">
                                {item.question || '—'}
                                {item.photo && <img src={item.photo} alt="" className="mt-1 w-20 h-14 rounded object-cover" />}
                              </td>
                              <td className="text-center py-1.5">
                                {item.answer === 'pass' || item.answer === 'yes' ? <span className="text-green-600 font-bold">✓</span> :
                                 item.answer === 'fail' || item.answer === 'no' ? <span className="text-red-500 font-bold">✗</span> :
                                 item.answer === 'na' ? <span className="text-gray-400">N/A</span> :
                                 item.answer ? <span>{item.answer}</span> : <span className="text-gray-300">—</span>}
                              </td>
                              <td className="py-1.5 text-gray-500 text-[10px]">{item.notes}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                  <div className="mt-8 pt-4 border-t border-gray-200 grid grid-cols-2 gap-8">
                    <div><div className="border-b border-gray-900 h-10 mb-1" /><div className="text-[10px] text-gray-400">Inspector Signature</div></div>
                    <div><div className="border-b border-gray-900 h-10 mb-1" /><div className="text-[10px] text-gray-400">Client/Owner Signature</div></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {expandedPhoto && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/80" onClick={() => setExpandedPhoto(null)}>
          <img src={expandedPhoto} alt="" className="max-w-[80vw] max-h-[80vh] rounded-lg shadow-2xl" />
        </div>
      )}
    </div>
  )
}
