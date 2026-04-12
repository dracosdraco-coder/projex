'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import {
  Phone, MessageCircle, Mail, FileText, Search, Plus, Send, X,
  PhoneCall, PhoneIncoming, PhoneOutgoing, PhoneMissed, Clock,
  Users, ChevronLeft, Mic, MicOff, Video, MoreHorizontal,
  Copy, Check, Star, Archive, Trash2, Loader2, Volume2
} from 'lucide-react'

// Types
interface CallLog {
  id: string; contactName: string; contactPhone: string
  type: 'incoming' | 'outgoing' | 'missed'; duration: number
  timestamp: string; notes?: string; projectId?: string
}

interface TextMessage {
  id: string; contactName: string; contactPhone: string
  content: string; direction: 'sent' | 'received'
  timestamp: string; status: 'sent' | 'delivered' | 'read'
}

interface TextConversation {
  contactName: string; contactPhone: string
  messages: TextMessage[]; lastMessage: string; lastTimestamp: string
  unread: number
}

interface EmailTemplate {
  id: string; name: string; subject: string; body: string
  category: 'invoice' | 'reminder' | 'update' | 'welcome' | 'follow_up' | 'custom'
}

interface CommsHubProps {
  contacts?: any[]; teamMembers?: any[]; projects?: any[]
  onSendEmail?: (data: { to: string; cc?: string; subject: string; html: string; text: string }) => Promise<void>
}

type Tab = 'calls' | 'messages' | 'email' | 'templates'

const DEFAULT_TEMPLATES: EmailTemplate[] = [
  { id: 't1', name: 'Invoice Reminder', subject: 'Reminder: Invoice #{number} Due', body: 'Hi {name},\n\nThis is a friendly reminder that Invoice #{number} for {amount} is due on {date}.\n\nPlease let us know if you have any questions.\n\nBest regards,\n{company}', category: 'reminder' },
  { id: 't2', name: 'Project Update', subject: 'Project Update: {project}', body: 'Hi {name},\n\nHere\'s a quick update on your project {project}:\n\n• Status: {status}\n• Completion: {progress}%\n• Next milestone: {milestone}\n\nPlease don\'t hesitate to reach out with questions.\n\nBest,\n{company}', category: 'update' },
  { id: 't3', name: 'Welcome / Onboarding', subject: 'Welcome to {company}!', body: 'Hi {name},\n\nThank you for choosing {company} for your project. We\'re excited to get started!\n\nHere\'s what happens next:\n1. Site assessment\n2. Detailed estimate\n3. Contract review\n\nYour project manager will reach out within 24 hours.\n\nBest,\n{company}', category: 'welcome' },
  { id: 't4', name: 'Payment Received', subject: 'Payment Confirmed - Invoice #{number}', body: 'Hi {name},\n\nWe\'ve received your payment of {amount} for Invoice #{number}. Thank you!\n\nYour account is now current.\n\nBest,\n{company}', category: 'invoice' },
  { id: 't5', name: 'Follow Up', subject: 'Following Up: {subject}', body: 'Hi {name},\n\nI wanted to follow up on our recent conversation about {subject}.\n\nDo you have any questions or would you like to move forward?\n\nLooking forward to hearing from you.\n\nBest,\n{company}', category: 'follow_up' },
  { id: 't6', name: 'Schedule Inspection', subject: 'Inspection Scheduled: {project}', body: 'Hi {name},\n\nAn inspection has been scheduled for {project}:\n\n• Date: {date}\n• Time: {time}\n• Location: {address}\n\nPlease ensure access is available.\n\nBest,\n{company}', category: 'custom' },
]

export default function CommsHubContent({ contacts = [], teamMembers = [], projects = [], onSendEmail }: CommsHubProps) {
  const [tab, setTab] = useState<Tab>('messages')
  const [search, setSearch] = useState('')

  // Call state
  const [callLogs, setCallLogs] = useState<CallLog[]>([])
  const [showNewCall, setShowNewCall] = useState(false)
  const [callNotes, setCallNotes] = useState('')

  // Message state (iMessage style)
  const [conversations, setConversations] = useState<TextConversation[]>([])
  const [activeConvo, setActiveConvo] = useState<string | null>(null)
  const [newMessageText, setNewMessageText] = useState('')
  const [showNewConvo, setShowNewConvo] = useState(false)
  const [newConvoPhone, setNewConvoPhone] = useState('')
  const [newConvoName, setNewConvoName] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Email state
  const [emailTo, setEmailTo] = useState('')
  const [emailCc, setEmailCc] = useState('')
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const [emailSending, setEmailSending] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [showCompose, setShowCompose] = useState(false)

  // Template state
  const [templates, setTemplates] = useState<EmailTemplate[]>(DEFAULT_TEMPLATES)
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null)
  const [bulkTo, setBulkTo] = useState('')
  const [bulkTemplate, setBulkTemplate] = useState<string | null>(null)
  const [bulkSending, setBulkSending] = useState(false)
  const [bulkResult, setBulkResult] = useState<{ sent: number; failed: number } | null>(null)

  // All contacts with phone/email
  const allContacts = useMemo(() => {
    const people: { name: string; email?: string; phone?: string }[] = []
    contacts.forEach((c: any) => { if (c.email || c.phone) people.push({ name: c.name, email: c.email, phone: c.phone }) })
    teamMembers.forEach((m: any) => { if (m.email || m.phone) people.push({ name: m.name, email: m.email, phone: m.phone }) })
    return people
  }, [contacts, teamMembers])

  // Scroll to bottom on new message
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [activeConvo, conversations])

  // Log a call
  const logCall = async (type: CallLog['type'], contactName: string, contactPhone: string, duration: number) => {
    // If outgoing, actually initiate the call via Twilio
    if (type === 'outgoing' && contactPhone) {
      try {
        await fetch('/api/voip', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'make_call', to: contactPhone }),
        })
      } catch (err) {
        console.error('Call failed:', err)
      }
    }

    setCallLogs(prev => [{
      id: `call-${Date.now()}`, contactName, contactPhone, type, duration,
      timestamp: new Date().toISOString(), notes: callNotes,
    }, ...prev])
    setCallNotes('')
    setShowNewCall(false)
  }

  // Send a text message via Twilio SMS
  const [sendingMsg, setSendingMsg] = useState(false)
  const sendMessage = async () => {
    if (!newMessageText.trim() || !activeConvo) return
    setSendingMsg(true)

    // Send via Twilio
    try {
      const res = await fetch('/api/voip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send_sms', to: activeConvo, message: newMessageText.trim() }),
      })
      const data = await res.json()

      const msg: TextMessage = {
        id: data.sid || `msg-${Date.now()}`, contactName: 'You', contactPhone: activeConvo,
        content: newMessageText.trim(), direction: 'sent',
        timestamp: new Date().toISOString(), status: data.success ? 'delivered' : 'sent',
      }
      setConversations(prev => prev.map(c =>
        c.contactPhone === activeConvo
          ? { ...c, messages: [...c.messages, msg], lastMessage: msg.content, lastTimestamp: msg.timestamp }
          : c
      ))
    } catch {
      // Fallback — still show the message locally
      const msg: TextMessage = {
        id: `msg-${Date.now()}`, contactName: 'You', contactPhone: activeConvo,
        content: newMessageText.trim(), direction: 'sent',
        timestamp: new Date().toISOString(), status: 'sent',
      }
      setConversations(prev => prev.map(c =>
        c.contactPhone === activeConvo
          ? { ...c, messages: [...c.messages, msg], lastMessage: msg.content, lastTimestamp: msg.timestamp }
          : c
      ))
    }
    setNewMessageText('')
    setSendingMsg(false)
  }

  // Start new conversation
  const startConvo = () => {
    if (!newConvoPhone) return
    const existing = conversations.find(c => c.contactPhone === newConvoPhone)
    if (existing) { setActiveConvo(newConvoPhone); setShowNewConvo(false); return }
    setConversations(prev => [{
      contactName: newConvoName || newConvoPhone, contactPhone: newConvoPhone,
      messages: [], lastMessage: '', lastTimestamp: new Date().toISOString(), unread: 0,
    }, ...prev])
    setActiveConvo(newConvoPhone)
    setShowNewConvo(false)
    setNewConvoPhone('')
    setNewConvoName('')
  }

  // Send email
  const handleSendEmail = async () => {
    if (!emailTo || !emailSubject) return
    setEmailSending(true)
    try {
      if (onSendEmail) {
        await onSendEmail({ to: emailTo, cc: emailCc, subject: emailSubject, html: `<pre style="font-family: -apple-system, sans-serif; white-space: pre-wrap;">${emailBody}</pre>`, text: emailBody })
      }
      setEmailSent(true)
      setTimeout(() => { setEmailSent(false); setShowCompose(false); setEmailTo(''); setEmailCc(''); setEmailSubject(''); setEmailBody('') }, 1500)
    } catch {}
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
        await onSendEmail({ to: email, subject: template.subject, html: `<pre style="font-family: -apple-system, sans-serif; white-space: pre-wrap;">${template.body}</pre>`, text: template.body })
        sent++
      } catch { failed++ }
    }
    setBulkResult({ sent, failed })
    setBulkSending(false)
    setTimeout(() => setBulkResult(null), 3000)
  }

  const formatDuration = (s: number) => { const m = Math.floor(s / 60); const sec = s % 60; return `${m}:${sec.toString().padStart(2, '0')}` }
  const formatTime = (ts: string) => new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  const formatDate = (ts: string) => new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  const TABS: { id: Tab; label: string; icon: any; badge?: number }[] = [
    { id: 'calls', label: 'Calls', icon: Phone },
    { id: 'messages', label: 'Messages', icon: MessageCircle },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'templates', label: 'Templates', icon: FileText },
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

  const activeConversation = conversations.find(c => c.contactPhone === activeConvo)

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
          {tab === 'messages' && (
            <button onClick={() => setShowNewConvo(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#007AFF] text-white rounded-full text-xs font-medium hover:bg-[#0066d6] transition-colors">
              <Plus className="w-3.5 h-3.5" /> New
            </button>
          )}
          {tab === 'calls' && (
            <button onClick={() => setShowNewCall(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#34C759] text-white rounded-full text-xs font-medium hover:bg-[#2db84e] transition-colors">
              <Phone className="w-3.5 h-3.5" /> Log Call
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
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">

        {/* ===== CALLS TAB ===== */}
        {tab === 'calls' && (
          <div className="flex-1 overflow-y-auto">
            {callLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="w-14 h-14 rounded-full bg-[#34C759]/10 flex items-center justify-center mb-3">
                  <Phone className="w-7 h-7 text-[#34C759]" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">No Call History</h3>
                <p className="text-xs text-gray-500 max-w-xs">Log calls to keep track of conversations with clients and team members.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-[#222]">
                {callLogs.map(call => (
                  <div key={call.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      call.type === 'missed' ? 'bg-red-50 dark:bg-red-900/20' :
                      call.type === 'incoming' ? 'bg-blue-50 dark:bg-blue-900/20' :
                      'bg-green-50 dark:bg-green-900/20'
                    }`}>
                      {call.type === 'missed' ? <PhoneMissed className="w-4 h-4 text-red-500" /> :
                       call.type === 'incoming' ? <PhoneIncoming className="w-4 h-4 text-blue-500" /> :
                       <PhoneOutgoing className="w-4 h-4 text-green-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${call.type === 'missed' ? 'text-red-600' : 'text-gray-900 dark:text-gray-100'}`}>{call.contactName}</p>
                      <p className="text-[10px] text-gray-400">{call.contactPhone}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[11px] text-gray-500">{formatTime(call.timestamp)}</p>
                      {call.duration > 0 && <p className="text-[10px] text-gray-400">{formatDuration(call.duration)}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== MESSAGES TAB (iMessage style) ===== */}
        {tab === 'messages' && (
          <>
            {/* Conversation list */}
            {!activeConvo ? (
              <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center px-4">
                    <div className="w-14 h-14 rounded-full bg-[#007AFF]/10 flex items-center justify-center mb-3">
                      <MessageCircle className="w-7 h-7 text-[#007AFF]" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">No Messages</h3>
                    <p className="text-xs text-gray-500 max-w-xs">Start a conversation with a client or team member.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-[#222]">
                    {conversations.map(convo => (
                      <button key={convo.contactPhone} onClick={() => setActiveConvo(convo.contactPhone)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors text-left">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#007AFF] to-[#5856D6] flex items-center justify-center shrink-0">
                          <span className="text-white text-sm font-bold">{convo.contactName[0]?.toUpperCase()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{convo.contactName}</span>
                            <span className="text-[10px] text-gray-400">{formatTime(convo.lastTimestamp)}</span>
                          </div>
                          <p className="text-xs text-gray-500 truncate">{convo.lastMessage || 'No messages yet'}</p>
                        </div>
                        {convo.unread > 0 && (
                          <div className="w-5 h-5 rounded-full bg-[#007AFF] flex items-center justify-center">
                            <span className="text-white text-[9px] font-bold">{convo.unread}</span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Active conversation — iMessage blue bubbles */
              <div className="flex-1 flex flex-col">
                {/* Chat header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-[#222] bg-[#f5f5f7]/80 dark:bg-[#1a1a1a]/80 backdrop-blur-xl">
                  <button onClick={() => setActiveConvo(null)} className="text-[#007AFF]">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#007AFF] to-[#5856D6] flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{activeConversation?.contactName[0]?.toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{activeConversation?.contactName}</p>
                    <p className="text-[10px] text-gray-400">{activeConversation?.contactPhone}</p>
                  </div>
                </div>

                {/* Messages area */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 bg-[#f5f5f7] dark:bg-[#111]">
                  {activeConversation?.messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.direction === 'sent' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] px-3.5 py-2 rounded-2xl ${
                        msg.direction === 'sent'
                          ? 'bg-[#007AFF] text-white rounded-br-md'
                          : 'bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-gray-100 rounded-bl-md shadow-sm'
                      }`}>
                        <p className="text-[13px] leading-relaxed">{msg.content}</p>
                        <p className={`text-[9px] mt-1 ${msg.direction === 'sent' ? 'text-white/60' : 'text-gray-400'}`}>
                          {formatTime(msg.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input bar */}
                <div className="px-4 py-3 bg-white dark:bg-[#1a1a1a] border-t border-gray-100 dark:border-[#222]">
                  <div className="flex items-center gap-2">
                    <input type="text" value={newMessageText}
                      onChange={e => setNewMessageText(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && sendMessage()}
                      placeholder="iMessage"
                      className="flex-1 px-4 py-2 bg-[#f5f5f7] dark:bg-[#222] rounded-full text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30" />
                    <button onClick={sendMessage} disabled={!newMessageText.trim() || sendingMsg}
                      className="w-8 h-8 rounded-full bg-[#007AFF] flex items-center justify-center disabled:opacity-30 transition-opacity">
                      {sendingMsg ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
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

      {/* New Conversation Modal */}
      {showNewConvo && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowNewConvo(false)} />
          <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-gray-200 dark:border-[#2a2a2a] relative">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">New Conversation</h3>
            <div className="space-y-3">
              <input type="text" value={newConvoName} onChange={e => setNewConvoName(e.target.value)} placeholder="Contact name"
                className="w-full px-3 py-2 bg-[#f5f5f7] dark:bg-[#222] rounded-lg text-sm" />
              <input type="tel" value={newConvoPhone} onChange={e => setNewConvoPhone(e.target.value)} placeholder="Phone number"
                className="w-full px-3 py-2 bg-[#f5f5f7] dark:bg-[#222] rounded-lg text-sm" />
              {/* Quick select from contacts */}
              {allContacts.filter(c => c.phone).length > 0 && (
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {allContacts.filter(c => c.phone).map((c, i) => (
                    <button key={i} onClick={() => { setNewConvoName(c.name); setNewConvoPhone(c.phone || '') }}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-[#222] text-left">
                      <span className="text-xs font-medium text-gray-900 dark:text-gray-100">{c.name}</span>
                      <span className="text-[10px] text-gray-400">{c.phone}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowNewConvo(false)} className="flex-1 px-4 py-2 text-sm border border-gray-200 dark:border-[#333] rounded-lg">Cancel</button>
              <button onClick={startConvo} disabled={!newConvoPhone}
                className="flex-1 px-4 py-2 text-sm text-white bg-[#007AFF] rounded-lg font-medium disabled:opacity-50">Start</button>
            </div>
          </div>
        </div>
      )}

      {/* Log Call Modal */}
      {showNewCall && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowNewCall(false)} />
          <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-gray-200 dark:border-[#2a2a2a] relative">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Log Call</h3>
            <CallLogForm contacts={allContacts} onLog={logCall} onCancel={() => setShowNewCall(false)} />
          </div>
        </div>
      )}
    </div>
  )
}

// Extracted call log form
function CallLogForm({ contacts, onLog, onCancel }: {
  contacts: { name: string; phone?: string }[]
  onLog: (type: CallLog['type'], name: string, phone: string, duration: number) => void
  onCancel: () => void
}) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [type, setType] = useState<CallLog['type']>('outgoing')
  const [mins, setMins] = useState('')
  const [secs, setSecs] = useState('')

  return (
    <div className="space-y-3">
      <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Contact name"
        className="w-full px-3 py-2 bg-[#f5f5f7] dark:bg-[#222] rounded-lg text-sm" />
      <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone number"
        className="w-full px-3 py-2 bg-[#f5f5f7] dark:bg-[#222] rounded-lg text-sm" />
      <div className="flex gap-2">
        {(['outgoing', 'incoming', 'missed'] as const).map(t => (
          <button key={t} onClick={() => setType(t)}
            className={`flex-1 py-2 rounded-lg text-[10px] font-medium capitalize transition-colors ${
              type === t ? (t === 'missed' ? 'bg-red-500 text-white' : t === 'incoming' ? 'bg-blue-500 text-white' : 'bg-green-500 text-white')
              : 'bg-gray-100 dark:bg-[#222] text-gray-600'
            }`}>{t}</button>
        ))}
      </div>
      <div className="flex gap-2">
        <input type="number" value={mins} onChange={e => setMins(e.target.value)} placeholder="Min" min="0"
          className="flex-1 px-3 py-2 bg-[#f5f5f7] dark:bg-[#222] rounded-lg text-sm text-center" />
        <span className="text-gray-400 self-center">:</span>
        <input type="number" value={secs} onChange={e => setSecs(e.target.value)} placeholder="Sec" min="0" max="59"
          className="flex-1 px-3 py-2 bg-[#f5f5f7] dark:bg-[#222] rounded-lg text-sm text-center" />
      </div>
      {contacts.filter(c => c.phone).length > 0 && (
        <div className="max-h-24 overflow-y-auto space-y-1 border-t border-gray-100 dark:border-[#222] pt-2">
          {contacts.filter(c => c.phone).slice(0, 5).map((c, i) => (
            <button key={i} onClick={() => { setName(c.name); setPhone(c.phone || '') }}
              className="w-full flex justify-between px-2 py-1 rounded text-[10px] hover:bg-gray-50 dark:hover:bg-[#222]">
              <span className="font-medium text-gray-700 dark:text-gray-300">{c.name}</span>
              <span className="text-gray-400">{c.phone}</span>
            </button>
          ))}
        </div>
      )}
      <div className="flex gap-3 pt-1">
        <button onClick={onCancel} className="flex-1 px-4 py-2 text-sm border border-gray-200 dark:border-[#333] rounded-lg">Cancel</button>
        <button onClick={() => { if (name && phone) onLog(type, name, phone, (parseInt(mins || '0') * 60) + parseInt(secs || '0')) }}
          disabled={!name || !phone}
          className="flex-1 px-4 py-2 text-sm text-white bg-[#34C759] rounded-lg font-medium disabled:opacity-50">Log Call</button>
      </div>
    </div>
  )
}
