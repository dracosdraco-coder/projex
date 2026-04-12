'use client'

import { useState } from 'react'
import { X, Plus, Zap } from 'lucide-react'

interface QuickAddLineItemModalProps {
  onSave: (data: any) => void
  onClose: () => void
}

export default function QuickAddLineItemModal({
  onSave,
  onClose,
}: QuickAddLineItemModalProps) {
  const [formData, setFormData] = useState({
    category: 'labor',
    name: '',
    unit: 'ea',
    cost: '',
    price: '',
    saveAsTemplate: false,
  })

  const categories = [
    { value: 'labor', label: 'Labor', emoji: '👷' },
    { value: 'materials', label: 'Materials', emoji: '🧱' },
    { value: 'equipment', label: 'Equipment', emoji: '🔧' },
    { value: 'subcontractor', label: 'Subcontractor', emoji: '🤝' },
    { value: 'other', label: 'Other', emoji: '📦' },
  ]

  const units = [
    { value: 'ea', label: 'Each' },
    { value: 'hr', label: 'Hour' },
    { value: 'day', label: 'Day' },
    { value: 'sf', label: 'Sq Ft' },
    { value: 'lf', label: 'Lin Ft' },
  ]

  const quickPresets = [
    { category: 'labor', name: 'General Labor', cost: 25, price: 50, unit: 'hr' },
    { category: 'labor', name: 'Skilled Labor', cost: 40, price: 80, unit: 'hr' },
    { category: 'materials', name: 'Misc Materials', cost: 50, price: 100, unit: 'ea' },
    { category: 'equipment', name: 'Equipment Rental', cost: 100, price: 200, unit: 'day' },
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const lineItemData = {
      category: formData.category,
      name: formData.name,
      unit: formData.unit,
      cost: parseFloat(formData.cost),
      price: parseFloat(formData.price),
      taxRate: 8.75,
      isTaxable: true,
    }
    
    onSave({
      lineItem: lineItemData,
      saveAsTemplate: formData.saveAsTemplate,
    })
  }

  const applyPreset = (preset: any) => {
    setFormData({
      ...formData,
      category: preset.category,
      name: preset.name,
      cost: preset.cost.toString(),
      price: preset.price.toString(),
      unit: preset.unit,
    })
  }

  const margin = formData.cost && formData.price 
    ? (((parseFloat(formData.price) - parseFloat(formData.cost)) / parseFloat(formData.cost)) * 100).toFixed(0)
    : '0'

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[500] p-4">
      <div className="bg-white dark:bg-[#1a1a1a] rounded-xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto mx-4">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-[#2a2a2a] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Zap className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Quick Add Line Item</h2>
              <p className="text-sm text-gray-500">Fast line item creation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-[#252525] rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Presets */}
        <div className="px-6 pt-4 pb-2">
          <p className="text-xs font-medium text-gray-500 mb-2">QUICK PRESETS</p>
          <div className="grid grid-cols-2 gap-2">
            {quickPresets.map((preset, i) => (
              <button
                key={i}
                type="button"
                onClick={() => applyPreset(preset)}
                className="text-left p-2 bg-gray-50 dark:bg-[#111] rounded-lg hover:bg-gray-100 dark:hover:bg-[#1e1e1e] transition-colors"
              >
                <p className="text-sm font-medium">{preset.name}</p>
                <p className="text-xs text-gray-500">${preset.price}/{preset.unit}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Category */}
          <div>
            <label className="block text-sm font-medium mb-2">Category</label>
            <div className="grid grid-cols-5 gap-2">
              {categories.map(cat => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, category: cat.value })}
                  className={`p-2 rounded-lg border-2 transition-all ${
                    formData.category === cat.value
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-[#2a2a2a] hover:border-gray-300'
                  }`}
                >
                  <span className="text-2xl block">{cat.emoji}</span>
                  <span className="text-xs block mt-1">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Item Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-[#333] rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Roof Tear-Off"
              required
            />
          </div>

          {/* Unit */}
          <div>
            <label className="block text-sm font-medium mb-1">Unit</label>
            <div className="flex gap-2">
              {units.map(unit => (
                <button
                  key={unit.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, unit: unit.value })}
                  className={`flex-1 px-3 py-2 rounded-lg border transition-all text-sm ${
                    formData.unit === unit.value
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'border-gray-200 dark:border-[#2a2a2a] hover:border-gray-300'
                  }`}
                >
                  {unit.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cost & Price */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Cost 🔒 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={formData.cost}
                  onChange={e => setFormData({ ...formData, cost: e.target.value })}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-[#333] rounded-lg focus:ring-2 focus:ring-red-500 bg-red-50 dark:bg-red-900/20"
                  placeholder="0.00"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Never shown to client</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Price <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={e => setFormData({ ...formData, price: e.target.value })}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-[#333] rounded-lg focus:ring-2 focus:ring-green-500 bg-green-50 dark:bg-green-900/20"
                  placeholder="0.00"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Client-facing price</p>
            </div>
          </div>

          {/* Margin Display */}
          {formData.cost && formData.price && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-blue-900 dark:text-blue-100">Margin:</span>
                <span className="text-xl font-bold text-blue-700 dark:text-blue-300">{margin}%</span>
              </div>
              <div className="flex justify-between text-xs text-blue-700 dark:text-blue-300 mt-1">
                <span>Profit per unit:</span>
                <span>${(parseFloat(formData.price) - parseFloat(formData.cost)).toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Save as Template */}
          <div className="bg-gray-50 dark:bg-[#111] rounded-lg p-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.saveAsTemplate}
                onChange={e => setFormData({ ...formData, saveAsTemplate: e.target.checked })}
                className="rounded"
              />
              <div className="flex-1">
                <p className="text-sm font-medium">Save as template</p>
                <p className="text-xs text-gray-500">Reuse this item in future documents</p>
              </div>
            </label>
          </div>
        </form>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-[#2a2a2a] px-6 py-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-[#333] rounded-lg hover:bg-gray-50 dark:hover:bg-[#252525]"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!formData.name || !formData.cost || !formData.price}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Line Item
          </button>
        </div>
      </div>
    </div>
  )
}
