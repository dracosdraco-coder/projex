'use client'

import { useState, useRef, useEffect } from 'react'
import { Bell, Check, X, CheckCheck } from 'lucide-react'
import { Notification } from '@/hooks/useNotifications'

interface NotificationBellProps {
  notifications: Notification[]
  unreadCount: number
  onMarkRead: (id: string) => void
  onMarkAllRead: () => void
  onDismiss: (id: string) => void
  onClickNotification?: (n: Notification) => void
}

const TYPE_ICONS: Record<string, string> = {
  task_assigned: '📋', task_completed: '✅', document_approved: '📄',
  document_rejected: '❌', document_sent: '📨', payment_received: '💰',
  comment_added: '💬', mention: '@', deadline_approaching: '⏰',
  inspection_failed: '🔍', phase_completed: '🏁', message: '💬', system: '🔔',
}

export default function NotificationBell({
  notifications, unreadCount, onMarkRead, onMarkAllRead, onDismiss, onClickNotification,
}: NotificationBellProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'now'
    if (mins < 60) return `${mins}m`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h`
    return `${Math.floor(hrs / 24)}d`
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#333] transition-colors"
      >
        <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-[#1a1a1a] rounded-xl shadow-2xl border border-gray-200 dark:border-[#333] z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-[#2a2a2a]">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={onMarkAllRead} className="text-[10px] text-blue-600 hover:text-blue-700 flex items-center gap-1">
                <CheckCheck className="w-3 h-3" /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-sm">No notifications</div>
            ) : (
              notifications.slice(0, 30).map(n => (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 dark:border-[#222] hover:bg-gray-50 dark:hover:bg-[#222] cursor-pointer transition-colors ${!n.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                  onClick={() => { onClickNotification?.(n); if (!n.read) onMarkRead(n.id) }}
                >
                  <span className="text-base flex-shrink-0 mt-0.5">{TYPE_ICONS[n.type] || '🔔'}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs leading-snug ${!n.read ? 'font-semibold text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'}`}>
                      {n.title}
                    </p>
                    {n.body && <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>}
                    <p className="text-[10px] text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    {!n.read && (
                      <button onClick={e => { e.stopPropagation(); onMarkRead(n.id) }} className="p-0.5 text-gray-300 hover:text-blue-500" title="Mark read">
                        <Check className="w-3 h-3" />
                      </button>
                    )}
                    <button onClick={e => { e.stopPropagation(); onDismiss(n.id) }} className="p-0.5 text-gray-300 hover:text-red-500" title="Dismiss">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
