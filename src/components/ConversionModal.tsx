'use client'

import { useState } from 'react'
import { X, ArrowRight, FileText, DollarSign, Info } from 'lucide-react'
import { convertDocument, calculateChangeOrderDelta } from '@/lib/document-converter'

interface ConversionModalProps {
  document: any
  onConvert: (converted: any) => void
  onClose: () => void
}

export default function ConversionModal({
  document,
  onConvert,
  onClose,
}: ConversionModalProps) {
  const [targetType, setTargetType] = useState<string>('')
  const [preservePricing, setPreservePricing] = useState(true)
  const [preserveClient, setPreserveClient] = useState(true)
  const [addReference, setAddReference] = useState(true)

  const conversionOptions = getAvailableConversions(document.type)

  const handleConvert = () => {
    const converted = convertDocument({
      sourceDocument: document,
      targetType: targetType as any,
      preservePricing,
      preserveClient,
      addReference,
    })
    
    onConvert(converted)
  }

  const getTypeInfo = (type: string) => {
    const info: Record<string, { label: string; icon: any; color: string; description: string }> = {
      estimate: {
        label: 'Estimate',
        icon: FileText,
        color: 'blue',
        description: 'Quote for potential work',
      },
      invoice: {
        label: 'Invoice',
        icon: DollarSign,
        color: 'green',
        description: 'Bill for completed work',
      },
      work_order: {
        label: 'Work Order',
        icon: FileText,
        color: 'purple',
        description: 'Instructions for work to be done',
      },
      change_order: {
        label: 'Change Order',
        icon: FileText,
        color: 'orange',
        description: 'Changes to original scope',
      },
      purchase_order: {
        label: 'Purchase Order',
        icon: FileText,
        color: 'indigo',
        description: 'Order for materials/services',
      },
    }
    return info[type] || info.estimate
  }

  const sourceInfo = getTypeInfo(document.type)
  const targetInfo = targetType ? getTypeInfo(targetType) : null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[500] p-4">
      <div className="bg-white dark:bg-[#1a1a1a] rounded-xl w-full max-w-2xl max-h-[90vh] mx-3 md:mx-0 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-[#2a2a2a] px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Convert Document</h2>
            <p className="text-sm text-gray-500">Convert {document.documentNumber} to another type</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-[#252525] rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* From → To */}
          <div className="flex items-center gap-4">
            {/* Source */}
            <div className="flex-1 bg-gray-50 dark:bg-[#111] rounded-lg p-4 border-2 border-gray-200 dark:border-[#2a2a2a]">
              <div className="flex items-center gap-3 mb-2">
                <sourceInfo.icon className={`w-6 h-6 text-${sourceInfo.color}-600`} />
                <div>
                  <p className="text-xs text-gray-500">FROM</p>
                  <p className="font-semibold">{sourceInfo.label}</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{document.documentNumber}</p>
              <p className="text-xs text-gray-500 mt-1">{document.clientName}</p>
            </div>

            {/* Arrow */}
            <ArrowRight className="w-8 h-8 text-gray-400 flex-shrink-0" />

            {/* Target */}
            <div className={`flex-1 rounded-lg p-4 border-2 ${
              targetType 
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-600' 
                : 'bg-gray-50 dark:bg-[#111] border-gray-200 dark:border-[#2a2a2a]'
            }`}>
              {targetInfo ? (
                <>
                  <div className="flex items-center gap-3 mb-2">
                    <targetInfo.icon className={`w-6 h-6 text-${targetInfo.color}-600`} />
                    <div>
                      <p className="text-xs text-gray-500">TO</p>
                      <p className="font-semibold">{targetInfo.label}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{targetInfo.description}</p>
                </>
              ) : (
                <div className="text-center text-gray-500 py-4">
                  <p className="text-sm">Select a document type</p>
                </div>
              )}
            </div>
          </div>

          {/* Conversion Options */}
          <div>
            <label className="block text-sm font-medium mb-3">Convert To:</label>
            <div className="grid grid-cols-2 gap-3">
              {conversionOptions.map(option => {
                const info = getTypeInfo(option.type)
                const Icon = info.icon
                return (
                  <button
                    key={option.type}
                    onClick={() => setTargetType(option.type)}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      targetType === option.type
                        ? `bg-${info.color}-50 dark:bg-${info.color}-900/20 border-${info.color}-600`
                        : 'bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className={`w-5 h-5 text-${info.color}-600 mt-0.5`} />
                      <div className="flex-1">
                        <p className="font-semibold text-sm mb-1">{info.label}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{info.description}</p>
                        {option.recommended && (
                          <span className="inline-block mt-2 text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded">
                            Recommended
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Conversion Settings */}
          {targetType && (
            <div className="bg-gray-50 dark:bg-[#111] rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Info className="w-4 h-4" />
                Conversion Settings
              </h3>

              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={preserveClient}
                    onChange={e => setPreserveClient(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">Keep client information</span>
                </label>

                {targetType !== 'purchase_order' && (
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={preservePricing}
                      onChange={e => setPreservePricing(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm">Keep pricing</span>
                    {!preservePricing && (
                      <span className="text-xs text-yellow-600 dark:text-yellow-400">
                        (Work order without pricing)
                      </span>
                    )}
                  </label>
                )}

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={addReference}
                    onChange={e => setAddReference(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">Add reference to original document</span>
                </label>
              </div>

              {targetType === 'purchase_order' && (
                <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <p className="text-xs text-yellow-800 dark:text-yellow-300">
                    ℹ️ Purchase orders will have pricing removed (internal use only)
                  </p>
                </div>
              )}

              {targetType === 'invoice' && (
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-xs text-blue-800 dark:text-blue-300">
                    ℹ️ Due date will be set to 30 days from today
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Preview */}
          {targetType && (
            <div className="bg-gray-50 dark:bg-[#111] rounded-lg p-4">
              <h3 className="font-semibold text-sm mb-3">What will be converted:</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Line items:</span>
                  <span className="font-medium">{document.lineItems?.length || 0} items</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total amount:</span>
                  <span className="font-medium">
                    {preservePricing ? `$${document.total.toFixed(2)}` : 'No pricing'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Client:</span>
                  <span className="font-medium">
                    {preserveClient ? document.clientName : 'Will be cleared'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-[#2a2a2a] px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-[#333] rounded-lg hover:bg-gray-50 dark:hover:bg-[#252525]"
          >
            Cancel
          </button>
          <button
            onClick={handleConvert}
            disabled={!targetType}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Convert Document
          </button>
        </div>
      </div>
    </div>
  )
}

function getAvailableConversions(sourceType: string): { type: string; recommended?: boolean }[] {
  const conversions: Record<string, { type: string; recommended?: boolean }[]> = {
    estimate: [
      { type: 'invoice', recommended: true },
      { type: 'work_order', recommended: true },
      { type: 'change_order' },
    ],
    invoice: [
      { type: 'work_order' },
      { type: 'change_order' },
    ],
    work_order: [
      { type: 'invoice', recommended: true },
      { type: 'purchase_order' },
      { type: 'change_order' },
    ],
    change_order: [
      { type: 'invoice' },
      { type: 'work_order' },
    ],
    purchase_order: [
      { type: 'work_order' },
    ],
  }
  
  return conversions[sourceType] || []
}
