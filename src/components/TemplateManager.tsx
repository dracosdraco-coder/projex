'use client'

import { useState } from 'react'
import { X, Plus, Edit, Trash2, Save, Search } from 'lucide-react'

interface TemplateManagerProps {
  lineItemTemplates: any[]
  formTemplates: any[]
  onClose: () => void
  onCreateLineItem: (data: any) => void
  onUpdateLineItem: (id: string, data: any) => void
  onDeleteLineItem: (id: string) => void
  onCreateFormTemplate: (data: any) => void
  onUpdateFormTemplate: (id: string, data: any) => void
  onDeleteFormTemplate: (id: string) => void
}

export default function TemplateManager({
  lineItemTemplates,
  formTemplates,
  onClose,
  onCreateLineItem,
  onUpdateLineItem,
  onDeleteLineItem,
  onCreateFormTemplate,
  onUpdateFormTemplate,
  onDeleteFormTemplate,
}: TemplateManagerProps) {
  const [activeTab, setActiveTab] = useState<'line-items' | 'forms'>('line-items')
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [showLineItemForm, setShowLineItemForm] = useState(false)
  const [editingLineItem, setEditingLineItem] = useState<any | null>(null)

  // Form template editor state
  const [editingFormTemplate, setEditingFormTemplate] = useState<any | null>(null)
  const [formTemplateForm, setFormTemplateForm] = useState({
    name: '', type: 'estimate', companyName: '', companyAddress: '', companyPhone: '',
    companyEmail: '', companyWebsite: '', companyLogoUrl: '', showMargins: false,
    terms: '', notes: '', footer: '', lineItems: [] as any[],
  })

  const [lineItemForm, setLineItemForm] = useState({
    category: 'labor',
    name: '',
    description: '',
    unit: 'ea',
    cost: '',
    price: '',
    taxRate: '8.75',
    isTaxable: true,
    notes: '',
  })

  const categories = [
    { value: 'labor', label: 'Labor', color: 'blue' },
    { value: 'materials', label: 'Materials', color: 'green' },
    { value: 'equipment', label: 'Equipment', color: 'purple' },
    { value: 'subcontractor', label: 'Subcontractor', color: 'orange' },
    { value: 'other', label: 'Other', color: 'gray' },
  ]

  const units = [
    { value: 'ea', label: 'Each' },
    { value: 'hr', label: 'Hour' },
    { value: 'day', label: 'Day' },
    { value: 'sf', label: 'Square Foot' },
    { value: 'lf', label: 'Linear Foot' },
    { value: 'ton', label: 'Ton' },
    { value: 'yd', label: 'Yard' },
    { value: 'bundle', label: 'Bundle' },
    { value: 'roll', label: 'Roll' },
  ]

  const filteredLineItems = lineItemTemplates.filter(item => {
    if (categoryFilter !== 'all' && item.category !== categoryFilter) return false
    if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const handleSaveLineItem = () => {
    const data = {
      category: lineItemForm.category,
      name: lineItemForm.name,
      description: lineItemForm.description,
      unit: lineItemForm.unit,
      cost: parseFloat(lineItemForm.cost),
      price: parseFloat(lineItemForm.price),
      taxRate: parseFloat(lineItemForm.taxRate),
      isTaxable: lineItemForm.isTaxable,
      notes: lineItemForm.notes,
    }

    if (editingLineItem) {
      onUpdateLineItem(editingLineItem.id, data)
      setEditingLineItem(null)
    } else {
      onCreateLineItem(data)
    }

    setLineItemForm({
      category: 'labor',
      name: '',
      description: '',
      unit: 'ea',
      cost: '',
      price: '',
      taxRate: '8.75',
      isTaxable: true,
      notes: '',
    })
    setShowLineItemForm(false)
  }

  const handleEditLineItem = (item: any) => {
    setEditingLineItem(item)
    setLineItemForm({
      category: item.category,
      name: item.name,
      description: item.description || '',
      unit: item.unit,
      cost: item.cost.toString(),
      price: item.price.toString(),
      taxRate: item.taxRate.toString(),
      isTaxable: item.isTaxable,
      notes: item.notes || '',
    })
    setShowLineItemForm(true)
  }

  const calculateMargin = (cost: number, price: number) => {
    if (cost === 0) return 0
    return ((price - cost) / cost * 100).toFixed(1)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[500] p-4">
      <div className="bg-white dark:bg-[#1a1a1a] rounded-xl w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-[#2a2a2a] px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Template Manager</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-[#252525] rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('line-items')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                activeTab === 'line-items'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#252525]'
              }`}
            >
              Line Item Templates ({lineItemTemplates.length})
            </button>
            <button
              onClick={() => setActiveTab('forms')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                activeTab === 'forms'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#252525]'
              }`}
            >
              Form Templates ({formTemplates.length})
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {activeTab === 'line-items' && (
            <>
              {/* Left Panel - List */}
              <div className="w-2/3 border-r border-gray-200 dark:border-[#2a2a2a] flex flex-col">
                <div className="p-4 border-b border-gray-200 dark:border-[#2a2a2a]">
                  <div className="flex gap-3 mb-3">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search templates..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-[#333] rounded-lg text-sm"
                      />
                    </div>
                    <select
                      value={categoryFilter}
                      onChange={e => setCategoryFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 dark:border-[#333] rounded-lg text-sm"
                    >
                      <option value="all">All Categories</option>
                      {categories.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => {
                      setEditingLineItem(null)
                      setShowLineItemForm(true)
                    }}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    New Line Item Template
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {filteredLineItems.map(item => {
                    const category = categories.find(c => c.value === item.category)
                    return (
                      <div
                        key={item.id}
                        className="bg-gray-50 dark:bg-[#111] rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-[#1e1e1e] transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium bg-${category?.color}-100 dark:bg-${category?.color}-900/30 text-${category?.color}-700 dark:text-${category?.color}-400`}>
                                {category?.label}
                              </span>
                              <h4 className="font-semibold text-gray-900 dark:text-gray-100">{item.name}</h4>
                            </div>
                            {item.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleEditLineItem(item)}
                              className="p-1 hover:bg-gray-200 dark:hover:bg-[#252525] rounded"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm('Delete this template?')) {
                                  onDeleteLineItem(item.id)
                                }
                              }}
                              className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-sm">
                          <div>
                            <p className="text-xs text-gray-500">Unit</p>
                            <p className="font-medium">{item.unit}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Cost</p>
                            <p className="font-medium text-red-600">${item.cost.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Price</p>
                            <p className="font-medium text-green-600">${item.price.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Margin</p>
                            <p className="font-medium">{calculateMargin(item.cost, item.price)}%</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Right Panel - Form */}
              <div className="w-1/3 bg-gray-50 dark:bg-[#111] p-4">
                {showLineItemForm ? (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">
                      {editingLineItem ? 'Edit Template' : 'New Template'}
                    </h3>

                    <div>
                      <label className="block text-sm font-medium mb-1">Category *</label>
                      <select
                        value={lineItemForm.category}
                        onChange={e => setLineItemForm({ ...lineItemForm, category: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      >
                        {categories.map(cat => (
                          <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Name *</label>
                      <input
                        type="text"
                        value={lineItemForm.name}
                        onChange={e => setLineItemForm({ ...lineItemForm, name: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                        placeholder="e.g., Roof Tear-Off"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Description</label>
                      <textarea
                        value={lineItemForm.description}
                        onChange={e => setLineItemForm({ ...lineItemForm, description: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                        rows={2}
                        placeholder="Detailed description"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Unit *</label>
                      <select
                        value={lineItemForm.unit}
                        onChange={e => setLineItemForm({ ...lineItemForm, unit: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      >
                        {units.map(unit => (
                          <option key={unit.value} value={unit.value}>{unit.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Cost * 🔒</label>
                        <input
                          type="number"
                          step="0.01"
                          value={lineItemForm.cost}
                          onChange={e => setLineItemForm({ ...lineItemForm, cost: e.target.value })}
                          className="w-full px-3 py-2 border rounded-lg bg-red-50 dark:bg-red-900/20"
                          placeholder="0.00"
                        />
                        <p className="text-xs text-gray-500 mt-1">Never shown to client</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Price *</label>
                        <input
                          type="number"
                          step="0.01"
                          value={lineItemForm.price}
                          onChange={e => setLineItemForm({ ...lineItemForm, price: e.target.value })}
                          className="w-full px-3 py-2 border rounded-lg"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    {lineItemForm.cost && lineItemForm.price && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                          Margin: {calculateMargin(parseFloat(lineItemForm.cost), parseFloat(lineItemForm.price))}%
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Tax Rate (%)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={lineItemForm.taxRate}
                          onChange={e => setLineItemForm({ ...lineItemForm, taxRate: e.target.value })}
                          className="w-full px-3 py-2 border rounded-lg"
                          placeholder="8.75"
                        />
                      </div>
                      <div className="flex items-center pt-7">
                        <input
                          type="checkbox"
                          checked={lineItemForm.isTaxable}
                          onChange={e => setLineItemForm({ ...lineItemForm, isTaxable: e.target.checked })}
                          className="mr-2"
                        />
                        <label className="text-sm">Taxable</label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Notes</label>
                      <textarea
                        value={lineItemForm.notes}
                        onChange={e => setLineItemForm({ ...lineItemForm, notes: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                        rows={2}
                        placeholder="Internal notes"
                      />
                    </div>

                    <div className="flex gap-2 pt-4">
                      <button
                        onClick={() => {
                          setShowLineItemForm(false)
                          setEditingLineItem(null)
                        }}
                        className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-100"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveLineItem}
                        disabled={!lineItemForm.name || !lineItemForm.cost || !lineItemForm.price}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 mt-12">
                    <p>Select a template to edit or create a new one</p>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'forms' && (() => {
            const openFormEditor = (t?: any) => {
              if (t) {
                setEditingFormTemplate(t)
                setFormTemplateForm({
                  name: t.name || '', type: t.type || 'estimate',
                  companyName: t.companyName || '', companyAddress: t.companyAddress || '',
                  companyPhone: t.companyPhone || '', companyEmail: t.companyEmail || '',
                  companyWebsite: t.companyWebsite || '', companyLogoUrl: t.companyLogoUrl || '',
                  showMargins: t.showMargins || false, terms: t.terms || '', notes: t.notes || '',
                  footer: t.footer || '', lineItems: t.lineItems || [],
                })
              } else {
                setEditingFormTemplate({ _new: true })
                setFormTemplateForm({
                  name: '', type: 'estimate', companyName: '', companyAddress: '', companyPhone: '',
                  companyEmail: '', companyWebsite: '', companyLogoUrl: '', showMargins: false,
                  terms: 'Payment due within 30 days.', notes: '', footer: '', lineItems: [],
                })
              }
            }

            const saveFormTemplate = () => {
              if (!formTemplateForm.name.trim()) return
              if (editingFormTemplate?._new) {
                onCreateFormTemplate(formTemplateForm)
              } else {
                onUpdateFormTemplate(editingFormTemplate.id, formTemplateForm)
              }
              setEditingFormTemplate(null)
            }

            const f = formTemplateForm
            const setF = (updates: any) => setFormTemplateForm(prev => ({ ...prev, ...updates }))

            return (
            <div className="flex-1 overflow-y-auto p-6">
              {editingFormTemplate ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {editingFormTemplate._new ? 'New Form Template' : `Edit: ${editingFormTemplate.name}`}
                    </h3>
                    <div className="flex gap-2">
                      <button onClick={() => setEditingFormTemplate(null)}
                        className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-[#2a2a2a] rounded-lg hover:bg-gray-200">Cancel</button>
                      <button onClick={saveFormTemplate} disabled={!f.name.trim()}
                        className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1">
                        <Save className="w-3 h-3" /> Save Template
                      </button>
                    </div>
                  </div>

                  {/* Name & Type */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Template Name *</label>
                      <input type="text" value={f.name} onChange={e => setF({ name: e.target.value })}
                        className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-lg" placeholder="e.g. Standard Roofing Estimate" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Document Type</label>
                      <select value={f.type} onChange={e => setF({ type: e.target.value })}
                        className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-lg">
                        <option value="estimate">Estimate</option>
                        <option value="invoice">Invoice</option>
                        <option value="work_order">Work Order</option>
                        <option value="change_order">Change Order</option>
                        <option value="purchase_order">Purchase Order</option>
                        <option value="proposal">Proposal</option>
                        <option value="contract">Contract</option>
                      </select>
                    </div>
                  </div>

                  {/* Company Info */}
                  <div className="bg-white dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-xl p-4">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Company Info</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <input type="text" value={f.companyName} onChange={e => setF({ companyName: e.target.value })} placeholder="Company Name"
                        className="px-3 py-2 text-sm bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-lg" />
                      <input type="text" value={f.companyPhone} onChange={e => setF({ companyPhone: e.target.value })} placeholder="Phone"
                        className="px-3 py-2 text-sm bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-lg" />
                      <input type="text" value={f.companyEmail} onChange={e => setF({ companyEmail: e.target.value })} placeholder="Email"
                        className="px-3 py-2 text-sm bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-lg" />
                      <input type="text" value={f.companyWebsite} onChange={e => setF({ companyWebsite: e.target.value })} placeholder="Website"
                        className="px-3 py-2 text-sm bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-lg" />
                      <input type="text" value={f.companyAddress} onChange={e => setF({ companyAddress: e.target.value })} placeholder="Address" className="col-span-2
                        px-3 py-2 text-sm bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-lg" />
                    </div>
                  </div>

                  {/* Terms & Notes */}
                  <div className="bg-white dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-xl p-4">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Default Content</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Terms & Conditions</label>
                        <textarea value={f.terms} onChange={e => setF({ terms: e.target.value })} rows={3}
                          className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-lg resize-none" placeholder="Payment terms, warranty, etc." />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Notes</label>
                        <textarea value={f.notes} onChange={e => setF({ notes: e.target.value })} rows={2}
                          className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-lg resize-none" placeholder="Default notes for this template" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Footer</label>
                        <input type="text" value={f.footer} onChange={e => setF({ footer: e.target.value })}
                          className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-lg" placeholder="Footer text" />
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={f.showMargins} onChange={e => setF({ showMargins: e.target.checked })} className="rounded" />
                        <span className="text-xs text-gray-600 dark:text-gray-400">Show cost/margin columns</span>
                      </label>
                    </div>
                  </div>

                  {/* Default Line Items */}
                  <div className="bg-white dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Default Line Items ({f.lineItems.length})</h4>
                      <button onClick={() => setF({ lineItems: [...f.lineItems, { id: `li-${Date.now()}`, description: '', quantity: 1, unit: 'ea', cost: 0, price: 0 }] })}
                        className="px-2 py-1 text-[10px] font-medium bg-gray-100 dark:bg-[#333] text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 flex items-center gap-1">
                        <Plus className="w-3 h-3" /> Add Item
                      </button>
                    </div>
                    {f.lineItems.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-4">No default line items. Add items that should auto-populate when using this template.</p>
                    ) : (
                      <div className="space-y-2">
                        {f.lineItems.map((li: any, idx: number) => (
                          <div key={li.id || idx} className="flex items-center gap-2 bg-gray-50 dark:bg-[#1a1a1a] rounded-lg p-2">
                            <input type="text" value={li.description} onChange={e => {
                              const items = [...f.lineItems]; items[idx] = { ...items[idx], description: e.target.value }; setF({ lineItems: items })
                            }} placeholder="Description" className="flex-1 px-2 py-1 text-xs bg-transparent border-b border-gray-200 dark:border-[#444] focus:outline-none" />
                            <input type="number" value={li.quantity} onChange={e => {
                              const items = [...f.lineItems]; items[idx] = { ...items[idx], quantity: parseFloat(e.target.value) || 0 }; setF({ lineItems: items })
                            }} className="w-14 px-2 py-1 text-xs text-center bg-transparent border-b border-gray-200 dark:border-[#444] focus:outline-none" />
                            <input type="text" value={li.unit} onChange={e => {
                              const items = [...f.lineItems]; items[idx] = { ...items[idx], unit: e.target.value }; setF({ lineItems: items })
                            }} className="w-12 px-2 py-1 text-xs text-center bg-transparent border-b border-gray-200 dark:border-[#444] focus:outline-none" placeholder="ea" />
                            <input type="number" value={li.price} onChange={e => {
                              const items = [...f.lineItems]; items[idx] = { ...items[idx], price: parseFloat(e.target.value) || 0 }; setF({ lineItems: items })
                            }} className="w-20 px-2 py-1 text-xs bg-transparent border-b border-gray-200 dark:border-[#444] focus:outline-none" placeholder="Price" />
                            <button onClick={() => { const items = f.lineItems.filter((_: any, i: number) => i !== idx); setF({ lineItems: items }) }}
                              className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Form Templates</h3>
                    <button onClick={() => openFormEditor()}
                      className="px-3 py-1.5 text-xs font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 flex items-center gap-1">
                      <Plus className="w-3 h-3" /> New Template
                    </button>
                  </div>

                  {formTemplates.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <p className="text-sm">No form templates yet</p>
                      <p className="text-xs mt-1">Create templates to pre-fill company info, terms, and default line items</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {formTemplates.map((t: any) => (
                        <div key={t.id} className="bg-white dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-xl p-4 hover:shadow-md transition-all cursor-pointer"
                          onClick={() => openFormEditor(t)}>
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t.name}</h4>
                              <p className="text-[10px] text-gray-400 capitalize">{t.type?.replace('_', ' ')} · {t.lineItems?.length || 0} line items</p>
                            </div>
                            <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                              <button onClick={() => openFormEditor(t)}
                                className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg">
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => { if (confirm('Delete this template?')) onDeleteFormTemplate(t.id) }}
                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          {t.companyName && <p className="text-xs text-gray-500 mb-1">Company: {t.companyName}</p>}
                          {t.terms && <p className="text-[10px] text-gray-400 truncate">Terms: {t.terms}</p>}
                          {t.lineItems?.length > 0 && (
                            <div className="mt-2 space-y-0.5">
                              {t.lineItems.slice(0, 3).map((li: any, i: number) => (
                                <div key={i} className="text-[10px] text-gray-500 flex justify-between">
                                  <span className="truncate flex-1">{li.description || li.name || 'Item'}</span>
                                  <span className="ml-2 tabular-nums">{li.unit || 'ea'}</span>
                                </div>
                              ))}
                              {t.lineItems.length > 3 && <p className="text-[10px] text-gray-400">+{t.lineItems.length - 3} more items</p>}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
            )
          })()}
        </div>
      </div>
    </div>
  )
}
