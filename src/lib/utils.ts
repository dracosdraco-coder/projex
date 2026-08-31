import { LineItem } from '@/types'

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

// A bare "YYYY-MM-DD" string (from a <input type="date">, or stored as a DB date column) has no
// time component, so `new Date(str)` parses it as UTC midnight per the ISO 8601 spec. Rendering
// that with toLocaleDateString() in any timezone behind UTC (e.g. US timezones) rolls it back a
// day — Sep 1 becomes Aug 31. This parses date-only strings as local dates instead, while still
// handling full timestamps (which already carry correct time/zone info) the normal way.
export function parseLocalDate(dateStr: string): Date | null {
  if (!dateStr) return null
  if (dateStr.includes('T') || dateStr.includes(' ')) {
    const d = new Date(dateStr)
    return isNaN(d.getTime()) ? null : d
  }
  const [year, month, day] = dateStr.split('-').map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day)
}

export function formatLocalDate(dateStr: string, options?: Intl.DateTimeFormatOptions): string {
  const date = parseLocalDate(dateStr)
  return date ? date.toLocaleDateString('en-US', options) : 'Not set'
}

export function calculateLineItemTotal(item: LineItem) {
  return (item.quantity || 0) * (item.price || 0)
}

// Line items are saved by DocumentEditor as { quantity, cost, price, ... } — price already
// has markup baked in. totalMaterial/totalLabor are kept for callers but no longer split out
// since the editor uses a single cost/price per line, not separate material/labor costs.
export const calculateFormTotals = (items: LineItem[]) => {
  const totalCost = items.reduce((sum, item) => sum + (item.quantity || 0) * (item.cost || 0), 0)
  const totalPrice = items.reduce((sum, item) => sum + calculateLineItemTotal(item), 0)
  const grossProfit = totalPrice - totalCost
  const grossPercentage = totalPrice > 0 ? (grossProfit / totalPrice) * 100 : 0
  return { totalMaterial: totalCost, totalLabor: 0, totalCost, totalPrice, grossProfit, grossPercentage }
}

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'active':
      return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
    case 'completed':
      return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
    case 'on-hold':
      return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
    default:
      return 'bg-gray-100 dark:bg-[#2a2a2a] text-gray-700 dark:text-gray-300'
  }
}

export const getExpenseTypeColor = (type: string): string => {
  switch (type) {
    case 'labor':
      return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
    case 'materials':
      return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
    case 'equipment':
      return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
    case 'subcontractor':
      return 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300'
    default:
      return 'bg-gray-100 dark:bg-[#2a2a2a] text-gray-700 dark:text-gray-300'
  }
}

export const getCursor = (direction: string | null): string => {
  switch (direction) {
    case 'n':
    case 's':
      return 'cursor-ns-resize'
    case 'e':
    case 'w':
      return 'cursor-ew-resize'
    case 'ne':
    case 'sw':
      return 'cursor-nesw-resize'
    case 'nw':
    case 'se':
      return 'cursor-nwse-resize'
    default:
      return ''
  }
}

export const formatDate = (date: string): string => {
  const d = parseLocalDate(date)
  if (!d) return ''
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

export const cn = (...classes: (string | boolean | undefined)[]): string => {
  return classes.filter(Boolean).join(' ')
}
