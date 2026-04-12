'use client'

import { useState, useMemo, useCallback, useRef } from 'react'
import type React from 'react'
import { Card } from '@/types'
import CardIcon from '@/components/ui/CardIcon'
import {
  Search, X, Bell, Plus, ChevronLeft, FileText, ClipboardList, Receipt,
  Wrench, LogOut, User, ChevronRight, Settings, Phone, MessageCircle,
  Camera, Users, FolderOpen, DollarSign, Plug, BarChart3
} from 'lucide-react'

interface MobileLayoutProps {
  cards: Card[]
  activeCard: string | null
  onSelectCard: (id: string) => void
  unreadCount?: number
  renderContent: (cardType: string) => React.ReactNode
  onNewEstimate?: () => void
  onNewInvoice?: () => void
  onCreateProject?: () => void
  onNewInspection?: () => void
  userName?: string
  userEmail?: string
  orgName?: string
  onlineCount?: number
  onSignOut?: () => void
  // Feed data
  recentActivity?: { id: string; type: string; title: string; time: string; icon?: string }[]
}

// Bottom dock — 5 primary tabs like iPhone
const DOCK_ITEMS = [
  { id: 'dashboard', label: 'Home', icon: FolderOpen },
  { id: 'comms', label: 'Comms', icon: Phone },
  { id: 'projects', label: 'Projects', icon: BarChart3 },
  { id: 'photos', label: 'Photos', icon: Camera },
  { id: 'more', label: 'More', icon: Settings },
]

// App grid in "More" tab — iOS-style organized
const APP_SECTIONS = [
  { label: 'Work', apps: [
    { id: 'tasks', name: 'Tasks', color: 'bg-blue-500' },
    { id: 'calendar', name: 'Calendar', color: 'bg-red-500' },
    { id: 'leads', name: 'Leads', color: 'bg-rose-500' },
    { id: 'schedule', name: 'Schedule', color: 'bg-orange-500' },
    { id: 'phases', name: 'Phases', color: 'bg-purple-500' },
    { id: 'timeline', name: 'Timeline', color: 'bg-indigo-500' },
  ]},
  { label: 'Documents', apps: [
    { id: 'forms', name: 'Forms', color: 'bg-green-500' },
    { id: 'documents', name: 'Files', color: 'bg-cyan-500' },
    { id: 'estimating', name: 'Estimates', color: 'bg-emerald-500' },
    { id: 'invoicing', name: 'Invoices', color: 'bg-teal-500' },
    { id: 'templates', name: 'Templates', color: 'bg-sky-500' },
  ]},
  { label: 'Finance', apps: [
    { id: 'accounting', name: 'Accounting', color: 'bg-green-600' },
    { id: 'budgeting', name: 'Budgets', color: 'bg-amber-500' },
    { id: 'kpi', name: 'KPIs', color: 'bg-pink-500' },
  ]},
  { label: 'Team', apps: [
    { id: 'team', name: 'Team', color: 'bg-blue-600' },
    { id: 'messages', name: 'Messages', color: 'bg-green-500' },
    { id: 'meetings', name: 'Meetings', color: 'bg-violet-500' },
    { id: 'communication', name: 'Email', color: 'bg-blue-400' },
  ]},
  { label: 'Tools', apps: [
    { id: 'drawings', name: 'Drawings', color: 'bg-gray-600' },
    { id: 'maps', name: 'Maps', color: 'bg-green-600' },
    { id: 'branches', name: 'Branches', color: 'bg-stone-500' },
    { id: 'integrations', name: 'Integrations', color: 'bg-purple-600' },
    { id: 'chat', name: 'AI Chat', color: 'bg-gray-900' },
  ]},
]

export default function MobileLayout({
  cards, activeCard, onSelectCard, unreadCount = 0, renderContent,
  onNewEstimate, onNewInvoice, onCreateProject, onNewInspection,
  userName, userEmail, orgName, onlineCount = 0, onSignOut, recentActivity = [],
}: MobileLayoutProps) {
  const [showMore, setShowMore] = useState(false)
  const [showFAB, setShowFAB] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [search, setSearch] = useState('')
  const touchStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

  const currentCard = cards.find((c: Card) => c.id === activeCard) || cards[0]
  const currentView = activeCard === 'more' ? null : activeCard
  const isInSubView = currentView && !DOCK_ITEMS.some(n => n.id === currentView)

  // Swipe right to go back
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }, [])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStart.current.x
    const dy = Math.abs(e.changedTouches[0].clientY - touchStart.current.y)
    if (dx > 80 && dy < 50 && isInSubView) {
      setShowMore(true)
      onSelectCard('more')
    }
  }, [isInSubView, onSelectCard])

  const handleBack = () => { setShowMore(true); onSelectCard('more') }
  const openApp = (id: string) => { onSelectCard(id); setShowMore(false) }

  // Filter apps in search
  const allApps = APP_SECTIONS.flatMap(s => s.apps)
  const filteredApps = search ? allApps.filter(a => a.name.toLowerCase().includes(search.toLowerCase())) : null

  return (
    <div className="h-screen w-screen flex flex-col bg-[#f2f2f7] dark:bg-[#000]">
      {/* ===== STATUS BAR / HEADER ===== */}
      <div className="bg-white/80 dark:bg-[#1c1c1e]/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-[#2c2c2e]/50 shrink-0 z-50">
        <div className="h-11 flex items-center justify-between px-4" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
          {isInSubView && !showMore ? (
            <button onClick={handleBack} className="flex items-center gap-0.5 text-[#007AFF] -ml-1.5 active:opacity-60">
              <ChevronLeft className="w-5 h-5" />
              <span className="text-[15px]">Back</span>
            </button>
          ) : (
            <button onClick={() => setShowProfile(true)} className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#007AFF] to-[#5856D6] flex items-center justify-center">
                <span className="text-white text-[10px] font-bold">{(userName?.[0] || userEmail?.[0] || 'P').toUpperCase()}</span>
              </div>
            </button>
          )}

          <span className="text-[15px] font-semibold text-gray-900 dark:text-gray-100 absolute left-1/2 -translate-x-1/2">
            {showMore ? 'Projex' : (isInSubView ? currentCard?.title : (currentView === 'dashboard' ? 'Home' : currentCard?.title || 'Projex'))}
          </span>

          <div className="flex items-center gap-1">
            <button onClick={() => onSelectCard('messages')} className="relative p-1.5 text-gray-500 active:opacity-60">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-[#FF3B30] text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ===== CONTENT AREA ===== */}
      <div className="flex-1 overflow-hidden" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        {showMore ? (
          /* ===== MORE / APP GRID ===== */
          <div className="h-full flex flex-col">
            {/* Search */}
            <div className="px-4 pt-3 pb-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Search" value={search}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-gray-200/60 dark:bg-[#1c1c1e] rounded-xl text-[15px] text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none" />
                {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><X className="w-4 h-4" /></button>}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pb-4">
              {filteredApps ? (
                /* Search results */
                <div className="px-4">
                  <div className="grid grid-cols-4 gap-4 pt-2">
                    {filteredApps.map(app => (
                      <button key={app.id} onClick={() => openApp(app.id)}
                        className="flex flex-col items-center gap-1.5 active:scale-90 transition-transform">
                        <div className={`w-14 h-14 rounded-[16px] ${app.color} flex items-center justify-center shadow-sm`}>
                          <CardIcon type={app.id} size={26} className="text-white" />
                        </div>
                        <span className="text-[11px] text-gray-700 dark:text-gray-300 font-medium">{app.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* App sections */
                <div className="px-4 space-y-6">
                  {APP_SECTIONS.map(section => (
                    <div key={section.label}>
                      <h3 className="text-[13px] font-semibold text-gray-500 dark:text-gray-400 mb-2.5 px-0.5">{section.label}</h3>
                      <div className="grid grid-cols-4 gap-x-4 gap-y-5">
                        {section.apps.map(app => (
                          <button key={app.id} onClick={() => openApp(app.id)}
                            className="flex flex-col items-center gap-1.5 active:scale-90 transition-transform">
                            <div className={`w-14 h-14 rounded-[16px] ${app.color} flex items-center justify-center shadow-sm`}>
                              <CardIcon type={app.id} size={26} className="text-white" />
                            </div>
                            <span className="text-[11px] text-gray-700 dark:text-gray-300 font-medium">{app.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Settings row */}
                  <div>
                    <h3 className="text-[13px] font-semibold text-gray-500 dark:text-gray-400 mb-2.5 px-0.5">Account</h3>
                    <button onClick={() => openApp('settings')}
                      className="w-full flex items-center gap-3 px-4 py-3 bg-white dark:bg-[#1c1c1e] rounded-xl active:bg-gray-50 dark:active:bg-[#2c2c2e] transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-gray-500 flex items-center justify-center">
                        <Settings className="w-4.5 h-4.5 text-white" />
                      </div>
                      <span className="text-[15px] text-gray-900 dark:text-gray-100 flex-1 text-left">Settings</span>
                      <ChevronRight className="w-4 h-4 text-gray-300" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : currentView ? (
          /* ===== CARD CONTENT ===== */
          <div className="h-full w-full overflow-y-auto overscroll-contain">
            {renderContent(currentCard?.type || currentView)}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400">
            <p className="text-sm">Select a card</p>
          </div>
        )}
      </div>

      {/* ===== FAB ===== */}
      {!showMore && currentView && (
        <>
          {showFAB && <div className="fixed inset-0 z-[98] bg-black/20 backdrop-blur-[2px]" onClick={() => setShowFAB(false)} />}
          <div className="fixed right-5 z-[100]" style={{ bottom: 'calc(76px + max(env(safe-area-inset-bottom, 0px), 8px))' }}>
            {showFAB && (
              <div className="mb-3 flex flex-col gap-2.5 items-end">
                {[
                  { action: onCreateProject, label: 'New Project', icon: Wrench, color: 'bg-gray-900 dark:bg-white' },
                  { action: onNewEstimate, label: 'New Estimate', icon: FileText, color: 'bg-blue-600' },
                  { action: onNewInvoice, label: 'New Invoice', icon: Receipt, color: 'bg-green-600' },
                  { action: onNewInspection, label: 'Inspection', icon: ClipboardList, color: 'bg-orange-500' },
                ].filter(a => a.action).map(({ action, label, icon: Icon, color }) => (
                  <button key={label} onClick={() => { action?.(); setShowFAB(false) }}
                    className={`flex items-center gap-2.5 pl-4 pr-5 py-2.5 ${color} text-white rounded-full shadow-lg text-[13px] font-medium active:scale-95 transition-all`}>
                    <Icon className="w-4 h-4" /> {label}
                  </button>
                ))}
              </div>
            )}
            <button onClick={() => setShowFAB(!showFAB)}
              className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all active:scale-90 ${
                showFAB ? 'bg-gray-300 dark:bg-[#3a3a3c] rotate-45' : 'bg-[#007AFF]'
              }`}>
              <Plus className={`w-7 h-7 ${showFAB ? 'text-gray-600 dark:text-gray-300' : 'text-white'}`} />
            </button>
          </div>
        </>
      )}

      {/* ===== DOCK / BOTTOM NAV ===== */}
      <div className="bg-white/80 dark:bg-[#1c1c1e]/80 backdrop-blur-xl border-t border-gray-200/50 dark:border-[#2c2c2e]/50 shrink-0 z-50"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 4px)' }}>
        <div className="flex items-center justify-around px-2 pt-1.5 pb-0.5">
          {DOCK_ITEMS.map(item => {
            const isActive = item.id === 'more' ? showMore : (!showMore && activeCard === item.id)
            const Icon = item.icon
            return (
              <button key={item.id} onClick={() => {
                setShowFAB(false)
                if (item.id === 'more') { setShowMore(!showMore) }
                else { setShowMore(false); onSelectCard(item.id) }
              }}
                className="flex flex-col items-center gap-0.5 min-w-[52px] py-1 active:opacity-60 transition-opacity">
                <Icon className={`w-[22px] h-[22px] ${isActive ? 'text-[#007AFF]' : 'text-gray-400 dark:text-gray-500'}`} />
                <span className={`text-[10px] ${isActive ? 'text-[#007AFF] font-semibold' : 'text-gray-400 dark:text-gray-500'}`}>{item.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ===== PROFILE SHEET ===== */}
      {showProfile && (
        <>
          <div className="fixed inset-0 z-[200] bg-black/40" onClick={() => setShowProfile(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-[201] bg-white dark:bg-[#1c1c1e] rounded-t-3xl shadow-2xl"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}>
            <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mt-3 mb-4" />

            {/* Profile header */}
            <div className="flex items-center gap-3.5 px-6 mb-5">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#007AFF] to-[#5856D6] flex items-center justify-center">
                <span className="text-white text-xl font-bold">{(userName?.[0] || userEmail?.[0] || 'P').toUpperCase()}</span>
              </div>
              <div>
                <p className="text-[17px] font-semibold text-gray-900 dark:text-gray-100">{userName || userEmail?.split('@')[0] || 'User'}</p>
                <p className="text-[13px] text-gray-500">{userEmail}</p>
                {orgName && <p className="text-[12px] text-[#007AFF] font-medium mt-0.5">{orgName}</p>}
              </div>
            </div>

            {/* Quick stats */}
            {onlineCount > 0 && (
              <div className="mx-6 mb-4 px-4 py-2.5 bg-[#f2f2f7] dark:bg-[#2c2c2e] rounded-xl flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#34C759]" />
                <span className="text-[13px] text-gray-700 dark:text-gray-300">{onlineCount} team member{onlineCount !== 1 ? 's' : ''} online</span>
              </div>
            )}

            {/* Actions */}
            <div className="mx-6 space-y-0.5 bg-[#f2f2f7] dark:bg-[#2c2c2e] rounded-xl overflow-hidden mb-4">
              {[
                { label: 'Settings', icon: Settings, action: () => { openApp('settings'); setShowProfile(false) } },
                { label: 'Team', icon: Users, action: () => { openApp('team'); setShowProfile(false) } },
                { label: 'Integrations', icon: Plug, action: () => { openApp('integrations'); setShowProfile(false) } },
              ].map(item => (
                <button key={item.label} onClick={item.action}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-white dark:bg-[#1c1c1e] active:bg-gray-50 dark:active:bg-[#2c2c2e]">
                  <item.icon className="w-5 h-5 text-gray-500" />
                  <span className="text-[15px] text-gray-900 dark:text-gray-100 flex-1 text-left">{item.label}</span>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </button>
              ))}
            </div>

            {/* Sign out */}
            {onSignOut && (
              <div className="mx-6">
                <button onClick={onSignOut}
                  className="w-full py-3 bg-[#f2f2f7] dark:bg-[#2c2c2e] rounded-xl text-[15px] text-[#FF3B30] font-medium active:bg-gray-200 dark:active:bg-[#3a3a3c] transition-colors">
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
