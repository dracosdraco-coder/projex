'use client'

import { useState } from 'react'
import { X, DollarSign, CheckCircle, CreditCard, Banknote, Building } from 'lucide-react'

interface PaymentModalProps {
  invoice: any
  onSave: (data: any) => void
  onClose: () => void
}

export default function PaymentModal({
  invoice,
  onSave,
  onClose,
}: PaymentModalProps) {
  const [paymentData, setPaymentData] = useState({
    amount: invoice.total - (invoice.amountPaid || 0),
    method: 'check',
    reference: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  })

  const remainingBalance = invoice.total - (invoice.amountPaid || 0)
  const isFullPayment = paymentData.amount >= remainingBalance

  const paymentMethods = [
    { value: 'check', label: 'Check', icon: Banknote },
    { value: 'cash', label: 'Cash', icon: DollarSign },
    { value: 'credit_card', label: 'Credit Card', icon: CreditCard },
    { value: 'bank_transfer', label: 'Bank Transfer', icon: Building },
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const newAmountPaid = (invoice.amountPaid || 0) + paymentData.amount
    
    onSave({
      amountPaid: newAmountPaid,
      paymentMethod: paymentData.method,
      paymentReference: paymentData.reference,
      datePaid: isFullPayment ? paymentData.date : invoice.datePaid,
      status: isFullPayment ? 'paid' : 'sent',
      notes: `${invoice.notes || ''}\n\nPayment received: $${paymentData.amount.toFixed(2)} via ${paymentData.method} on ${paymentData.date}${paymentData.reference ? ` (Ref: ${paymentData.reference})` : ''}${paymentData.notes ? `\n${paymentData.notes}` : ''}`,
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[500] p-4">
      <div className="bg-white dark:bg-[#1a1a1a] rounded-xl w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-[#2a2a2a] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Record Payment</h2>
              <p className="text-sm text-gray-500">{invoice.documentNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-[#252525] rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Invoice Summary */}
          <div className="bg-gray-50 dark:bg-[#111] rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Invoice Total:</span>
              <span className="font-semibold">${invoice.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Previously Paid:</span>
              <span className="font-semibold text-green-600">
                ${(invoice.amountPaid || 0).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-lg border-t pt-2">
              <span className="font-semibold">Remaining Balance:</span>
              <span className="font-bold text-red-600">
                ${remainingBalance.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Payment Amount */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Payment Amount <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                step="0.01"
                value={paymentData.amount}
                onChange={e => setPaymentData({ ...paymentData, amount: parseFloat(e.target.value) })}
                className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-[#333] rounded-lg focus:ring-2 focus:ring-green-500 text-lg font-semibold"
                placeholder="0.00"
                max={remainingBalance}
                required
              />
            </div>
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => setPaymentData({ ...paymentData, amount: remainingBalance / 2 })}
                className="flex-1 px-3 py-1 text-xs bg-gray-100 dark:bg-[#252525] rounded hover:bg-gray-200 dark:hover:bg-[#333]"
              >
                50%
              </button>
              <button
                type="button"
                onClick={() => setPaymentData({ ...paymentData, amount: remainingBalance })}
                className="flex-1 px-3 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded hover:bg-green-200 dark:hover:bg-green-900/50"
              >
                Full Amount
              </button>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium mb-2">Payment Method</label>
            <div className="grid grid-cols-2 gap-2">
              {paymentMethods.map(method => {
                const Icon = method.icon
                return (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() => setPaymentData({ ...paymentData, method: method.value })}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      paymentData.method === method.value
                        ? 'border-green-600 bg-green-50 dark:bg-green-900/20'
                        : 'border-gray-200 dark:border-[#2a2a2a] hover:border-gray-300'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mx-auto mb-1 ${
                      paymentData.method === method.value 
                        ? 'text-green-600' 
                        : 'text-gray-400'
                    }`} />
                    <p className="text-sm font-medium text-center">{method.label}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Payment Reference */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Reference Number {paymentData.method === 'check' && '(Check #)'}
            </label>
            <input
              type="text"
              value={paymentData.reference}
              onChange={e => setPaymentData({ ...paymentData, reference: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-[#333] rounded-lg focus:ring-2 focus:ring-green-500"
              placeholder={
                paymentData.method === 'check' ? 'Check number' :
                paymentData.method === 'bank_transfer' ? 'Transfer ID' :
                'Reference number'
              }
            />
          </div>

          {/* Payment Date */}
          <div>
            <label className="block text-sm font-medium mb-1">Payment Date</label>
            <input
              type="date"
              value={paymentData.date}
              onChange={e => setPaymentData({ ...paymentData, date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-[#333] rounded-lg focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-1">Notes (Optional)</label>
            <textarea
              value={paymentData.notes}
              onChange={e => setPaymentData({ ...paymentData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-[#333] rounded-lg focus:ring-2 focus:ring-green-500"
              rows={2}
              placeholder="Additional payment notes..."
            />
          </div>

          {/* Status Preview */}
          {isFullPayment && (
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <p className="font-semibold text-green-900 dark:text-green-100">Full Payment</p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Invoice will be marked as PAID
                </p>
              </div>
            </div>
          )}

          {!isFullPayment && paymentData.amount > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
              <p className="font-semibold text-yellow-900 dark:text-yellow-100 mb-1">Partial Payment</p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Remaining balance: ${(remainingBalance - paymentData.amount).toFixed(2)}
              </p>
            </div>
          )}
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
            disabled={!paymentData.amount || paymentData.amount <= 0}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <DollarSign className="w-4 h-4" />
            Record Payment
          </button>
        </div>
      </div>
    </div>
  )
}
