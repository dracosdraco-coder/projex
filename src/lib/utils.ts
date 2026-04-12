import { LineItem } from '@/types'

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

export function calculateLineItemTotal(item: LineItem) {
  const materialTotal = item.materialCost * item.quantity * (1 + item.materialMargin / 100)
  const laborTotal = item.laborCost * item.quantity * (1 + item.laborMargin / 100)
  return materialTotal + laborTotal
}

export const calculateFormTotals = (items: LineItem[]) => {
  const totalMaterial = items.reduce((sum, item) => sum + (item.materialCost * item.quantity), 0)
  const totalLabor = items.reduce((sum, item) => sum + (item.laborCost * item.quantity), 0)
  const totalCost = totalMaterial + totalLabor
  const totalPrice = items.reduce((sum, item) => sum + calculateLineItemTotal(item), 0)
  const grossProfit = totalPrice - totalCost
  const grossPercentage = totalPrice > 0 ? (grossProfit / totalPrice) * 100 : 0
  return { totalMaterial, totalLabor, totalCost, totalPrice, grossProfit, grossPercentage }
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
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

export const cn = (...classes: (string | boolean | undefined)[]): string => {
  return classes.filter(Boolean).join(' ')
}
