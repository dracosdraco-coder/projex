'use client'

import { useState, useMemo } from 'react'
import { Mail, Send, Plus, Search, Inbox, PenSquare, ExternalLink, Trash2, Clock, User, X, Star, Archive, Loader2 } from 'lucide-react'

interface EmailThread {
  id: string
  to: string
  cc?: string
  subject: string
  body: string
  status: 'draft' | 'sent' | 'sending' | 'failed'
  provider?: string
  createdAt: string
  starred?: boolean
}

interface Contact { id?: string; name: string; email?: string; phone?: string; company?: string; type?: string }

interface CommunicationContentProps {
  contacts?: Contact[]
  teamMembers?: { id: string; name: string; email?: string }[]
}

export default function CommunicationContent({ contacts = [], teamMembers = [] }: CommunicationContentProps) {
  const [tab, setTab] = useState<'inbox' | 'compose'>('inbox')
  const [threads, setThreads] = useState<EmailThread[]>([])
  const [selectedThread, setSelectedThread] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [to, setTo] = useState('')
  const [cc, setCc] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [showContacts, setShowContacts] = useState(false)
  const [filter, setFilter] = useState<'all' | 'sent' | 'draft' | 'starred'>('all')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')

  // All people with emails
  const allPeople = useMemo(() => {
    const list: { name: string; email: string; type: string }[] = []
    contacts.forEach(c => { if (c.email) list.push({ name: c.name, email: c.email, type: c.type || 'Contact' }) })
    teamMembers.forEach(m => { if (m.email) list.push({ name: m.name, email: m.email, type: 'Team' }) })
    return list
  }, [contacts, teamMembers])

  const filteredPeople = showContacts && to
    ? allPeople.filter(p => p.name.toLowerCase().includes(to.toLowerCase()) || p.email.toLowerCase().includes(to.toLowerCase()))
    : allPeople

  const filteredThreads = useMemo(() => {
    let list = threads
    if (filter === 'sent') list = list.filter(t => t.status === 'sent')
    if (filter === 'draft') list = list.filter(t => t.status === 'draft')
    if (filter === 'starred') list = list.filter(t => t.starred)
    if (search) list = list.filter(t => t.subject.toLowerCase().includes(search.toLowerCase()) || t.to.toLowerCase().includes(search.toLowerCase()))
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [threads, filter, search])

  const saveThread = (status: 'draft' | 'sent', provider?: string) => {
    const thread: EmailThread = {
      id: `email-${Date.now()}`, to, subject, body, status, provider,
      createdAt: new Date().toISOString(),
    }
    setThreads(prev => [thread, ...prev])
    return thread
  }

  const sendVia = (provider: 'gmail' | 'outlook' | 'mailto') => {
    const thread = saveThread('sent', provider)

    let url = ''
    if (provider === 'gmail') {
      url = `https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    } else if (provider === 'outlook') {
      url = `https://outlook.live.com/mail/0/deeplink/compose?to=${encodeURIComponent(to)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    } else {
      url = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    }
    window.open(url, '_blank')
    setTo(''); setCc(''); setSubject(''); setBody(''); setTab('inbox')
  }

  const sendDirect = async () => {
    if (!to.trim() || !subject.trim()) return
    setSending(true)
    setSendError('')

    const threadId = `email-${Date.now()}`
    const thread: EmailThread = {
      id: threadId, to, cc, subject, body, status: 'sending', provider: 'projex',
      createdAt: new Date().toISOString(),
    }
    setThreads(prev => [thread, ...prev])

    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: to.trim(),
          cc: cc.trim() || undefined,
          subject: subject.trim(),
          text: body,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="color: #333; font-size: 14px; line-height: 1.7; white-space: pre-wrap;">${body.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
              <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0 16px;" />
              <p style="font-size: 11px; color: #999;">Sent via Projex — projex.live</p>
            </div>
          `,
        }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Failed to send')
      }

      setThreads(prev => prev.map(t => t.id === threadId ? { ...t, status: 'sent' } : t))
      setTo(''); setCc(''); setSubject(''); setBody(''); setTab('inbox')
    } catch (err: any) {
      setSendError(err.message || 'Failed to send email')
      setThreads(prev => prev.map(t => t.id === threadId ? { ...t, status: 'failed' } : t))
    } finally {
      setSending(false)
    }
  }

  const saveDraft = () => {
    saveThread('draft')
    setTo(''); setCc(''); setSubject(''); setBody(''); setTab('inbox')
  }

  const loadDraft = (thread: EmailThread) => {
    setTo(thread.to); setSubject(thread.subject); setBody(thread.body); setTab('compose')
    setThreads(prev => prev.filter(t => t.id !== thread.id))
  }

  const toggleStar = (id: string) => {
    setThreads(prev => prev.map(t => t.id === id ? { ...t, starred: !t.starred } : t))
  }

  const deleteThread = (id: string) => {
    setThreads(prev => prev.filter(t => t.id !== id))
    if (selectedThread === id) setSelectedThread(null)
  }

  const formatTime = (date: string) => {
    const d = new Date(date)
    const now = new Date()
    if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const selected = threads.find(t => t.id === selectedThread)

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-[#111]">
      {/* Header */}
      <div className="bg-white dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-[#2a2a2a] px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Communication</h2>
          </div>
          <div className="flex gap-2">
            <button onClick={() => window.open('https://mail.google.com', '_blank')}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-[#252525] rounded-lg hover:bg-gray-200 flex items-center gap-1.5">
              <ExternalLink className="w-3 h-3" /> Gmail
            </button>
            <button onClick={() => window.open('https://outlook.live.com/mail/', '_blank')}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-[#252525] rounded-lg hover:bg-gray-200 flex items-center gap-1.5">
              <ExternalLink className="w-3 h-3" /> Outlook
            </button>
          </div>
        </div>

        <div className="flex gap-1 bg-gray-100 dark:bg-[#252525] rounded-lg p-0.5">
          <button onClick={() => setTab('inbox')}
            className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
              tab === 'inbox' ? 'bg-white dark:bg-[#333] text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <Inbox className="w-3.5 h-3.5" /> Inbox <span className="text-[10px] opacity-60">({threads.length})</span>
          </button>
          <button onClick={() => setTab('compose')}
            className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
              tab === 'compose' ? 'bg-white dark:bg-[#333] text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <PenSquare className="w-3.5 h-3.5" /> Compose
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex">
        {tab === 'inbox' ? (
          threads.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <Mail className="w-14 h-14 mb-3 opacity-20" />
              <p className="text-sm font-medium">No emails yet</p>
              <p className="text-xs mt-1 mb-4">Compose an email to get started</p>
              <button onClick={() => setTab('compose')} className="px-4 py-2 text-sm bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg flex items-center gap-1.5">
                <PenSquare className="w-3.5 h-3.5" /> Compose
              </button>
            </div>
          ) : (
            <>
              {/* Thread List */}
              <div className={`${selected ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 border-r border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a]`}>
                <div className="p-3 border-b border-gray-100 dark:border-[#2a2a2a] space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input type="text" placeholder="Search emails..." value={search} onChange={e => setSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-gray-50 dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-lg text-xs" />
                  </div>
                  <div className="flex gap-1">
                    {(['all', 'sent', 'draft', 'starred'] as const).map(f => (
                      <button key={f} onClick={() => setFilter(f)}
                        className={`px-2 py-1 text-[10px] font-medium rounded-md capitalize ${filter === f ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-[#252525]'}`}>
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {filteredThreads.map(t => (
                    <button key={t.id} onClick={() => setSelectedThread(t.id)}
                      className={`w-full text-left px-4 py-3 border-b border-gray-100 dark:border-[#2a2a2a]/50 hover:bg-gray-50 dark:hover:bg-[#252525]/50 transition-colors ${selectedThread === t.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                      <div className="flex items-start justify-between mb-0.5">
                        <span className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate flex-1">{t.to}</span>
                        <span className="text-[10px] text-gray-400 ml-2">{formatTime(t.createdAt)}</span>
                      </div>
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{t.subject || '(no subject)'}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-1.5 py-0.5 text-[9px] rounded font-medium ${
                          t.status === 'sent' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 
                          t.status === 'sending' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                          t.status === 'failed' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                          'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                          {t.status}
                        </span>
                        {t.provider && <span className="text-[9px] text-gray-400">via {t.provider}</span>}
                        {t.starred && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Thread Detail */}
              {selected ? (
                <div className="flex-1 flex flex-col bg-white dark:bg-[#1a1a1a]">
                  <div className="p-4 border-b border-gray-200 dark:border-[#2a2a2a] flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">{selected.subject || '(no subject)'}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">To: {selected.to} · {formatTime(selected.createdAt)}</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => toggleStar(selected.id)} className="p-1.5 text-gray-400 hover:text-amber-500 rounded-lg">
                        <Star className={`w-4 h-4 ${selected.starred ? 'text-amber-400 fill-amber-400' : ''}`} />
                      </button>
                      {selected.status === 'draft' && (
                        <button onClick={() => loadDraft(selected)} className="p-1.5 text-gray-400 hover:text-blue-500 rounded-lg"><PenSquare className="w-4 h-4" /></button>
                      )}
                      <button onClick={() => deleteThread(selected.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6">
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{selected.body}</p>
                  </div>
                </div>
              ) : (
                <div className="hidden md:flex flex-1 items-center justify-center text-gray-400">
                  <div className="text-center"><Inbox className="w-12 h-12 mx-auto mb-3 opacity-20" /><p className="text-sm">Select an email</p></div>
                </div>
              )}
            </>
          )
        ) : (
          /* COMPOSE */
          <div className="flex-1 flex flex-col p-6 bg-white dark:bg-[#1a1a1a]">
            <div className="max-w-2xl w-full mx-auto flex-1 flex flex-col gap-3">
              {/* To field with contact dropdown */}
              <div className="relative">
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">To</label>
                <div className="flex items-center gap-2">
                  <input type="email" value={to} onChange={e => { setTo(e.target.value); setShowContacts(true) }}
                    onBlur={() => setTimeout(() => setShowContacts(false), 200)}
                    onFocus={() => setShowContacts(true)}
                    placeholder="recipient@example.com"
                    className="flex-1 px-3 py-2 bg-gray-50 dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
                {showContacts && filteredPeople.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-xl shadow-xl z-10 max-h-48 overflow-y-auto">
                    {filteredPeople.slice(0, 8).map((p, i) => (
                      <button key={i} onMouseDown={e => { e.preventDefault(); setTo(p.email); setShowContacts(false) }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] flex items-center gap-3 transition-colors">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white text-[10px] font-bold">{p.name[0]}</div>
                        <div><p className="text-xs font-medium text-gray-900 dark:text-gray-100">{p.name}</p><p className="text-[10px] text-gray-500">{p.email} · {p.type}</p></div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Cc</label>
                <input type="email" value={cc} onChange={e => setCc(e.target.value)} placeholder="cc@example.com"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Subject</label>
                <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Email subject"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>

              <div className="flex-1 flex flex-col">
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Message</label>
                <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Write your message..."
                  className="flex-1 px-3 py-2 bg-gray-50 dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 min-h-[150px]" />
              </div>

              <div className="flex flex-col gap-2 pt-2 border-t border-gray-100 dark:border-[#2a2a2a]">
                {sendError && (
                  <div className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg flex items-center justify-between">
                    {sendError}
                    <button onClick={() => setSendError('')} className="ml-2"><X className="w-3 h-3" /></button>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <button onClick={saveDraft} disabled={!to && !subject && !body}
                    className="px-3 py-2 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#222] rounded-lg transition-colors disabled:opacity-30">
                    Save Draft
                  </button>
                  <div className="flex gap-2">
                    <button onClick={sendDirect} disabled={!to.trim() || !subject.trim() || sending}
                      className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-medium rounded-lg hover:bg-gray-700 dark:hover:bg-gray-200 disabled:opacity-30 flex items-center gap-1.5">
                      {sending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />} {sending ? 'Sending...' : 'Send'}
                    </button>
                    <button onClick={() => sendVia('gmail')} disabled={!to.trim()}
                      className="px-3 py-2 bg-gray-100 dark:bg-[#222] text-gray-600 dark:text-gray-400 text-xs font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-[#333] disabled:opacity-30 flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" /> Gmail
                    </button>
                    <button onClick={() => sendVia('outlook')} disabled={!to.trim()}
                      className="px-3 py-2 bg-gray-100 dark:bg-[#222] text-gray-600 dark:text-gray-400 text-xs font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-[#333] disabled:opacity-30 flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" /> Outlook
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
