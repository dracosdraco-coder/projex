'use client'

import { useState } from 'react'
import { Phone, MessageCircle, Mail, FileText, Plus, Send, X, Check, Loader2 } from 'lucide-react'

// Types
interface EmailTemplate {
  id: string; name: string; subject: string; body: string
  category: 'invoice' | 'reminder' | 'update' | 'welcome' | 'follow_up' | 'custom'
}

interface CommsHubProps {
  contacts?: any[]; teamMembers?: any[]; projects?: any[]
  onSendEmail?: (data: { to: string; cc?: string; subject: string; html: string; text: string }) => Promise<void>
}

type Tab = 'email' | 'templates' | 'calls_sms'

const DEFAULT_TEMPLATES: EmailTemplate[] = [
  { id: 't1', name: 'Invoice Reminder', subject: 'Reminder: Invoice #{number} Due', body: 'Hi {name},\n\nThis is a friendly reminder that Invoice #{number} for {amount} is due on {date}.\n\nPlease let us know if you have any questions.\n\nBest regards,\n{company}', category: 'reminder' },
  { id: 't2', name: 'Project Update', subject: 'Project Update: {project}', body: 'Hi {name},\n\nHere\'s a quick update on your project {project}:\n\n• Status: {status}\n• Completion: {progress}%\n• Next milestone: {milestone}\n\nPlease don\'t hesitate to reach out with questions.\n\nBest,\n{company}', category: 'update' },
  { id: 't3', name: 'Welcome / Onboarding', subject: 'Welcome to {company}!', body: 'Hi {name},\n\nThank you for choosing {company} for your project. We\'re excited to get started!\n\nHere\'s what happens next:\n1. Site assessment\n2. Detailed estimate\n3. Contract review\n\nYour project manager will reach out within 24 hours.\n\nBest,\n{company}', category: 'welcome' },
  { id: 't4', name: 'Payment Received', subject: 'Payment Confirmed - Invoice #{number}', body: 'Hi {name},\n\nWe\'ve received your payment of {amount} for Invoice #{number}. Thank you!\n\nYour account is now current.\n\nBest,\n{company}', category: 'invoice' },
  { id: 't5', name: 'Follow Up', subject: 'Following Up: {subject}', body: 'Hi {name},\n\nI wanted to follow up on our recent conversation about {subject}.\n\nDo you have any questions or would you like to move forward?\n\nLooking forward to hearing from you.\n\nBest,\n{company}', category: 'follow_up' },
  { id: 't6', name: 'Schedule Inspection', subject: 'Inspection Scheduled: {project}', body: 'Hi {name},\n\nAn inspection has been scheduled for {project}:\n\n• Date: {date}\n• Time: {time}\n• Location: {address}\n\nPlease ensure access is available.\n\nBest,\n{company}', category: 'custom' },
]

export default function CommsHubContent({ onSendEmail }: CommsHubProps) {
  const [tab, setTab] = useState<Tab>('email')

  // Email state
  const [emailTo, setEmailTo] = useState('')
  const [emailCc, setEmailCc] = useState('')
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const [emailSending, setEmailSending] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [showCompose, setShowCompose] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)

  // Template state
  const [templates, setTemplates] = useState<EmailTemplate[]>(DEFAULT_TEMPLATES)
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null)
  const [bulkTo, setBulkTo] = useState('')
  const [bulkTemplate, setBulkTemplate] = useState<string | null>(null)
  const [bulkSending, setBulkSending] = useState(false)
  const [bulkResult, setBulkResult] = useState<{ sent: number; failed: number } | null>(null)

  // Send email
  const handleSendEmail = async () => {
    if (!emailTo || !emailSubject) return
    setEmailSending(true)
    setEmailError(null)
    try {
      if (onSendEmail) {
        await onSendEmail({ to: emailTo, cc: emailCc, subject: emailSubject, html: `<pre style="font-family: -apple-system, sans-serif; white-space: pre-wrap;">${escapeHtml(emailBody)}</pre>`, text: emailBody })
      }
      setEmailSent(true)
      setTimeout(() => { setEmailSent(false); setShowCompose(false); setEmailTo(''); setEmailCc(''); setEmailSubject(''); setEmailBody('') }, 1500)
    } catch (err: any) {
      setEmailError(err?.message || 'Email failed to send')
    }
    setEmailSending(false)
  }

  // Use template
  const useTemplate = (template: EmailTemplate) => {
    setEmailSubject(template.subject)
    setEmailBody(template.body)
    setShowCompose(true)
    setTab('email')
  }

  // Bulk send
  const handleBulkSend = async () => {
    if (!bulkTo || !bulkTemplate) return
    const template = templates.find(t => t.id === bulkTemplate)
    if (!template || !onSendEmail) return
    setBulkSending(true)
    const emails = bulkTo.split(',').map(e => e.trim()).filter(Boolean)
    let sent = 0, failed = 0
    for (const email of emails) {
      try {
        await onSendEmail({ to: email, subject: template.subject, html: `<pre style="font-family: -apple-system, sans-serif; white-space: pre-wrap;">${escapeHtml(template.body)}</pre>`, text: template.body })
        sent++
      } catch { failed++ }
    }
    setBulkResult({ sent, failed })
    setBulkSending(false)
    setTimeout(() => setBulkResult(null), 3000)
  }

  const TABS: { id: Tab; label: string; icon: any; soon?: boolean }[] = [
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'templates', label: 'Templates', icon: FileText },
    { id: 'calls_sms', label: 'Calls & SMS', icon: Phone, soon: true },
  ]

  const TEMPLATE_CATEGORIES = [
    { id: 'all', label: 'All' },
    { id: 'invoice', label: 'Invoice' },
    { id: 'reminder', label: 'Reminder' },
    { id: 'update', label: 'Update' },
    { id: 'welcome', label: 'Welcome' },
    { id: 'follow_up', label: 'Follow Up' },
    { id: 'custom', label: 'Custom' },
  ]

  const [templateFilter, setTemplateFilter] = useState('all')

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#111]">
      {/* Tab Bar — Apple style segmented control */}
      <div className="bg-[#f5f5f7] dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-[#2a2a2a] px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 tracking-tight">Communications</h2>
          {tab === 'email' && (
            <button onClick={() => setShowCompose(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#007AFF] text-white rounded-full text-xs font-medium hover:bg-[#0066d6] transition-colors">
              <Plus className="w-3.5 h-3.5" /> Compose
            </button>
          )}
        </div>
        <div className="flex bg-gray-200/80 dark:bg-[#2a2a2a] rounded-lg p-0.5">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-all ${
                tab === t.id ? 'bg-white dark:bg-[#333] text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500'
              }`}>
              <t.icon className="w-3.5 h-3.5" /> {t.label}
              {t.soon && <span className="px-1.5 py-px rounded-full bg-gray-300/70 dark:bg-[#444] text-[8px] font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">Soon</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">

        {/* ===== CALLS & SMS (COMING SOON) ===== */}
        {tab === 'calls_sms' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
            <div className="flex gap-2 mb-3">
              <div className="w-12 h-12 rounded-full bg-[#34C759]/10 flex items-center justify-center">
                <Phone className="w-6 h-6 text-[#34C759]" />
              </div>
              <div className="w-12 h-12 rounded-full bg-[#007AFF]/10 flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-[#007AFF]" />
              </div>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Calls &amp; SMS — Coming Soon</h3>
            <p className="text-xs text-gray-500 max-w-xs">
              Calling and text messaging with clients is on the way. In the meantime, use Email here or the Messages card for team chat.
            </p>
          </div>
        )}

        {/* ===== EMAIL TAB ===== */}
        {tab === 'email' && (
          <div className="flex-1 overflow-y-auto">
            {showCompose ? (
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">New Email</h3>
                  <button onClick={() => setShowCompose(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                </div>
                <div className="space-y-2">
                  <input type="email" value={emailTo} onChange={e => setEmailTo(e.target.value)} placeholder="To: email@example.com"
                    className="w-full px-3 py-2.5 bg-[#f5f5f7] dark:bg-[#222] rounded-lg text-sm border-none focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20" />
                  <input type="text" value={emailCc} onChange={e => setEmailCc(e.target.value)} placeholder="Cc: (optional)"
                    className="w-full px-3 py-2.5 bg-[#f5f5f7] dark:bg-[#222] rounded-lg text-sm border-none focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20" />
                  <input type="text" value={emailSubject} onChange={e => setEmailSubject(e.target.value)} placeholder="Subject"
                    className="w-full px-3 py-2.5 bg-[#f5f5f7] dark:bg-[#222] rounded-lg text-sm font-medium border-none focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20" />
                  <textarea value={emailBody} onChange={e => setEmailBody(e.target.value)} placeholder="Write your message..."
                    rows={12} className="w-full px-3 py-2.5 bg-[#f5f5f7] dark:bg-[#222] rounded-lg text-sm border-none focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 resize-none" />
                </div>
                {emailError && <p className="text-xs text-red-500">{emailError}</p>}
                <div className="flex items-center justify-between pt-2">
                  <button onClick={() => { setTab('templates'); setShowCompose(false) }}
                    className="text-xs text-[#007AFF] hover:underline flex items-center gap-1">
                    <FileText className="w-3 h-3" /> Use Template
                  </button>
                  <button onClick={handleSendEmail} disabled={emailSending || !emailTo || !emailSubject}
                    className="flex items-center gap-1.5 px-5 py-2 bg-[#007AFF] text-white rounded-full text-xs font-medium hover:bg-[#0066d6] disabled:opacity-50 transition-colors">
                    {emailSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : emailSent ? <Check className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
                    {emailSending ? 'Sending...' : emailSent ? 'Sent!' : 'Send'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="w-14 h-14 rounded-full bg-[#007AFF]/10 flex items-center justify-center mb-3">
                  <Mail className="w-7 h-7 text-[#007AFF]" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Email</h3>
                <p className="text-xs text-gray-500 max-w-xs mb-4">Send emails to clients and team from noreply@projex.live</p>
                <button onClick={() => setShowCompose(true)}
                  className="px-4 py-2 bg-[#007AFF] text-white rounded-full text-xs font-medium hover:bg-[#0066d6] transition-colors">
                  Compose Email
                </button>
              </div>
            )}
          </div>
        )}

        {/* ===== TEMPLATES TAB ===== */}
        {tab === 'templates' && (
          <div className="flex-1 overflow-y-auto p-4">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Email Templates</h3>
              </div>
              {/* Category filter */}
              <div className="flex gap-1.5 overflow-x-auto pb-2">
                {TEMPLATE_CATEGORIES.map(cat => (
                  <button key={cat.id} onClick={() => setTemplateFilter(cat.id)}
                    className={`px-3 py-1 rounded-full text-[10px] font-medium whitespace-nowrap transition-colors ${
                      templateFilter === cat.id ? 'bg-[#007AFF] text-white' : 'bg-gray-100 dark:bg-[#222] text-gray-600 dark:text-gray-400'
                    }`}>{cat.label}</button>
                ))}
              </div>
            </div>

            {/* Template cards */}
            <div className="space-y-2 mb-6">
              {templates.filter(t => templateFilter === 'all' || t.category === templateFilter).map(template => (
                <div key={template.id} className="bg-[#f5f5f7] dark:bg-[#1a1a1a] rounded-xl p-4 hover:bg-gray-100 dark:hover:bg-[#222] transition-colors">
                  <div className="flex items-start justify-between mb-1.5">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{template.name}</p>
                      <p className="text-[10px] text-gray-400 capitalize">{template.category.replace('_', ' ')}</p>
                    </div>
                    <button onClick={() => useTemplate(template)}
                      className="text-[10px] text-[#007AFF] font-medium hover:underline">Use</button>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2">{template.subject}</p>
                </div>
              ))}
            </div>

            {/* Bulk Send */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#2a2a2a] p-4">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Bulk Send</h4>
              <p className="text-[11px] text-gray-500 mb-3">Send a template to multiple recipients at once.</p>
              <div className="space-y-2">
                <select value={bulkTemplate || ''} onChange={e => setBulkTemplate(e.target.value || null)}
                  className="w-full px-3 py-2 bg-[#f5f5f7] dark:bg-[#222] rounded-lg text-xs">
                  <option value="">Select template...</option>
                  {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <textarea value={bulkTo} onChange={e => setBulkTo(e.target.value)}
                  placeholder="Enter emails separated by commas..." rows={3}
                  className="w-full px-3 py-2 bg-[#f5f5f7] dark:bg-[#222] rounded-lg text-xs resize-none" />
                <button onClick={handleBulkSend} disabled={bulkSending || !bulkTemplate || !bulkTo}
                  className="w-full py-2 bg-[#007AFF] text-white rounded-lg text-xs font-medium disabled:opacity-50 transition-colors">
                  {bulkSending ? 'Sending...' : `Send to ${bulkTo.split(',').filter(Boolean).length || 0} recipients`}
                </button>
                {bulkResult && (
                  <p className={`text-xs text-center ${bulkResult.failed > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                    Sent {bulkResult.sent}, Failed {bulkResult.failed}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
}
