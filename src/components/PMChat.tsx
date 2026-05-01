'use client'

import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { X, Send, Sparkles, Loader2 } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  toolsUsed?: string[]
}

const TOOL_LABELS: Record<string, string> = {
  list_projects: 'Checking your projects…',
  get_project_details: 'Loading project details…',
  list_documents: 'Pulling up documents…',
  get_financial_summary: 'Running financial summary…',
  list_tasks: 'Checking tasks…',
}

const SUGGESTIONS = [
  'What projects are currently active?',
  'Do I have any overdue invoices?',
  "What's my total outstanding revenue?",
  'Which jobs are behind schedule?',
  'Show me a financial summary',
]

// Minimal markdown renderer — bold, bullets, line breaks
function MdText({ text }: { text: string }) {
  return (
    <div className="space-y-0.5 leading-relaxed">
      {text.split('\n').map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-2" />
        const isBullet = /^[-*•]\s/.test(line)
        const clean = line.replace(/^[-*•]\s+/, '')
        const parts = clean.split(/(\*\*[^*]+\*\*)/g)
        const rendered = parts.map((p, j) =>
          p.startsWith('**') && p.endsWith('**')
            ? <strong key={j}>{p.slice(2, -2)}</strong>
            : <span key={j}>{p}</span>
        )
        return (
          <div key={i} className={isBullet ? 'flex gap-2 items-start' : ''}>
            {isBullet && <span className="shrink-0 mt-[3px] text-[10px] opacity-50">●</span>}
            <span>{rendered}</span>
          </div>
        )
      })}
    </div>
  )
}

export default function PMChat() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streaming, setStreaming] = useState('')
  const [toolActivity, setToolActivity] = useState<string | null>(null)

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const inputHeightRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streaming, toolActivity])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150)
  }, [open])

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return

    const next: Message[] = [...messages, { role: 'user', content: text }]
    setMessages(next)
    setInput('')
    setLoading(true)
    setStreaming('')
    setToolActivity(null)

    const toolsThisRound: string[] = []
    let assembled = ''

    try {
      const res = await fetch('/api/pm/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: next.map(m => ({ role: m.role, content: m.content })),
        }),
      })

      if (!res.ok || !res.body) throw new Error('Request failed')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const lines = decoder.decode(value, { stream: true }).split('\n')
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const ev = JSON.parse(line.slice(6))
            if (ev.type === 'text') {
              assembled += ev.text
              setStreaming(assembled)
              setToolActivity(null)
            } else if (ev.type === 'tool_start') {
              setToolActivity(TOOL_LABELS[ev.name] ?? 'Working…')
              if (!toolsThisRound.includes(ev.name)) toolsThisRound.push(ev.name)
            } else if (ev.type === 'done') {
              setToolActivity(null)
            }
          } catch { /* partial line */ }
        }
      }

      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: assembled, toolsUsed: toolsThisRound.length ? toolsThisRound : undefined },
      ])
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' },
      ])
    } finally {
      setStreaming('')
      setLoading(false)
      setToolActivity(null)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const autosize = (el: HTMLTextAreaElement | null) => {
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setOpen(v => !v)}
        title="AI Project Manager"
        className={`fixed bottom-[72px] right-4 z-[9998] w-10 h-10 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 ${open ? 'bg-gray-800 dark:bg-white' : 'bg-gradient-to-br from-blue-500 to-violet-600'}`}
      >
        {open
          ? <X className="w-4 h-4 text-white dark:text-gray-900" />
          : <Sparkles className="w-4 h-4 text-white" />
        }
      </button>

      {/* Slide-in panel */}
      <div
        className={`fixed top-0 right-0 h-full z-[9997] flex flex-col bg-white dark:bg-[#111] border-l border-gray-200 dark:border-[#222] shadow-2xl transition-transform duration-300 ease-out w-[360px] sm:w-[400px] ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-[#222] flex-shrink-0 bg-gray-50 dark:bg-[#171717]">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-sm flex-shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">PM Assistant</div>
            <div className="text-[10px] text-gray-400 truncate">Full context of your projects & finances</div>
          </div>
          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              className="text-[10px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-[#222]"
            >
              Clear
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.length === 0 && !loading && (
            <div className="space-y-4 pt-2">
              <p className="text-xs text-gray-400 text-center leading-relaxed">
                Ask me anything about your projects,<br />finances, clients, or team.
              </p>
              <div className="space-y-2">
                {SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => { setInput(s); setTimeout(() => inputRef.current?.focus(), 50) }}
                    className="w-full text-left text-xs text-gray-600 dark:text-gray-300 px-3 py-2.5 bg-gray-50 dark:bg-[#1a1a1a] rounded-xl hover:bg-gray-100 dark:hover:bg-[#222] transition-colors border border-transparent hover:border-gray-200 dark:hover:border-[#333]"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center flex-shrink-0 mt-1 mr-2">
                  <Sparkles className="w-2.5 h-2.5 text-white" />
                </div>
              )}
              <div className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : 'bg-gray-100 dark:bg-[#1e1e1e] text-gray-800 dark:text-gray-200 rounded-bl-sm'
              }`}>
                <MdText text={msg.content} />
                {msg.toolsUsed && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {msg.toolsUsed.map(t => (
                      <span key={t} className="text-[9px] px-1.5 py-0.5 rounded-full bg-black/[0.07] dark:bg-white/[0.07] text-gray-500 dark:text-gray-400">
                        {t.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Streaming response */}
          {streaming && (
            <div className="flex justify-start">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center flex-shrink-0 mt-1 mr-2">
                <Sparkles className="w-2.5 h-2.5 text-white" />
              </div>
              <div className="max-w-[82%] rounded-2xl rounded-bl-sm px-3.5 py-2.5 text-sm bg-gray-100 dark:bg-[#1e1e1e] text-gray-800 dark:text-gray-200">
                <MdText text={streaming} />
                <span className="inline-block w-1 h-3.5 bg-blue-500 ml-0.5 animate-pulse rounded-sm align-middle" />
              </div>
            </div>
          )}

          {/* Tool activity indicator */}
          {toolActivity && !streaming && (
            <div className="flex justify-start pl-7">
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-[#1a1a1a] rounded-xl border border-gray-100 dark:border-[#2a2a2a]">
                <Loader2 className="w-3 h-3 text-blue-500 animate-spin flex-shrink-0" />
                <span className="text-xs text-gray-500 dark:text-gray-400">{toolActivity}</span>
              </div>
            </div>
          )}

          {/* Initial thinking dots */}
          {loading && !streaming && !toolActivity && (
            <div className="flex justify-start pl-7">
              <div className="flex items-center gap-1 px-3 py-2.5 bg-gray-100 dark:bg-[#1e1e1e] rounded-2xl rounded-bl-sm">
                {[0, 150, 300].map(d => (
                  <div key={d} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="flex-shrink-0 p-3 border-t border-gray-100 dark:border-[#222] bg-white dark:bg-[#111]">
          <div className="flex items-end gap-2 bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-2xl px-3 py-2 focus-within:border-blue-400 dark:focus-within:border-blue-700 transition-colors">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => { setInput(e.target.value); autosize(e.target) }}
              onKeyDown={onKey}
              placeholder="Ask about projects, invoices, team…"
              rows={1}
              style={{ height: '24px' }}
              className="flex-1 bg-transparent text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none resize-none leading-6 max-h-[120px] overflow-y-auto"
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mb-0.5 transition-all bg-blue-600 hover:bg-blue-700 disabled:opacity-30 disabled:cursor-not-allowed text-white"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[9px] text-gray-300 dark:text-gray-700 text-center mt-1.5">
            Phase 1 · Read-only · Document creation coming in Phase 2
          </p>
        </div>
      </div>
    </>
  )
}
