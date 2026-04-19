'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Trash2, Save, Download, Eye, ChevronUp, ChevronDown, FileText, Paperclip } from 'lucide-react'
import { generateDocumentPDF } from '@/lib/pdf-generator'

interface ProposalSection {
  id: string
  type: 'text' | 'heading' | 'image' | 'pagebreak' | 'terms' | 'scope'
  title: string; content: string; imageUrl?: string
}

interface AttachedPDF {
  id: string; name: string; dataUrl: string
}

interface ProposalBuilderProps {
  isOpen: boolean; onClose: () => void; onSave?: (data: any) => void
  document?: any; type?: 'proposal' | 'contract'; projects?: any[]
}

// Defined outside to prevent remounting
function PBInput({ label, value, onChange, className = '' }: { label: string; value: string; onChange: (v: string) => void; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-0.5 uppercase tracking-wide">{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full px-2.5 py-1.5 bg-white dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500" />
    </div>
  )
}

export default function ProposalBuilder({ isOpen, onClose, onSave, document, type = 'proposal', projects = [] }: ProposalBuilderProps) {
  const [title, setTitle] = useState(document?.title || (type === 'contract' ? 'Service Agreement' : 'Project Proposal'))
  const [projectName, setProjectName] = useState(document?.projectName || '')
  const [projectId, setProjectId] = useState(document?.projectId || '')
  const [clientName, setClientName] = useState(document?.clientName || '')
  const [clientAddress, setClientAddress] = useState(document?.clientAddress || '')
  const [companyName, setCompanyName] = useState(document?.companyName || 'Your Company')
  const [companyAddress, setCompanyAddress] = useState(document?.companyAddress || '')
  const [date, setDate] = useState(document?.date || new Date().toISOString().split('T')[0])
  const [showPreview, setShowPreview] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  // Draft persistence for new documents
  const DRAFT_KEY = !document?.id ? `projex_draft_${type}_new` : null

  useEffect(() => {
    if (!DRAFT_KEY) return
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ title, projectId, clientName, clientAddress, companyName, companyAddress, date, sections }))
    } catch {}
  }, [DRAFT_KEY, title, projectId, clientName, clientAddress, companyName, companyAddress, date, sections])

  const clearDraft = () => { if (DRAFT_KEY) try { localStorage.removeItem(DRAFT_KEY) } catch {} }

  const buildDocData = () => ({
    id: document?.id, type,
    documentNumber: title,
    projectId: projectId || undefined,
    clientName: clientName || 'Draft Client',
    clientAddress, companyName, companyAddress,
    dateIssued: date,
    terms: JSON.stringify({ title, projectName, companyAddress, clientAddress, date, sections }),
    lineItems: sections.map(s => ({ description: `__section__:${s.type}:${s.title}`, content: s.content, imageUrl: s.imageUrl })),
    attachedPdfs: attachedPDFs.map(p => ({ name: p.name })),
    subtotal: 0, taxTotal: 0, total: 0,
    status: document?.status || 'draft',
  })

  const handleExportPDF = () => {
    try { generateDocumentPDF(buildDocData()) } catch (err) { console.error('PDF error', err) }
  }

  const [sections, setSections] = useState<ProposalSection[]>(document?.sections || [
    { id: '1', type: 'heading', title: 'Scope of Work', content: '' },
    { id: '2', type: 'scope', title: '', content: 'Describe the full scope of work here...' },
    { id: '3', type: 'heading', title: 'Timeline', content: '' },
    { id: '4', type: 'text', title: '', content: 'Estimated start date: TBD\nEstimated completion: TBD' },
    { id: '5', type: 'heading', title: 'Terms & Conditions', content: '' },
    { id: '6', type: 'terms', title: '', content: '1. Payment terms: 50% deposit, 50% upon completion.\n2. All work is guaranteed for 1 year.\n3. Changes to scope require written change order.' },
  ])

  const [attachedPDFs, setAttachedPDFs] = useState<AttachedPDF[]>(document?.attachedPdfs || [])

  const addSection = (sType: ProposalSection['type']) => {
    setSections(prev => [...prev, { id: `s-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, type: sType, title: sType === 'heading' ? 'New Section' : '', content: sType === 'pagebreak' ? '' : '' }])
  }
  const removeSection = (id: string) => setSections(prev => prev.filter(s => s.id !== id))
  const updateSection = (id: string, field: string, value: string) => setSections(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s))
  const moveSection = (idx: number, dir: 'up' | 'down') => {
    const t = dir === 'up' ? idx - 1 : idx + 1
    if (t < 0 || t >= sections.length) return
    const c = [...sections]; [c[idx], c[t]] = [c[t], c[idx]]; setSections(c)
  }

  const handlePDFUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files; if (!files) return
    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        setAttachedPDFs(prev => [...prev, { id: String(Date.now() + Math.random()), name: file.name, dataUrl: ev.target?.result as string }])
      }
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }

  const handleImageUpload = (sectionId: string) => {
    const input = globalThis.document.createElement('input')
    input.type = 'file'; input.accept = 'image/*'
    input.onchange = (e: any) => {
      const file = e.target.files?.[0]; if (!file) return
      const reader = new FileReader()
      reader.onload = (ev) => updateSection(sectionId, 'imageUrl', ev.target?.result as string)
      reader.readAsDataURL(file)
    }
    input.click()
  }

  const handleSave = async () => {
    setSaving(true); setSaveError('')
    try {
      await onSave?.(buildDocData())
      clearDraft()
    } catch (err: any) {
      setSaveError(err?.message || 'Save failed.')
    } finally { setSaving(false) }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-2" style={{ animation: 'popup-in 0.15s ease-out' }}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-[#1a1a1a] rounded-none md:rounded-2xl w-full max-w-[100vw] md:max-w-[96vw] h-[100vh] md:h-[93vh] flex flex-col shadow-2xl border border-gray-200 dark:border-[#2a2a2a] overflow-hidden" onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-[#2a2a2a] flex-shrink-0 bg-gray-50 dark:bg-[#222]">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{document ? 'Edit' : 'New'} {type === 'contract' ? 'Contract' : 'Proposal'}</h2>
            {attachedPDFs.length > 0 && <span className="text-[10px] text-gray-400">{attachedPDFs.length} PDF attached</span>}
          </div>
          <div className="flex items-center gap-1.5">
            {saveError && <span className="text-[10px] text-red-500 mr-2">{saveError}</span>}
            <button onClick={() => setShowPreview(!showPreview)} className="px-2 py-1 text-[10px] font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-[#333] rounded-lg flex items-center gap-1"><Eye className="w-3 h-3" /> Preview</button>
            <button onClick={handleSave} disabled={saving} className="px-3 py-1 text-[10px] font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"><Save className="w-3 h-3" /> {saving ? 'Saving...' : 'Save'}</button>
            <button onClick={handleExportPDF} className="px-3 py-1 text-[10px] font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 flex items-center gap-1"><Download className="w-3 h-3" /> PDF</button>
            <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-[#333]"><X className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
          <div className={`${showPreview ? 'h-[50%] sm:h-full sm:w-1/2' : 'h-full w-full'} overflow-y-auto border-b sm:border-b-0 sm:border-r border-gray-100 dark:border-[#2a2a2a]`}>
            <div className="p-5 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <PBInput label="Title" value={title} onChange={setTitle} />
                <div>
                  <label className="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-0.5 uppercase tracking-wide">Project</label>
                  <select value={projectId} onChange={e => { setProjectId(e.target.value); const p = projects.find((pp: any) => pp.id === e.target.value); if (p) setProjectName(p.name) }}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-lg text-sm text-gray-900 dark:text-gray-100">
                    <option value="">No project (optional)</option>
                    {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><PBInput label="Company" value={companyName} onChange={setCompanyName} /><PBInput label="Address" value={companyAddress} onChange={setCompanyAddress} /></div>
                <div className="space-y-2"><PBInput label="Client" value={clientName} onChange={setClientName} /><PBInput label="Address" value={clientAddress} onChange={setClientAddress} /></div>
              </div>
              <PBInput label="Date" value={date} onChange={setDate} />

              {/* Attached PDFs */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase flex items-center gap-1"><Paperclip className="w-3 h-3" /> Attached PDFs</h4>
                  <label className="px-2 py-1 text-[10px] text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded cursor-pointer flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Add PDF
                    <input type="file" accept=".pdf" multiple className="hidden" onChange={handlePDFUpload} />
                  </label>
                </div>
                {attachedPDFs.length > 0 && (
                  <div className="space-y-1">
                    {attachedPDFs.map((pdf, i) => (
                      <div key={pdf.id} className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-[#222] rounded-lg">
                        <FileText className="w-4 h-4 text-red-500 flex-shrink-0" />
                        <span className="text-xs text-gray-700 dark:text-gray-300 flex-1 truncate">{pdf.name}</span>
                        <span className="text-[10px] text-gray-400">Attachment {i + 1}</span>
                        <button onClick={() => setAttachedPDFs(prev => prev.filter(p => p.id !== pdf.id))} className="text-gray-400 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                      </div>
                    ))}
                  </div>
                )}
                {attachedPDFs.length === 0 && <p className="text-[10px] text-gray-400">No PDFs attached. Add contracts, permits, or supporting documents.</p>}
              </div>

              {/* Sections */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Document Sections</h4>
                  <div className="flex gap-1 flex-wrap">
                    {(['heading', 'text', 'scope', 'terms', 'image', 'pagebreak'] as const).map(t => (
                      <button key={t} onClick={() => addSection(t)} className="px-2 py-1 text-[10px] text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] rounded">+ {t.charAt(0).toUpperCase() + t.slice(1)}</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  {sections.map((section, index) => (
                    <div key={section.id} className="border border-gray-200 dark:border-[#333] rounded-xl overflow-hidden group">
                      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-[#222]">
                        <div className="flex flex-col">
                          <button onClick={() => moveSection(index, 'up')} disabled={index === 0} className="text-gray-400 hover:text-gray-600 disabled:opacity-20"><ChevronUp className="w-3 h-3" /></button>
                          <button onClick={() => moveSection(index, 'down')} disabled={index === sections.length - 1} className="text-gray-400 hover:text-gray-600 disabled:opacity-20"><ChevronDown className="w-3 h-3" /></button>
                        </div>
                        <span className="text-[10px] font-medium text-gray-400 uppercase w-16">{section.type}</span>
                        {section.type === 'heading' ? (
                          <input value={section.title} onChange={e => updateSection(section.id, 'title', e.target.value)}
                            className="flex-1 px-2 py-0.5 text-sm font-semibold bg-transparent text-gray-900 dark:text-gray-100 focus:outline-none" placeholder="Section title" />
                        ) : section.type === 'pagebreak' ? (
                          <span className="flex-1 text-xs text-gray-400 italic">— Page Break —</span>
                        ) : <span className="flex-1" />}
                        <button onClick={() => removeSection(section.id)} className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                      {section.type !== 'pagebreak' && section.type !== 'heading' && (
                        <div className="p-3">
                          {section.type === 'image' ? (
                            section.imageUrl ? (
                              <div className="relative">
                                <img src={section.imageUrl} alt="" className="w-full rounded-lg max-h-48 object-cover" />
                                <button onClick={() => handleImageUpload(section.id)} className="absolute bottom-2 right-2 px-2 py-1 bg-black/50 text-white text-xs rounded">Replace</button>
                              </div>
                            ) : (
                              <button onClick={() => handleImageUpload(section.id)} className="w-full py-8 border-2 border-dashed border-gray-300 dark:border-[#444] rounded-lg text-sm text-gray-400 hover:border-blue-400 hover:text-blue-400">Click to upload image</button>
                            )
                          ) : (
                            <textarea value={section.content} onChange={e => updateSection(section.id, 'content', e.target.value)} rows={section.type === 'terms' ? 6 : 4}
                              className="w-full px-2.5 py-1.5 bg-white dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-lg text-sm text-gray-900 dark:text-gray-100 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500" />
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {showPreview && (
            <div className="h-[50%] sm:h-full sm:w-1/2 bg-gray-100 dark:bg-[#111] overflow-y-auto flex items-start justify-center p-6">
              <div className="bg-white shadow-lg w-full max-w-[612px] rounded-sm" style={{ fontFamily: 'system-ui' }}>
                <div className="p-12 min-h-[400px] flex flex-col justify-between border-b-4 border-gray-900">
                  <div>
                    <div className="text-sm text-gray-400 uppercase tracking-widest mb-2">{type === 'contract' ? 'Service Agreement' : 'Proposal'}</div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">{title || 'Untitled'}</h1>
                    {projectName && <p className="text-lg text-gray-600">{projectName}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-8 text-[11px] text-gray-600">
                    <div><div className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Prepared By</div><div className="font-medium text-gray-900">{companyName}</div>{companyAddress && <div>{companyAddress}</div>}</div>
                    <div><div className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Prepared For</div><div className="font-medium text-gray-900">{clientName || '—'}</div>{clientAddress && <div>{clientAddress}</div>}</div>
                  </div>
                  <div className="text-xs text-gray-400 mt-6">{date}</div>
                </div>
                <div className="p-10 text-[11px] text-gray-700 leading-relaxed space-y-6">
                  {sections.map((s, idx) => {
                    if (s.type === 'pagebreak') return <div key={`prev-${s.id}-${idx}`} className="border-t-2 border-dashed border-gray-300 my-8" />
                    if (s.type === 'heading') return <h2 key={`prev-${s.id}-${idx}`} className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2">{s.title}</h2>
                    if (s.type === 'image' && s.imageUrl) return <img key={`prev-${s.id}-${idx}`} src={s.imageUrl} alt="" className="w-full rounded max-h-64 object-contain" />
                    return <div key={`prev-${s.id}-${idx}`} className="whitespace-pre-wrap">{s.content}</div>
                  })}

                  {attachedPDFs.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <div className="text-[10px] font-semibold text-gray-400 uppercase mb-2">Attachments</div>
                      {attachedPDFs.map((pdf, i) => (
                        <div key={pdf.id} className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                          <FileText className="w-3 h-3 text-red-500" />
                          <span>Attachment {i + 1}: {pdf.name}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-12 pt-8 border-t border-gray-200">
                    <div className="grid grid-cols-2 gap-12">
                      <div><div className="border-b border-gray-900 h-12 mb-2" /><div className="text-[10px] text-gray-400">Company Representative</div><div className="text-xs font-medium text-gray-600 mt-1">{companyName}</div><div className="text-[10px] text-gray-400 mt-2">Date: ____________</div></div>
                      <div><div className="border-b border-gray-900 h-12 mb-2" /><div className="text-[10px] text-gray-400">Client</div><div className="text-xs font-medium text-gray-600 mt-1">{clientName || '—'}</div><div className="text-[10px] text-gray-400 mt-2">Date: ____________</div></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
