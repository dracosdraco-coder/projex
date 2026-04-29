'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { X, Plus, Trash2, Save, Download, Eye, Copy } from 'lucide-react'

interface LineItem {
  id: string; description: string; quantity: number; unit: string
  cost: number; markup: number; price: number; photo?: string
  type?: 'item' | 'section'
}

interface DocumentEditorProps {
  document?: any
  type: 'estimate' | 'invoice' | 'work_order' | 'change_order' | 'purchase_order'
  lineItemTemplates: any[]; projects: any[]
  onSave: (data: any) => void; onClose: () => void; onExportPDF: (documentId: string) => void
}

const UNITS = ['ea', 'sq ft', 'lin ft', 'hr', 'day', 'lot', 'sq', 'bundle', 'gal', 'lb']
const TYPE_LABELS: Record<string, string> = {
  estimate: 'Estimate', invoice: 'Invoice', work_order: 'Work Order',
  change_order: 'Change Order', purchase_order: 'Purchase Order',
}

// IMPORTANT: defined OUTSIDE the component so React doesn't re-mount on every render
function FormInput({ label, value, onChange, type: t = 'text', className = '' }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; className?: string
}) {
  return (
    <div className={className}>
      <label className="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-0.5 uppercase tracking-wide">{label}</label>
      <input type={t} value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full px-2 py-1.5 bg-white dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500" />
    </div>
  )
}

// Grows to fit content on mount and on every change — user can always see what they typed
function AutoTextarea({ label, value, onChange, className = '', ...props }: {
  label?: string; value: string; onChange: (v: string) => void; className?: string
} & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange' | 'value'>) {
  const ref = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }, [value])
  return (
    <div>
      {label && <label className="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-0.5 uppercase tracking-wide">{label}</label>}
      <textarea ref={ref} value={value} onChange={e => onChange(e.target.value)}
        className={`w-full px-2 py-1.5 bg-white dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none overflow-hidden min-h-[52px] ${className}`}
        {...props} />
    </div>
  )
}

export default function DocumentEditor({ document, type, lineItemTemplates = [], projects = [], onSave, onClose, onExportPDF }: DocumentEditorProps) {
  // Draft persistence — only for new documents (no existing id)
  const DRAFT_KEY = !document?.id ? `projex_draft_doc_${type}` : null

  const readDraft = () => {
    if (!DRAFT_KEY || typeof window === 'undefined') return null
    try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null') } catch { return null }
  }
  const draft = readDraft()

  const clearDocDraft = () => {
    if (DRAFT_KEY) try { localStorage.removeItem(DRAFT_KEY) } catch {}
  }

  const [companyName, setCompanyName] = useState(draft?.companyName ?? document?.companyName ?? 'Your Company')
  const [companyAddress, setCompanyAddress] = useState(draft?.companyAddress ?? document?.companyAddress ?? '')
  const [companyPhone, setCompanyPhone] = useState(draft?.companyPhone ?? document?.companyPhone ?? '')
  const [companyEmail, setCompanyEmail] = useState(draft?.companyEmail ?? document?.companyEmail ?? '')
  const [clientName, setClientName] = useState(draft?.clientName ?? document?.clientName ?? '')
  const [clientAddress, setClientAddress] = useState(draft?.clientAddress ?? document?.clientAddress ?? '')
  const [clientEmail, setClientEmail] = useState(draft?.clientEmail ?? document?.clientEmail ?? '')
  const [clientPhone, setClientPhone] = useState(draft?.clientPhone ?? document?.clientPhone ?? '')
  const [projectId, setProjectId] = useState(draft?.projectId ?? document?.projectId ?? '')
  const [docNumber, setDocNumber] = useState(draft?.docNumber ?? document?.documentNumber ?? `${type.toUpperCase().slice(0, 3)}-${String(Date.now()).slice(-6)}`)
  const [dateIssued, setDateIssued] = useState(draft?.dateIssued ?? document?.dateIssued ?? new Date().toISOString().split('T')[0])
  const [dateDue, setDateDue] = useState(draft?.dateDue ?? document?.dateDue ?? '')
  const [terms, setTerms] = useState(draft?.terms ?? document?.terms ?? 'Payment due within 30 days of invoice date.')
  const [notes, setNotes] = useState(draft?.notes ?? document?.notes ?? '')
  const [taxRate, setTaxRate] = useState(draft?.taxRate ?? document?.taxRate ?? 0)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [showTemplates, setShowTemplates] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [activeTab, setActiveTab] = useState<'editor' | 'breakdown'>('editor')
  const [expandedPhoto, setExpandedPhoto] = useState<string | null>(null)

  const [lineItems, setLineItems] = useState<LineItem[]>(
    draft?.lineItems ||
    document?.lineItems?.map((li: any) => ({
      ...li, cost: li.cost ?? li.unitPrice ?? 0, markup: li.markup ?? 0, price: li.price ?? li.unitPrice ?? 0,
    })) || [{ id: '1', description: '', quantity: 1, unit: 'ea', cost: 0, markup: 20, price: 0 }]
  )

  // Auto-save all fields to draft (new docs only)
  useEffect(() => {
    if (!DRAFT_KEY) return
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({
        companyName, companyAddress, companyPhone, companyEmail,
        clientName, clientAddress, clientEmail, clientPhone,
        projectId, docNumber, dateIssued, dateDue, terms, notes, taxRate,
        lineItems,
      }))
    } catch {}
  }, [DRAFT_KEY, companyName, companyAddress, companyPhone, companyEmail,
      clientName, clientAddress, clientEmail, clientPhone,
      projectId, docNumber, dateIssued, dateDue, terms, notes, taxRate, lineItems])

  const updateLineItem = (id: string, field: string, value: any) => {
    setLineItems(prev => prev.map(li => {
      if (li.id !== id) return li
      const updated = { ...li, [field]: value }
      if (field === 'cost' || field === 'markup') updated.price = updated.cost * (1 + updated.markup / 100)
      if (field === 'price' && updated.cost > 0) updated.markup = ((updated.price - updated.cost) / updated.cost) * 100
      return updated
    }))
  }

  const addLineItem = () => setLineItems(prev => [...prev, { id: String(Date.now()), description: '', quantity: 1, unit: 'ea', cost: 0, markup: 20, price: 0 }])
  const addSection = () => setLineItems(prev => [...prev, { id: String(Date.now()), type: 'section' as const, description: 'Materials', quantity: 0, unit: 'ea', cost: 0, markup: 0, price: 0 }])
  const removeLineItem = (id: string) => { if (lineItems.length > 1) setLineItems(prev => prev.filter(li => li.id !== id)) }

  const applyTemplate = (t: any) => {
    if (!t?.items) return
    setLineItems(prev => [...prev, ...t.items.map((item: any, i: number) => ({
      id: String(Date.now() + i), description: item.description || item.name || '',
      quantity: item.quantity || 1, unit: item.unit || 'ea',
      cost: item.cost || 0, markup: item.markup || 20, price: item.price || item.cost * 1.2 || 0,
    }))])
    setShowTemplates(false)
  }

  const totalCost = useMemo(() => lineItems.filter(li => li.type !== 'section').reduce((s, li) => s + li.quantity * li.cost, 0), [lineItems])
  const subtotal = useMemo(() => lineItems.filter(li => li.type !== 'section').reduce((s, li) => s + li.quantity * li.price, 0), [lineItems])
  const totalProfit = subtotal - totalCost
  const overallMargin = subtotal > 0 ? (totalProfit / subtotal) * 100 : 0
  const overallMarkup = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0
  const taxAmount = subtotal * (taxRate / 100)
  const total = subtotal + taxAmount

  const groupedItems = useMemo(() => {
    const groups: Array<{ title: string; items: LineItem[]; subtotal: number }> = []
    let cur: { title: string; items: LineItem[]; subtotal: number } | null = null
    for (const li of lineItems) {
      if (li.type === 'section') {
        cur = { title: li.description, items: [], subtotal: 0 }
        groups.push(cur)
      } else {
        if (!cur) { cur = { title: '', items: [], subtotal: 0 }; groups.push(cur) }
        cur.items.push(li)
        cur.subtotal += li.quantity * li.price
      }
    }
    return groups
  }, [lineItems])
  const hasSections = lineItems.some(li => li.type === 'section')

  const buildSaveData = () => ({
    id: document?.id, type, documentNumber: docNumber, projectId: projectId || undefined,
    companyName, companyAddress, companyPhone, companyEmail,
    clientName: clientName || 'Draft Client', clientAddress, clientEmail, clientPhone,
    dateIssued, dateDue: dateDue || undefined,
    lineItems: lineItems.map(li => ({ ...li, unitPrice: li.price })),
    subtotal, taxRate, taxTotal: taxAmount, total, costTotal: totalCost,
    profit: totalProfit, marginPercent: overallMargin,
    terms, notes, status: document?.status || 'draft',
  })

  const handleSave = async () => {
    setSaving(true); setSaveError('')
    try {
      await onSave(buildSaveData())
      clearDocDraft()
    } catch (err: any) {
      setSaveError(err?.message || 'Save failed. Check required fields.')
    } finally { setSaving(false) }
  }

  const handleExport = async () => {
    setSaving(true); setSaveError('')
    try {
      await onSave(buildSaveData())
      clearDocDraft()
      onExportPDF?.(document?.id || 'new')
    } catch (err: any) {
      setSaveError(err?.message || 'Save failed before export.')
    } finally { setSaving(false) }
  }

  const handleLineItemPhoto = (liId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => updateLineItem(liId, 'photo', ev.target?.result as string)
    reader.readAsDataURL(file); e.target.value = ''
  }

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
  const pct = (n: number) => `${n.toFixed(1)}%`

  return (
    <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center sm:p-2" style={{ animation: 'popup-in 0.15s ease-out' }}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white dark:bg-[#1a1a1a] rounded-t-3xl sm:rounded-2xl w-full sm:max-w-[96vw] h-[96vh] sm:h-[93vh] flex flex-col shadow-2xl border border-gray-200 dark:border-[#2a2a2a] overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 dark:border-[#2a2a2a] flex-shrink-0 bg-gray-50 dark:bg-[#222]">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{document ? 'Edit' : 'New'} {TYPE_LABELS[type]}</h2>
            <span className="text-[10px] text-gray-400 font-mono">{docNumber}</span>
            <div className="hidden sm:flex items-center gap-3 ml-4 pl-4 border-l border-gray-200 dark:border-[#333]">
              <span className="text-[10px]"><span className="text-gray-400">Cost</span> <span className="font-medium text-gray-700 dark:text-gray-300">{fmt(totalCost)}</span></span>
              <span className="text-[10px]"><span className="text-gray-400">Profit</span> <span className={`font-medium ${totalProfit >= 0 ? 'text-green-600' : 'text-red-500'}`}>{fmt(totalProfit)}</span></span>
              <span className="text-[10px]"><span className="text-gray-400">Margin</span> <span className={`font-medium ${overallMargin >= 0 ? 'text-green-600' : 'text-red-500'}`}>{pct(overallMargin)}</span></span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {saveError && <span className="text-[10px] text-red-500 mr-2">{saveError}</span>}
            <button onClick={() => setShowPreview(!showPreview)} className="px-2 py-1 text-[10px] font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-[#333] rounded-lg hover:bg-gray-200 dark:hover:bg-[#444] flex items-center gap-1"><Eye className="w-3 h-3" /> Preview</button>
            <button onClick={handleSave} disabled={saving} className="px-3 py-1 text-[10px] font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"><Save className="w-3 h-3" /> {saving ? 'Saving...' : 'Save'}</button>
            <button onClick={handleExport} disabled={saving} className="px-3 py-1 text-[10px] font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 flex items-center gap-1"><Download className="w-3 h-3" /> PDF</button>
            <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-[#333]"><X className="w-4 h-4" /></button>
          </div>
        </div>

        {/* Split pane */}
        <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
          {/* LEFT */}
          <div className={`${showPreview ? 'h-[50%] sm:h-full sm:w-[55%]' : 'h-full w-full'} flex flex-col overflow-hidden border-b sm:border-b-0 sm:border-r border-gray-100 dark:border-[#2a2a2a]`}>
            <div className="flex border-b border-gray-100 dark:border-[#2a2a2a] px-4 flex-shrink-0 bg-white dark:bg-[#1a1a1a]">
              {(['editor', 'breakdown'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${activeTab === tab ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                  {tab === 'editor' ? 'Editor' : 'Cost Breakdown'}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto">
              {activeTab === 'editor' ? (
                <div className="p-4 space-y-4">
                  <div>
                    <label className="block text-[10px] font-medium text-gray-500 mb-0.5 uppercase">Project</label>
                    <select value={projectId} onChange={e => setProjectId(e.target.value)} className="w-full px-2 py-1.5 bg-white dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-lg text-sm text-gray-900 dark:text-gray-100">
                      <option value="">No project (optional)</option>
                      {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <h4 className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 uppercase">From</h4>
                      <FormInput label="Company" value={companyName} onChange={setCompanyName} />
                      <AutoTextarea label="Address" value={companyAddress} onChange={setCompanyAddress} />
                      <div className="grid grid-cols-2 gap-1.5">
                        <FormInput label="Phone" value={companyPhone} onChange={setCompanyPhone} />
                        <FormInput label="Email" value={companyEmail} onChange={setCompanyEmail} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <h4 className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 uppercase">To</h4>
                      <FormInput label="Client" value={clientName} onChange={setClientName} />
                      <AutoTextarea label="Address" value={clientAddress} onChange={setClientAddress} />
                      <div className="grid grid-cols-2 gap-1.5">
                        <FormInput label="Phone" value={clientPhone} onChange={setClientPhone} />
                        <FormInput label="Email" value={clientEmail} onChange={setClientEmail} />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <FormInput label="Doc #" value={docNumber} onChange={setDocNumber} />
                    <FormInput label="Issued" value={dateIssued} onChange={setDateIssued} type="date" />
                    <FormInput label="Due" value={dateDue} onChange={setDateDue} type="date" />
                  </div>

                  {/* Line Items */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <h4 className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 uppercase">Line Items</h4>
                      <div className="flex gap-1 relative">
                        {lineItemTemplates.length > 0 && (
                          <div className="relative">
                            <button onClick={() => setShowTemplates(!showTemplates)} className="px-2 py-0.5 text-[10px] text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded flex items-center gap-0.5">
                              <Copy className="w-3 h-3" /> Template
                            </button>
                            {showTemplates && (
                              <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowTemplates(false)} />
                                <div className="absolute right-0 top-full mt-1 w-52 bg-white dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-lg shadow-xl z-20 max-h-40 overflow-y-auto">
                                  {lineItemTemplates.map(t => (
                                    <button key={t.id} onClick={() => applyTemplate(t)} className="w-full px-3 py-1.5 text-left text-xs hover:bg-gray-50 dark:hover:bg-[#2a2a2a] text-gray-700 dark:text-gray-300">{t.name}</button>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        )}
                        <button onClick={addSection} className="px-2 py-0.5 text-[10px] text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded flex items-center gap-0.5"><Plus className="w-3 h-3" /> Section</button>
                        <button onClick={addLineItem} className="px-2 py-0.5 text-[10px] text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded flex items-center gap-0.5"><Plus className="w-3 h-3" /> Item</button>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                    <div className="min-w-[500px]">
                    <div className="grid grid-cols-[1fr_50px_55px_70px_50px_70px_70px_44px] gap-1 text-[9px] font-medium text-gray-400 uppercase px-0.5 mb-0.5">
                      <span>Description</span><span>Qty</span><span>Unit</span><span>Cost</span><span>Mkp%</span><span>Price</span><span>Total</span><span />
                    </div>

                    <div className="space-y-1">
                      {lineItems.map(li => {
                        if (li.type === 'section') {
                          return (
                            <div key={li.id} className="flex items-center gap-2 pt-2.5 pb-0.5 group -mx-0.5 px-0.5">
                              <div className="w-1.5 h-1.5 rounded-sm bg-blue-600 flex-shrink-0" />
                              <input
                                value={li.description}
                                onChange={e => updateLineItem(li.id, 'description', e.target.value)}
                                placeholder="Section name…"
                                className="flex-1 bg-transparent border-none text-[10px] font-bold uppercase tracking-widest text-blue-700 dark:text-blue-400 focus:outline-none p-0 placeholder-blue-300"
                              />
                              <button onClick={() => removeLineItem(li.id)} className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-300 hover:text-red-500 flex-shrink-0"><Trash2 className="w-3 h-3" /></button>
                            </div>
                          )
                        }
                        return (
                          <div key={li.id} className="group">
                            <div className="grid grid-cols-[1fr_50px_55px_70px_50px_70px_70px_44px] gap-1 items-start">
                              <textarea
                                value={li.description}
                                onChange={e => updateLineItem(li.id, 'description', e.target.value)}
                                onInput={e => { const t = e.currentTarget; t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px' }}
                                placeholder="Item description"
                                rows={1}
                                className="px-1.5 py-1 bg-white dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none overflow-hidden leading-snug"
                              />
                              <input type="number" value={li.quantity} onChange={e => updateLineItem(li.id, 'quantity', Number(e.target.value))} className="px-1 py-1 bg-white dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded text-xs text-right focus:outline-none focus:ring-1 focus:ring-blue-500" />
                              <select value={li.unit} onChange={e => updateLineItem(li.id, 'unit', e.target.value)} className="px-0.5 py-1 bg-white dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded text-[10px] focus:outline-none">{UNITS.map(u => <option key={u} value={u}>{u}</option>)}</select>
                              <input type="number" value={li.cost} onChange={e => updateLineItem(li.id, 'cost', Number(e.target.value))} className="px-1 py-1 bg-white dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded text-xs text-right focus:outline-none focus:ring-1 focus:ring-blue-500" />
                              <input type="number" value={Math.round(li.markup)} onChange={e => updateLineItem(li.id, 'markup', Number(e.target.value))} className="px-1 py-1 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded text-xs text-right focus:outline-none focus:ring-1 focus:ring-amber-500" />
                              <input type="number" value={Number(li.price.toFixed(2))} onChange={e => updateLineItem(li.id, 'price', Number(e.target.value))} className="px-1 py-1 bg-white dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded text-xs text-right focus:outline-none focus:ring-1 focus:ring-blue-500" />
                              <span className="text-xs font-medium text-gray-900 dark:text-gray-100 text-right tabular-nums pr-0.5 pt-1">{fmt(li.quantity * li.price)}</span>
                              <span className="flex items-center gap-0.5 pt-0.5">
                                {li.photo ? (
                                  <button onClick={() => setExpandedPhoto(li.photo!)} className="relative flex-shrink-0">
                                    <img src={li.photo} alt="" className="w-7 h-7 rounded object-cover border border-gray-200" />
                                    <span onClick={e => { e.stopPropagation(); updateLineItem(li.id, 'photo', '') }} className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 text-white rounded-full text-[7px] flex items-center justify-center leading-none cursor-pointer">✕</span>
                                  </button>
                                ) : (
                                  <label className="p-0.5 text-gray-300 hover:text-blue-500 cursor-pointer opacity-0 group-hover:opacity-100 text-[10px]">
                                    📷<input type="file" accept="image/*" className="hidden" onChange={e => handleLineItemPhoto(li.id, e)} />
                                  </label>
                                )}
                                <button onClick={() => removeLineItem(li.id)} className="p-0.5 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 className="w-3 h-3" /></button>
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    </div>
                    </div>
                  </div>

                  {/* Totals */}
                  <div className="border-t border-gray-100 dark:border-[#2a2a2a] pt-3 space-y-1.5">
                    <div className="flex justify-between text-xs"><span className="text-gray-500">Subtotal</span><span className="font-medium tabular-nums">{fmt(subtotal)}</span></div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="flex items-center gap-1.5">
                        <span className="text-gray-500">Tax</span>
                        <input type="number" value={taxRate} onChange={e => setTaxRate(Number(e.target.value))} className="w-14 px-1.5 py-0.5 bg-white dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded text-[10px] text-right" />
                        <span className="text-gray-400 text-[10px]">%</span>
                      </span>
                      <span className="font-medium tabular-nums">{fmt(taxAmount)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold border-t border-gray-200 dark:border-[#333] pt-1.5"><span>Total</span><span className="tabular-nums">{fmt(total)}</span></div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <AutoTextarea label="Terms" value={terms} onChange={setTerms} className="text-xs min-h-[64px]" />
                    <AutoTextarea label="Notes" value={notes} onChange={setNotes} className="text-xs min-h-[64px]" />
                  </div>
                </div>
              ) : (
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3 bg-gray-50 dark:bg-[#222] rounded-xl"><p className="text-[10px] text-gray-400 uppercase mb-1">Total Cost</p><p className="text-lg font-bold tabular-nums">{fmt(totalCost)}</p></div>
                    <div className="p-3 bg-gray-50 dark:bg-[#222] rounded-xl"><p className="text-[10px] text-gray-400 uppercase mb-1">Total Price</p><p className="text-lg font-bold tabular-nums">{fmt(subtotal)}</p></div>
                    <div className="p-3 bg-green-50 dark:bg-green-900/10 rounded-xl"><p className="text-[10px] text-green-600 uppercase mb-1">Gross Profit</p><p className="text-lg font-bold text-green-600 tabular-nums">{fmt(totalProfit)}</p></div>
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-xl"><p className="text-[10px] text-blue-600 uppercase mb-1">Margin / Markup</p><p className="text-lg font-bold text-blue-600 tabular-nums">{pct(overallMargin)}</p><p className="text-[10px] text-blue-400">{pct(overallMarkup)} markup</p></div>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-semibold text-gray-500 uppercase mb-2">Item Breakdown</h4>
                    <div className="space-y-1.5">
                      {lineItems.filter(li => li.description).map(li => {
                        const lc = li.quantity * li.cost, lp = li.quantity * li.price, pr = lp - lc
                        const lm = lp > 0 ? (pr / lp) * 100 : 0, cp = totalCost > 0 ? (lc / totalCost) * 100 : 0
                        return (
                          <div key={li.id} className="p-2.5 bg-gray-50 dark:bg-[#222] rounded-lg">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs font-medium text-gray-900 dark:text-gray-100">{li.description}</span>
                              <span className={`text-xs font-medium ${pr >= 0 ? 'text-green-600' : 'text-red-500'}`}>{fmt(pr)} profit</span>
                            </div>
                            <div className="flex items-center gap-4 text-[10px] text-gray-500 flex-wrap">
                              <span>{li.quantity} {li.unit} × {fmt(li.cost)} cost</span>
                              <span>{pct(li.markup)} markup</span>
                              <span>→ {fmt(li.price)}/unit</span>
                              <span className="ml-auto">{pct(lm)} margin</span>
                              <span>{pct(cp)} of cost</span>
                            </div>
                            <div className="mt-1.5 h-1.5 bg-gray-200 dark:bg-[#333] rounded-full overflow-hidden">
                              <div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.min(Math.max(lm, 0), 100)}%` }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Preview */}
          {showPreview && (
            <div className="h-[50%] sm:h-full sm:w-[45%] bg-gray-200 dark:bg-[#0d0d0d] overflow-y-auto flex items-start justify-center p-4">
              <div className="bg-white w-full max-w-[612px] min-h-[792px] shadow-xl overflow-hidden" style={{ fontFamily: 'system-ui' }}>
                <div className="h-[5px] bg-blue-600" />

                {/* Header */}
                <div className="px-10 pt-8 pb-6 flex justify-between items-start border-b border-gray-100">
                  <div>
                    <div className="text-[15px] font-black text-gray-900 tracking-tight">{companyName || 'Your Company'}</div>
                    {companyAddress && <div className="text-[10px] text-gray-400 mt-1 whitespace-pre-line leading-relaxed">{companyAddress}</div>}
                    <div className="text-[10px] text-gray-400 mt-0.5">
                      {companyPhone && <span>{companyPhone}</span>}
                      {companyPhone && companyEmail && <span className="mx-1.5 text-gray-300">·</span>}
                      {companyEmail && <span>{companyEmail}</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[22px] font-black text-gray-900 uppercase tracking-tight leading-none">{TYPE_LABELS[type]}</div>
                    <div className="mt-2 space-y-0.5 text-[10px]">
                      <div className="font-mono text-gray-400">#{docNumber}</div>
                      <div className="text-gray-400">Date: {dateIssued}</div>
                      {dateDue && <div className="font-semibold text-orange-500">Due: {dateDue}</div>}
                    </div>
                  </div>
                </div>

                {/* Prepared For */}
                <div className="px-10 py-5 bg-gray-50 border-b border-gray-100">
                  <div className="text-[8px] font-bold uppercase tracking-widest text-gray-400 mb-2">{type === 'invoice' ? 'Bill To' : 'Prepared For'}</div>
                  <div className="text-[13px] font-bold text-gray-900">{clientName || '—'}</div>
                  {clientAddress && <div className="text-[10px] text-gray-500 whitespace-pre-line mt-0.5 leading-relaxed">{clientAddress}</div>}
                  {clientEmail && <div className="text-[10px] text-gray-500">{clientEmail}</div>}
                  {clientPhone && <div className="text-[10px] text-gray-500">{clientPhone}</div>}
                </div>

                {/* Line items */}
                <div className="px-10 pt-6">
                  <table className="w-full text-[10px]">
                    <thead>
                      <tr className="border-b-2 border-gray-900">
                        <th className="text-left pb-2 font-bold text-[8px] uppercase tracking-widest text-gray-400">Description</th>
                        <th className="text-right pb-2 font-bold text-[8px] uppercase tracking-widest text-gray-400 w-10">Qty</th>
                        <th className="text-right pb-2 font-bold text-[8px] uppercase tracking-widest text-gray-400 w-10">Unit</th>
                        <th className="text-right pb-2 font-bold text-[8px] uppercase tracking-widest text-gray-400 w-16">Price</th>
                        <th className="text-right pb-2 font-bold text-[8px] uppercase tracking-widest text-gray-400 w-16">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hasSections
                        ? groupedItems.flatMap((group, gi) => {
                            const rows = []
                            if (group.title) rows.push(
                              <tr key={`sh-${gi}`}>
                                <td colSpan={5} className="pt-4 pb-1.5">
                                  <div className="flex items-center gap-1.5">
                                    <div className="w-[5px] h-[5px] rounded-sm bg-blue-600 flex-shrink-0" />
                                    <span className="text-[8px] font-black uppercase tracking-widest text-blue-700">{group.title}</span>
                                  </div>
                                </td>
                              </tr>
                            )
                            group.items.forEach(li => rows.push(
                              <tr key={li.id} className="border-b border-gray-100">
                                <td className="py-1.5 text-gray-700 pl-3 whitespace-pre-wrap">{li.description || '—'}</td>
                                <td className="text-right py-1.5 tabular-nums text-gray-500">{li.quantity}</td>
                                <td className="text-right py-1.5 text-gray-500">{li.unit}</td>
                                <td className="text-right py-1.5 tabular-nums text-gray-500">{fmt(li.price)}</td>
                                <td className="text-right py-1.5 font-semibold tabular-nums text-gray-900">{fmt(li.quantity * li.price)}</td>
                              </tr>
                            ))
                            if (group.title && group.items.length > 0) rows.push(
                              <tr key={`ss-${gi}`}>
                                <td colSpan={4} className="pt-1.5 pb-3 pr-2 text-right text-[8px] font-bold uppercase tracking-wider text-gray-400">{group.title} subtotal</td>
                                <td className="pt-1.5 pb-3 text-right font-bold tabular-nums text-gray-600 border-t border-gray-200">{fmt(group.subtotal)}</td>
                              </tr>
                            )
                            return rows
                          })
                        : lineItems.filter(li => li.type !== 'section').map(li => (
                            <tr key={li.id} className="border-b border-gray-100">
                              <td className="py-1.5 text-gray-700 whitespace-pre-wrap">{li.description || '—'}</td>
                              <td className="text-right py-1.5 tabular-nums text-gray-500">{li.quantity}</td>
                              <td className="text-right py-1.5 text-gray-500">{li.unit}</td>
                              <td className="text-right py-1.5 tabular-nums text-gray-500">{fmt(li.price)}</td>
                              <td className="text-right py-1.5 font-semibold tabular-nums text-gray-900">{fmt(li.quantity * li.price)}</td>
                            </tr>
                          ))
                      }
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div className="px-10 py-6">
                  <div className="flex justify-end">
                    <div className="w-56 text-[10px] space-y-1">
                      <div className="flex justify-between text-gray-500"><span>Subtotal</span><span className="tabular-nums">{fmt(subtotal)}</span></div>
                      {taxRate > 0 && <div className="flex justify-between text-gray-500"><span>Tax ({taxRate}%)</span><span className="tabular-nums">{fmt(taxAmount)}</span></div>}
                      <div className="flex justify-between items-baseline pt-3 mt-2 border-t-2 border-gray-900">
                        <span className="text-[11px] font-black uppercase tracking-wider text-gray-900">Total</span>
                        <span className="text-[20px] font-black tabular-nums text-gray-900 leading-none">{fmt(total)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Terms / Notes */}
                {(terms || notes) && (
                  <div className={`px-10 pb-10 border-t border-gray-100 pt-5 ${terms && notes ? 'grid grid-cols-2 gap-6' : ''}`}>
                    {terms && (
                      <div>
                        <div className="text-[8px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Terms</div>
                        <div className="text-[10px] text-gray-500 whitespace-pre-wrap leading-relaxed">{terms}</div>
                      </div>
                    )}
                    {notes && (
                      <div>
                        <div className="text-[8px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Notes</div>
                        <div className="text-[10px] text-gray-500 whitespace-pre-wrap leading-relaxed">{notes}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Photo lightbox */}
      {expandedPhoto && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/80" onClick={() => setExpandedPhoto(null)}>
          <img src={expandedPhoto} alt="" className="max-w-[80vw] max-h-[80vh] rounded-lg shadow-2xl" />
        </div>
      )}
    </div>
  )
}
