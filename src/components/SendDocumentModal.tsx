'use client'

import { useState } from 'react'
import { X, Send, Mail, Eye, Paperclip } from 'lucide-react'

interface SendDocumentModalProps {
  document: any
  onSend: (data: { to: string; cc?: string; subject: string; message: string; attachPdf: boolean }) => void
  onClose: () => void
}

export default function SendDocumentModal({
  document,
  onSend,
  onClose,
}: SendDocumentModalProps) {
  const [emailData, setEmailData] = useState({
    to: document.clientEmail || '',
    cc: '',
    subject: getDefaultSubject(document),
    message: getDefaultMessage(document),
    attachPdf: true,
  })

  const [showPreview, setShowPreview] = useState(false)

  const handleSend = () => {
    if (!emailData.to) {
      alert('Please enter recipient email')
      return
    }
    
    onSend(emailData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[500] p-4">
      <div className="bg-white dark:bg-[#1a1a1a] rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-[#2a2a2a] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Send className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Send Document</h2>
              <p className="text-sm text-gray-500">{document.documentNumber}</p>
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
        <div className="flex-1 overflow-y-auto p-6">
          {showPreview ? (
            /* Email Preview */
            <div className="bg-gray-50 dark:bg-[#111] rounded-lg p-6 border border-gray-200 dark:border-[#2a2a2a]">
              <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-6 max-w-2xl mx-auto">
                {/* Email Header */}
                <div className="mb-6 pb-4 border-b border-gray-200 dark:border-[#2a2a2a]">
                  <div className="flex items-center gap-2 text-sm mb-2">
                    <span className="text-gray-500">From:</span>
                    <span className="font-medium">{document.companyEmail || 'your@company.com'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm mb-2">
                    <span className="text-gray-500">To:</span>
                    <span className="font-medium">{emailData.to}</span>
                  </div>
                  {emailData.cc && (
                    <div className="flex items-center gap-2 text-sm mb-2">
                      <span className="text-gray-500">CC:</span>
                      <span className="font-medium">{emailData.cc}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500">Subject:</span>
                    <span className="font-medium">{emailData.subject}</span>
                  </div>
                </div>

                {/* Email Body */}
                <div className="prose dark:prose-invert max-w-none">
                  <div style={{ whiteSpace: 'pre-wrap' }}>{emailData.message}</div>
                </div>

                {/* Attachment */}
                {emailData.attachPdf && (
                  <div className="mt-6 pt-4 border-t border-gray-200 dark:border-[#2a2a2a]">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-[#111] rounded-lg">
                      <Paperclip className="w-5 h-5 text-gray-400" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{document.documentNumber}.pdf</p>
                        <p className="text-xs text-gray-500">PDF Document</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Email Form */
            <div className="space-y-4">
              {/* Recipient */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  To: <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={emailData.to}
                  onChange={e => setEmailData({ ...emailData, to: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-[#333] rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="client@email.com"
                  required
                />
              </div>

              {/* CC */}
              <div>
                <label className="block text-sm font-medium mb-1">CC: (Optional)</label>
                <input
                  type="email"
                  value={emailData.cc}
                  onChange={e => setEmailData({ ...emailData, cc: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-[#333] rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="manager@email.com"
                />
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Subject: <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={emailData.subject}
                  onChange={e => setEmailData({ ...emailData, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-[#333] rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Message: <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={emailData.message}
                  onChange={e => setEmailData({ ...emailData, message: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-[#333] rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={10}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Tip: Personalize this message for your client
                </p>
              </div>

              {/* Attachment */}
              <div className="bg-gray-50 dark:bg-[#111] rounded-lg p-4">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={emailData.attachPdf}
                    onChange={e => setEmailData({ ...emailData, attachPdf: e.target.checked })}
                    className="rounded"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-sm">Attach PDF Document</p>
                    <p className="text-xs text-gray-500">
                      {document.documentNumber}.pdf will be attached
                    </p>
                  </div>
                </label>
              </div>

              {/* Quick Templates */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <p className="text-sm font-medium mb-2">Quick Templates:</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setEmailData({ 
                      ...emailData, 
                      message: getDefaultMessage(document) 
                    })}
                    className="px-3 py-1 text-xs bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333] hover:bg-gray-50 dark:hover:bg-[#252525]"
                  >
                    Default Message
                  </button>
                  <button
                    onClick={() => setEmailData({ 
                      ...emailData, 
                      message: getFormalMessage(document) 
                    })}
                    className="px-3 py-1 text-xs bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333] hover:bg-gray-50 dark:hover:bg-[#252525]"
                  >
                    Formal
                  </button>
                  <button
                    onClick={() => setEmailData({ 
                      ...emailData, 
                      message: getCasualMessage(document) 
                    })}
                    className="px-3 py-1 text-xs bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333] hover:bg-gray-50 dark:hover:bg-[#252525]"
                  >
                    Casual
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-[#2a2a2a] px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#252525] rounded-lg flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            {showPreview ? 'Edit' : 'Preview'}
          </button>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-[#333] rounded-lg hover:bg-gray-50 dark:hover:bg-[#252525]"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={!emailData.to || !emailData.subject || !emailData.message}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Send Email
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function getDefaultSubject(document: any): string {
  const type = document.type.replace('_', ' ').split(' ')
    .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
  
  return `${type} ${document.documentNumber} from ${document.companyName || 'Our Company'}`
}

function getDefaultMessage(document: any): string {
  const type = document.type.replace('_', ' ')
  return `Hi ${document.clientName ? document.clientName.split(' ')[0] : 'there'},

Please find attached ${type} ${document.documentNumber} for your review.

${document.type === 'estimate' ? 'This estimate is valid for 30 days. Please let us know if you have any questions or would like to proceed.' : ''}
${document.type === 'invoice' ? `Payment is due by ${new Date(document.dateDue).toLocaleDateString()}. Please remit payment at your earliest convenience.` : ''}
${document.type === 'work_order' ? 'This work order details the scope of work to be performed. Please review and confirm.' : ''}

If you have any questions, please don't hesitate to reach out.

Best regards,
${document.companyName || 'Your Company'}`
}

function getFormalMessage(document: any): string {
  return `Dear ${document.clientName || 'Valued Client'},

We are pleased to provide you with ${document.type.replace('_', ' ')} ${document.documentNumber} for your consideration.

Please review the attached document at your convenience. Should you require any clarification or have questions regarding the contents, we remain at your disposal.

We look forward to your response.

Respectfully,
${document.companyName || 'Your Company'}`
}

function getCasualMessage(document: any): string {
  return `Hey ${document.clientName ? document.clientName.split(' ')[0] : 'there'}!

Attached is ${document.type.replace('_', ' ')} ${document.documentNumber}. Take a look when you get a chance!

Let me know if you have any questions - always happy to help.

Thanks!
${document.companyName || 'Your Company'}`
}
