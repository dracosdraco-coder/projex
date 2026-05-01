'use client'

import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { X, Send, Sparkles, Loader2, CheckCircle, XCircle, FileText, FolderOpen, CheckSquare } from 'lucide-react'

// ── Types ───────────────────────────────────────────────────────────────────

interface ChatMessage {
  kind: 'message'
  role: 'user' | 'assistant'
  content: string
  toolsUsed?: string[]
}

interface ActionItem {
  kind: 'action'
  id: string
  actionType: 'create_document' | 'create_project' | 'create_task'
  summary: string
  data: any
  status: 'pending' | 'executing' | 'success' | 'cancelled' | 'error'
  resultLabel?: string
}

type ChatItem = ChatMessage | ActionItem

export interface PMChatProps {
  onCreateDocument?: (data: any) => Promise<any>
  onCreateProject?: (data: any) => Promise<any>
  onCreateTask?: (data: any) => Promise<any>
  onRefetch?: () => void
}

// ── Constants ───────────────────────────────────────────────────────────────

const TOOL_LABELS: Record<string, string> = {
  list_projects: 'Checking your projects…',
  get_project_details: 'Loading project details…',
  list_documents: 'Pulling up documents…',
  get_financial_summary: 'Running financial summary…',
  list_tasks: 'Checking tasks…',
  propose_create_document: 'Preparing document…',
  propose_create_project: 'Building project…',
  propose_create_task: 'Setting up task…',
}

const SUGGESTIONS = [
  'What projects are currently active?',
  'Do I have any overdue invoices?',
  'Create an invoice for [project name]',
  'Add a new project for [client name]',
  'Show me a financial summary',
]

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0)

// ── Markdown renderer ────────────────────────────────────────────────────────

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
            {isBullet && <span className="shrink-0 mt-[3px] text-[10px] opacity-40">●</span>}
            <span>{rendered}</span>
          </div>
        )
      })}
    </div>
  )
}

// ── Action card ──────────────────────────────────────────────────────────────

function ActionCard({ item, onConfirm, onCancel }: { item: ActionItem; onConfirm: () => void; onCancel: () => void }) {
  const { actionType, data, status, resultLabel } = item

  const icon = actionType === 'create_document'
    ? <FileText className="w-3.5 h-3.5" />
    : actionType === 'create_project'
      ? <FolderOpen className="w-3.5 h-3.5" />
      : <CheckSquare className="w-3.5 h-3.5" />

  const typeLabel = actionType === 'create_document'
    ? (data.type as string).replace('-', ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
    : actionType === 'create_project' ? 'New Project' : 'New Task'

  const confirmLabel = actionType === 'create_document'
    ? `Create ${typeLabel}`
    : actionType === 'create_project' ? 'Create Project' : 'Add Task'

  if (status === 'success') {
    return (
      <div className="flex items-center gap-2 px-3 py-2.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/40 rounded-xl">
        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
        <span className="text-xs text-green-700 dark:text-green-400 font-medium">{resultLabel || 'Created successfully'}</span>
      </div>
    )
  }

  if (status === 'cancelled') {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-xl opacity-60">
        <XCircle className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
        <span className="text-xs text-gray-400">Cancelled</span>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-xl">
        <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
        <span className="text-xs text-red-600 dark:text-red-400">Failed to create — try again</span>
      </div>
    )
  }

  return (
    <div className="border border-blue-200 dark:border-blue-900/60 rounded-xl overflow-hidden bg-white dark:bg-[#111] shadow-sm">
      {/* Card header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-900/40">
        <div className="text-blue-600 dark:text-blue-400">{icon}</div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">{typeLabel}</span>
      </div>

      {/* Card body */}
      <div className="px-3 py-2.5 space-y-2">
        {actionType === 'create_document' && (
          <>
            {data.clientName && (
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Client</span>
                <span className="font-medium text-gray-800 dark:text-gray-200">{data.clientName}</span>
              </div>
            )}
            {/* Line items preview */}
            <div className="space-y-1">
              {(data.lineItems as any[]).slice(0, 3).map((li: any, i: number) => (
                <div key={i} className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                  <span className="truncate mr-2 flex-1">{li.description}</span>
                  <span className="tabular-nums shrink-0">{li.quantity} × {fmt(li.price)}</span>
                </div>
              ))}
              {data.lineItems.length > 3 && (
                <div className="text-[10px] text-gray-400">+{data.lineItems.length - 3} more item{data.lineItems.length - 3 !== 1 ? 's' : ''}</div>
              )}
            </div>
            {/* Totals */}
            <div className="pt-1 border-t border-gray-100 dark:border-[#222] space-y-0.5">
              {data.taxRate > 0 && (
                <div className="flex justify-between text-[10px] text-gray-400">
                  <span>Tax ({data.taxRate}%)</span>
                  <span>{fmt(data.taxTotal)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold">
                <span className="text-gray-700 dark:text-gray-300">Total</span>
                <span className="text-blue-600 dark:text-blue-400">{fmt(data.total)}</span>
              </div>
            </div>
          </>
        )}

        {actionType === 'create_project' && (
          <div className="space-y-1">
            <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">{data.name}</div>
            {data.client && (
              <div className="text-xs text-gray-500">Client: {data.client}</div>
            )}
            <div className="flex gap-3 text-xs text-gray-400 flex-wrap">
              {data.contractAmount > 0 && <span>Contract: {fmt(data.contractAmount)}</span>}
              {data.dueDate && <span>Due: {data.dueDate}</span>}
              {data.address && <span className="truncate">{data.address}</span>}
            </div>
          </div>
        )}

        {actionType === 'create_task' && (
          <div className="space-y-1">
            <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">{data.title}</div>
            <div className="flex gap-3 text-xs text-gray-400 flex-wrap">
              {data.priority && (
                <span className={`font-medium ${
                  data.priority === 'urgent' ? 'text-red-500' :
                  data.priority === 'high' ? 'text-orange-500' :
                  data.priority === 'medium' ? 'text-yellow-600' : 'text-gray-400'
                }`}>{data.priority}</span>
              )}
              {data.dueDate && <span>Due: {data.dueDate}</span>}
              {data.estimatedHours > 0 && <span>{data.estimatedHours}h est.</span>}
            </div>
          </div>
        )}
      </div>

      {/* Confirm / cancel */}
      <div className="flex gap-2 px-3 py-2.5 border-t border-gray-100 dark:border-[#222] bg-gray-50 dark:bg-[#171717]">
        <button
          onClick={onConfirm}
          disabled={status === 'executing'}
          className="flex-1 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 flex items-center justify-center gap-1.5 transition-colors"
        >
          {status === 'executing'
            ? <><Loader2 className="w-3 h-3 animate-spin" /> Creating…</>
            : confirmLabel
          }
        </button>
        <button
          onClick={onCancel}
          disabled={status === 'executing'}
          className="px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-[#222] transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────

export default function PMChat({ onCreateDocument, onCreateProject, onCreateTask, onRefetch }: PMChatProps) {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<ChatItem[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streaming, setStreaming] = useState('')
  const [toolActivity, setToolActivity] = useState<string | null>(null)

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  // Collect pending actions during a stream
  const pendingActionsRef = useRef<ActionItem[]>([])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [items, streaming, toolActivity])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150)
  }, [open])

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return

    const userItem: ChatMessage = { kind: 'message', role: 'user', content: text }
    const nextItems = [...items, userItem]
    setItems(nextItems)
    setInput('')
    setLoading(true)
    setStreaming('')
    setToolActivity(null)
    pendingActionsRef.current = []

    const toolsThisRound: string[] = []
    let assembled = ''

    // Build message history (only ChatMessage items, not action cards)
    const history = nextItems
      .filter((it): it is ChatMessage => it.kind === 'message')
      .map(m => ({ role: m.role, content: m.content }))

    try {
      const res = await fetch('/api/pm/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
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
            } else if (ev.type === 'action') {
              // Store action to attach after stream completes
              pendingActionsRef.current.push({
                kind: 'action',
                id: ev.id,
                actionType: ev.actionType,
                summary: ev.summary,
                data: ev.data,
                status: 'pending',
              })
            } else if (ev.type === 'done') {
              setToolActivity(null)
            }
          } catch { /* partial line */ }
        }
      }

      // Commit assistant message + any action cards
      const toAdd: ChatItem[] = []
      if (assembled) {
        toAdd.push({ kind: 'message', role: 'assistant', content: assembled, toolsUsed: toolsThisRound.length ? toolsThisRound : undefined })
      }
      toAdd.push(...pendingActionsRef.current)
      setItems(prev => [...prev, ...toAdd])
    } catch {
      setItems(prev => [...prev, { kind: 'message', role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }])
    } finally {
      setStreaming('')
      setLoading(false)
      setToolActivity(null)
      pendingActionsRef.current = []
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  const confirmAction = async (actionId: string) => {
    setItems(prev => prev.map(it => it.kind === 'action' && it.id === actionId ? { ...it, status: 'executing' } : it))
    const action = items.find((it): it is ActionItem => it.kind === 'action' && it.id === actionId)
    if (!action) return

    try {
      let result: any = null
      if (action.actionType === 'create_document' && onCreateDocument) {
        result = await onCreateDocument(action.data)
      } else if (action.actionType === 'create_project' && onCreateProject) {
        result = await onCreateProject(action.data)
      } else if (action.actionType === 'create_task' && onCreateTask) {
        result = await onCreateTask(action.data)
      }
      onRefetch?.()

      const label = action.actionType === 'create_document'
        ? `${action.data.type.replace('-', ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())} created${result?.documentNumber ? ` · #${result.documentNumber}` : ''}`
        : action.actionType === 'create_project'
          ? `Project "${action.data.name}" created`
          : `Task "${action.data.title}" added`

      setItems(prev => prev.map(it =>
        it.kind === 'action' && it.id === actionId ? { ...it, status: 'success', resultLabel: label } : it
      ))
    } catch {
      setItems(prev => prev.map(it =>
        it.kind === 'action' && it.id === actionId ? { ...it, status: 'error' } : it
      ))
    }
  }

  const cancelAction = (actionId: string) => {
    setItems(prev => prev.map(it =>
      it.kind === 'action' && it.id === actionId ? { ...it, status: 'cancelled' } : it
    ))
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
      {/* Floating trigger */}
      <button
        onClick={() => setOpen(v => !v)}
        title="AI Project Manager"
        className={`fixed bottom-[72px] right-4 z-[9998] w-10 h-10 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 ${open ? 'bg-gray-800 dark:bg-white' : 'bg-gradient-to-br from-blue-500 to-violet-600'}`}
      >
        {open
          ? <X className="w-4 h-4 text-white dark:text-gray-900" />
          : <Sparkles className="w-4 h-4 text-white" />}
      </button>

      {/* Panel */}
      <div className={`fixed top-0 right-0 h-full z-[9997] flex flex-col bg-white dark:bg-[#111] border-l border-gray-200 dark:border-[#222] shadow-2xl transition-transform duration-300 ease-out w-[360px] sm:w-[400px] ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-[#222] flex-shrink-0 bg-gray-50 dark:bg-[#171717]">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-sm flex-shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">PM Assistant</div>
            <div className="text-[10px] text-gray-400">Ask questions · Create documents & projects</div>
          </div>
          {items.length > 0 && (
            <button onClick={() => setItems([])} className="text-[10px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-[#222]">
              Clear
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {items.length === 0 && !loading && (
            <div className="space-y-4 pt-2">
              <p className="text-xs text-gray-400 text-center leading-relaxed">
                Ask questions or create documents,<br />projects, and tasks from this chat.
              </p>
              <div className="space-y-2">
                {SUGGESTIONS.map(s => (
                  <button key={s} onClick={() => { setInput(s); setTimeout(() => inputRef.current?.focus(), 50) }}
                    className="w-full text-left text-xs text-gray-600 dark:text-gray-300 px-3 py-2.5 bg-gray-50 dark:bg-[#1a1a1a] rounded-xl hover:bg-gray-100 dark:hover:bg-[#222] transition-colors border border-transparent hover:border-gray-200 dark:hover:border-[#333]">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {items.map((item, i) => {
            if (item.kind === 'action') {
              return (
                <div key={item.id} className="pl-7">
                  <ActionCard
                    item={item}
                    onConfirm={() => confirmAction(item.id)}
                    onCancel={() => cancelAction(item.id)}
                  />
                </div>
              )
            }

            return (
              <div key={i} className={`flex ${item.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {item.role === 'assistant' && (
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center flex-shrink-0 mt-1 mr-2">
                    <Sparkles className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
                <div className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm ${
                  item.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-gray-100 dark:bg-[#1e1e1e] text-gray-800 dark:text-gray-200 rounded-bl-sm'
                }`}>
                  <MdText text={item.content} />
                  {item.toolsUsed && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {item.toolsUsed.map(t => (
                        <span key={t} className="text-[9px] px-1.5 py-0.5 rounded-full bg-black/[0.07] dark:bg-white/[0.07] text-gray-500 dark:text-gray-400">
                          {t.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {/* Streaming */}
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

          {toolActivity && !streaming && (
            <div className="flex justify-start pl-7">
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-[#1a1a1a] rounded-xl border border-gray-100 dark:border-[#2a2a2a]">
                <Loader2 className="w-3 h-3 text-blue-500 animate-spin flex-shrink-0" />
                <span className="text-xs text-gray-500 dark:text-gray-400">{toolActivity}</span>
              </div>
            </div>
          )}

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
              placeholder="Ask anything or say 'create an estimate for…'"
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
        </div>
      </div>
    </>
  )
}
