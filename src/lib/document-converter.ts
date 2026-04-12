// ============================================
// DOCUMENT CONVERSION UTILITY
// Convert between document types (estimate → invoice, etc.)
// ============================================

interface ConversionOptions {
  sourceDocument: any
  targetType: 'estimate' | 'invoice' | 'work_order' | 'change_order' | 'purchase_order'
  preserveLineItems?: boolean
  preservePricing?: boolean
  preserveClient?: boolean
  addReference?: boolean
}

export function convertDocument(options: ConversionOptions): any {
  const {
    sourceDocument,
    targetType,
    preserveLineItems = true,
    preservePricing = true,
    preserveClient = true,
    addReference = true,
  } = options

  // Base converted document
  const converted = {
    type: targetType,
    status: 'draft',
    dateIssued: new Date().toISOString().split('T')[0],
    
    // Client info (if preserving)
    ...(preserveClient && {
      clientName: sourceDocument.clientName,
      clientEmail: sourceDocument.clientEmail,
      clientPhone: sourceDocument.clientPhone,
      clientAddress: sourceDocument.clientAddress,
    }),
    
    // Company info (always preserve)
    companyName: sourceDocument.companyName,
    companyAddress: sourceDocument.companyAddress,
    companyPhone: sourceDocument.companyPhone,
    companyEmail: sourceDocument.companyEmail,
    companyLogoUrl: sourceDocument.companyLogoUrl,
    
    // Line items
    lineItems: preserveLineItems 
      ? (preservePricing 
          ? sourceDocument.lineItems 
          : sourceDocument.lineItems.map((item: any) => ({
              ...item,
              price: targetType === 'purchase_order' ? 0 : item.price, // Hide pricing for POs
            })))
      : [],
    
    // Totals (recalculate if pricing changed)
    subtotal: preservePricing ? sourceDocument.subtotal : 0,
    taxTotal: preservePricing ? sourceDocument.taxTotal : 0,
    total: preservePricing ? sourceDocument.total : 0,
    costTotal: sourceDocument.costTotal,
    
    // Terms (type-specific)
    terms: getDefaultTerms(targetType),
    notes: sourceDocument.notes || '',
    footer: sourceDocument.footer || '',
    
    // Reference to source document
    ...(addReference && {
      parentDocumentId: sourceDocument.id,
      notes: `${sourceDocument.notes ? sourceDocument.notes + '\n\n' : ''}Converted from ${sourceDocument.documentNumber}`,
    }),
  }

  // Type-specific adjustments
  switch (targetType) {
    case 'invoice':
      return {
        ...converted,
        dateDue: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days
        terms: 'Payment due within 30 days. Late payments subject to 1.5% monthly interest.',
      }
    
    case 'work_order':
      return {
        ...converted,
        terms: 'Work to be performed as specified. Material and labor costs as listed.',
      }
    
    case 'change_order':
      return {
        ...converted,
        terms: 'Changes to original scope of work. Additional costs or credits as itemized.',
        notes: `${converted.notes}\n\nChange Order - Original Contract: ${sourceDocument.documentNumber}`,
      }
    
    case 'purchase_order':
      return {
        ...converted,
        terms: 'Net 30 days. Materials to be delivered as specified.',
        // Remove pricing for purchase orders (internal use only)
        lineItems: sourceDocument.lineItems.map((item: any) => ({
          ...item,
          price: 0,
          cost: 0,
        })),
        subtotal: 0,
        total: 0,
        costTotal: 0,
      }
    
    default:
      return converted
  }
}

function getDefaultTerms(type: string): string {
  const terms: Record<string, string> = {
    estimate: 'Estimate valid for 30 days. Final pricing subject to site inspection.',
    invoice: 'Payment due within 30 days. Late payments subject to 1.5% monthly interest.',
    work_order: 'Work to be performed as specified. Material and labor costs as listed.',
    change_order: 'Changes to original scope of work. Additional costs or credits as itemized.',
    purchase_order: 'Net 30 days. Materials to be delivered as specified.',
  }
  return terms[type] || 'Standard terms and conditions apply.'
}

// Conversion presets
export const conversionPresets = {
  estimateToInvoice: {
    targetType: 'invoice' as const,
    preserveLineItems: true,
    preservePricing: true,
    preserveClient: true,
    addReference: true,
  },
  
  estimateToWorkOrder: {
    targetType: 'work_order' as const,
    preserveLineItems: true,
    preservePricing: false, // Can be toggled
    preserveClient: true,
    addReference: true,
  },
  
  invoiceToReceipt: {
    targetType: 'invoice' as const,
    preserveLineItems: true,
    preservePricing: true,
    preserveClient: true,
    addReference: false,
    // Additional processing: mark as paid
  },
  
  estimateToChangeOrder: {
    targetType: 'change_order' as const,
    preserveLineItems: true,
    preservePricing: true,
    preserveClient: true,
    addReference: true,
  },
  
  workOrderToPurchaseOrder: {
    targetType: 'purchase_order' as const,
    preserveLineItems: true,
    preservePricing: false, // No pricing on POs
    preserveClient: false, // Vendor info instead
    addReference: true,
  },
}

// Quick conversion helpers
export function quickConvert(document: any, preset: keyof typeof conversionPresets): any {
  return convertDocument({
    sourceDocument: document,
    ...conversionPresets[preset],
  })
}

// Calculate delta for change orders
export function calculateChangeOrderDelta(original: any, changes: any): {
  addedItems: any[]
  removedItems: any[]
  modifiedItems: any[]
  costDelta: number
  priceDelta: number
} {
  const addedItems: any[] = []
  const removedItems: any[] = []
  const modifiedItems: any[] = []
  
  // Find removed items
  original.lineItems.forEach((origItem: any) => {
    if (!changes.lineItems.find((i: any) => i.id === origItem.id)) {
      removedItems.push(origItem)
    }
  })
  
  // Find added and modified items
  changes.lineItems.forEach((newItem: any) => {
    const origItem = original.lineItems.find((i: any) => i.id === newItem.id)
    
    if (!origItem) {
      addedItems.push(newItem)
    } else {
      // Check if modified
      if (
        origItem.quantity !== newItem.quantity ||
        origItem.price !== newItem.price ||
        origItem.name !== newItem.name
      ) {
        modifiedItems.push({
          original: origItem,
          new: newItem,
          quantityChange: newItem.quantity - origItem.quantity,
          priceChange: newItem.price - origItem.price,
          totalChange: (newItem.quantity * newItem.price) - (origItem.quantity * origItem.price),
        })
      }
    }
  })
  
  // Calculate deltas
  const costDelta = changes.costTotal - original.costTotal
  const priceDelta = changes.total - original.total
  
  return {
    addedItems,
    removedItems,
    modifiedItems,
    costDelta,
    priceDelta,
  }
}

// Batch conversion
export async function batchConvert(
  documents: any[],
  targetType: string,
  onProgress?: (current: number, total: number) => void
): Promise<any[]> {
  const converted: any[] = []
  
  for (let i = 0; i < documents.length; i++) {
    const doc = documents[i]
    const result = convertDocument({
      sourceDocument: doc,
      targetType: targetType as any,
    })
    converted.push(result)
    
    if (onProgress) {
      onProgress(i + 1, documents.length)
    }
  }
  
  return converted
}
