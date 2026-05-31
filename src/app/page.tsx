'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

/* ─── Smooth cubic easing ─── */
function smoothStep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

/* ─── Reveal on scroll ─── */
function Reveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setTimeout(() => setVisible(true), delay); obs.disconnect() }
    }, { threshold: 0.1 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [delay])
  return (
    <div ref={ref} className={`transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'} ${className}`}>
      {children}
    </div>
  )
}

/* ─── Draggable window wrapper ─── */
function DraggableWindow({
  children, initialX, initialY, zIndex, onFocus, canDrag, scale,
}: {
  children: React.ReactNode
  initialX: number; initialY: number
  zIndex: number; onFocus: () => void
  canDrag: boolean; scale: number
}) {
  const [pos, setPos] = useState({ x: initialX, y: initialY })
  const dragging = useRef(false)

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return
      setPos(p => ({ x: p.x + e.movementX / scale, y: p.y + e.movementY / scale }))
    }
    const onUp = () => { dragging.current = false }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [scale])

  return (
    <div
      className="absolute"
      style={{ left: pos.x, top: pos.y, zIndex, userSelect: 'none' }}
      onMouseDown={e => {
        if (!canDrag || (e.target as HTMLElement).closest('a,button')) return
        e.preventDefault()
        dragging.current = true
        onFocus()
      }}
    >
      {children}
    </div>
  )
}

/* ─── Chip — pill + info card with sign-up CTA ─── */
function Chip({
  label, href, desc, plan, windowOpacity, cardOpacity, onToggle, openLeft,
}: {
  label: string; href: string; desc: string; plan: string
  windowOpacity: number; cardOpacity: number
  onToggle?: () => void; openLeft?: boolean
}) {
  const cardVisible = cardOpacity > 0.01
  return (
    <div style={{ opacity: windowOpacity, transition: 'opacity 0.5s ease' }} className="relative">
      <button
        onClick={onToggle}
        style={{ pointerEvents: windowOpacity > 0.2 ? 'auto' : 'none' }}
        className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-semibold shadow-sm whitespace-nowrap border transition-all duration-200 ${
          cardVisible ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white/90 backdrop-blur-sm text-zinc-700 border-zinc-200 hover:border-zinc-400'
        }`}
      >
        {label}
        <span className={`w-1.5 h-1.5 rounded-full ${cardVisible ? 'bg-emerald-400' : 'bg-zinc-300'}`} />
      </button>

      <div
        style={{ opacity: cardOpacity, pointerEvents: cardVisible ? 'auto' : 'none' }}
        className={`absolute top-9 w-60 bg-white border border-zinc-200 rounded-2xl shadow-2xl p-4 z-50 ${openLeft ? 'right-0' : 'left-0'}`}
      >
        <p className="text-[12px] font-bold text-zinc-900 mb-1">{label}</p>
        <p className="text-[10.5px] text-zinc-500 leading-relaxed mb-3">{desc}</p>

        <div className="flex items-center gap-1.5 mb-3.5">
          <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">{plan}</span>
          <span className="text-[9px] text-zinc-400">· 14-day free trial</span>
        </div>

        <a href="/login" className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-white bg-zinc-900 hover:bg-zinc-700 px-3 py-2.5 rounded-xl transition-colors mb-2">
          Start free trial →
        </a>
        <a href={href} className="flex items-center justify-center gap-1 text-[9.5px] text-zinc-400 hover:text-zinc-700 transition-colors">
          View documentation ↗
        </a>
      </div>
    </div>
  )
}

/* ─── Card: snaps to 1.0 quickly, holds there, snaps out at end ─── */
function cardFade(fp: number, openAt: number, closeAt: number): number {
  const fadeIn  = smoothStep(openAt,         openAt  + 0.008, fp)
  const fadeOut = smoothStep(closeAt - 0.008, closeAt,        fp)
  return Math.max(0, fadeIn - fadeOut)
}

/* ─── App mockup ─── */
function AppMockup({ zoomProgress, featureProgress, scale, canInteract }: {
  zoomProgress: number; featureProgress: number; scale: number; canInteract: boolean
}) {
  const [clickedChip, setClickedChip] = useState<string | null>(null)
  const [focusOrder, setFocusOrder] = useState(['dash','mess','team','est','sched','fin'])
  const bringToFront = (id: string) => setFocusOrder(p => [...p.filter(x => x !== id), id])
  const zOf = (id: string) => (focusOrder.indexOf(id) + 1) * 10
  const toggleChip = (id: string) => { if (canInteract) setClickedChip(p => p === id ? null : id) }

  // Windows — all appear during zoom so they're fully in before descriptions start
  const win1  = smoothStep(0.10, 0.40, zoomProgress)
  const win2  = smoothStep(0.30, 0.60, zoomProgress)
  const win3  = smoothStep(0.50, 0.78, zoomProgress)
  const feat1 = smoothStep(0.55, 0.80, zoomProgress)
  const feat2 = smoothStep(0.68, 0.88, zoomProgress)
  const feat3 = smoothStep(0.80, 1.00, zoomProgress)

  // Scroll-driven description cards — 1/6 each, snap to full opacity
  const S = 1 / 6
  const scrollDash  = cardFade(featureProgress, 0 * S, 1 * S)
  const scrollMess  = cardFade(featureProgress, 1 * S, 2 * S)
  const scrollTeam  = cardFade(featureProgress, 2 * S, 3 * S)
  const scrollEst   = cardFade(featureProgress, 3 * S, 4 * S)
  const scrollSched = cardFade(featureProgress, 4 * S, 5 * S)
  const scrollFin   = cardFade(featureProgress, 5 * S, 1.0)

  // Card opacity = scroll-driven OR clicked (user override after scroll done)
  const co = (scrollOp: number, id: string) =>
    (canInteract && clickedChip === id) ? 1 : scrollOp

  const dash  = co(scrollDash,  'dash')
  const mess  = co(scrollMess,  'mess')
  const team  = co(scrollTeam,  'team')
  const est   = co(scrollEst,   'est')
  const sched = co(scrollSched, 'sched')
  const fin   = co(scrollFin,   'fin')

  return (
    <div className="relative bg-[#ebebeb] w-full overflow-hidden" style={{ height: 600 }}>
      {/* Bottom dock */}
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-zinc-200 h-[60px] flex items-center justify-center gap-4 z-50 px-3">
        {['Dashboard','Projects','Tasks','Phases','Timeline','Budgeting','KPI Dashb...','Team','Messages','Forms','Documents','Templates','Calendar','Communi...'].map((l) => (
          <div key={l} className="flex flex-col items-center gap-0.5 shrink-0">
            <div className="w-6 h-6 rounded-[10px] bg-zinc-200" />
            <span className="text-[7.5px] text-zinc-400 whitespace-nowrap">{l}</span>
          </div>
        ))}
      </div>

      {/* ── Window 1: Dashboard ── */}
      <DraggableWindow initialX={40} initialY={18} zIndex={zOf('dash')} onFocus={() => bringToFront('dash')} canDrag={canInteract} scale={scale}>
        <div style={{ opacity: win1, transition: 'opacity 0.5s', width: 460 }}>
          <div className="mb-1">
            <Chip label="Dashboard" href="/docs#projects" plan="All plans"
              desc="Track KPIs, revenue, outstanding balances, and net profit across all active projects in real time."
              windowOpacity={1} cardOpacity={dash} onToggle={() => toggleChip('dash')} />
          </div>
          <div className="bg-white rounded-2xl shadow-lg border border-zinc-200/80 overflow-hidden" style={{ cursor: canInteract ? 'grab' : 'default' }}>
            <div className="flex items-center gap-1.5 px-3 py-2.5 border-b border-zinc-100">
              <div className="flex gap-1.5">{['bg-red-400','bg-yellow-400','bg-green-400'].map((c,i)=><div key={i} className={`w-2.5 h-2.5 rounded-full ${c}`}/>)}</div>
              <span className="ml-2 text-[10px] text-zinc-500 font-medium">Dashboard</span>
            </div>
            <div className="p-3.5">
              <div className="flex items-center gap-1.5 mb-3.5 flex-wrap">
                <span className="text-sm font-bold text-zinc-900 mr-1">Dashboard</span>
                {['Daily','Monthly','Yearly'].map((t,i)=>(
                  <span key={t} className={`text-[9px] px-2 py-0.5 rounded-full border ${i===1?'bg-zinc-900 text-white border-zinc-900':'text-zinc-400 border-zinc-200'}`}>{t}</span>
                ))}
                <div className="ml-auto flex gap-1">{['Production','Accounting','Operations'].map((t,i)=>(
                  <span key={t} className={`text-[9px] px-2 py-0.5 rounded-full border ${i===0?'bg-zinc-900 text-white border-zinc-900':'text-zinc-400 border-zinc-200'}`}>{t}</span>
                ))}</div>
              </div>
              <div className="grid grid-cols-5 gap-1.5 mb-3">
                {[{label:'Contract Value',value:'$4,125',color:'text-zinc-900'},{label:'Revenue Collected',value:'$11,755',color:'text-emerald-600'},{label:'Outstanding',value:'$1,280',color:'text-blue-600'},{label:'Total Expenses',value:'$0.00',color:'text-zinc-900'},{label:'Net Profit',value:'$4,125',color:'text-emerald-600'}].map(k=>(
                  <div key={k.label} className="bg-zinc-50 rounded-xl p-2 border border-zinc-100">
                    <div className={`text-[8px] mb-0.5 leading-tight ${k.color==='text-zinc-900'?'text-zinc-400':k.color}`}>{k.label}</div>
                    <div className={`text-[11px] font-bold ${k.color}`}>{k.value}</div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <div className="bg-zinc-50 rounded-xl p-2.5 border border-zinc-100">
                  <div className="text-[9px] font-medium text-zinc-600 mb-2">Revenue Over Time</div>
                  <div className="h-14 flex items-end gap-0.5">{[0,0,0,0,70,0,0,0].map((h,i)=><div key={i} className={`flex-1 rounded-sm ${h?'bg-zinc-300':'bg-transparent border border-dashed border-zinc-200'}`} style={{height:h?`${h}%`:'100%'}}/>)}</div>
                </div>
                <div className="bg-zinc-50 rounded-xl p-2.5 border border-zinc-100">
                  <div className="text-[9px] font-medium text-zinc-600 mb-2">Expense Breakdown</div>
                  <div className="h-14 flex items-center justify-center"><div className="text-[8px] text-zinc-300">No data yet</div></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DraggableWindow>

      {/* ── Window 2: Messages ── */}
      <DraggableWindow initialX={524} initialY={28} zIndex={zOf('mess')} onFocus={() => bringToFront('mess')} canDrag={canInteract} scale={scale}>
        <div style={{ opacity: win2, transition: 'opacity 0.5s', width: 295 }}>
          <div className="mb-1">
            <Chip label="Messages" href="/docs#comms" plan="Team +"
              desc="Team and client inbox with full conversation history, SMS via Twilio, and activity logs."
              windowOpacity={1} cardOpacity={mess} onToggle={() => toggleChip('mess')} />
          </div>
          <div className="bg-white rounded-2xl shadow-lg border border-zinc-200/80 overflow-hidden" style={{ cursor: canInteract ? 'grab' : 'default' }}>
            <div className="flex items-center gap-1.5 px-3 py-2.5 border-b border-zinc-100">
              <div className="flex gap-1.5">{['bg-zinc-200','bg-zinc-200','bg-zinc-200'].map((c,i)=><div key={i} className={`w-2.5 h-2.5 rounded-full ${c}`}/>)}</div>
              <span className="ml-2 text-[10px] text-zinc-500 font-medium">Messages</span>
            </div>
            <div className="flex" style={{height:200}}>
              <div className="w-36 border-r border-zinc-100 p-2 overflow-hidden">
                <div className="bg-zinc-50 rounded-lg px-2 py-1 text-[8px] text-zinc-400 mb-2">Search...</div>
                {['Ethan Robillard','Oleksii Bolduma','Chungo Residences','747 North Lake','MFC GROUP'].map(name=>(
                  <div key={name} className="flex items-center gap-1.5 py-1.5 border-b border-zinc-50 last:border-0">
                    <div className="w-5 h-5 rounded-full bg-zinc-200 text-[7px] flex items-center justify-center font-bold text-zinc-500 shrink-0">{name[0]}</div>
                    <div className="overflow-hidden">
                      <div className="text-[8.5px] font-medium text-zinc-700 truncate leading-tight">{name}</div>
                      <div className="text-[7.5px] text-zinc-400">No messages</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex-1 flex flex-col items-center justify-center text-center p-3">
                <div className="w-8 h-8 border-2 border-zinc-200 rounded-xl mb-2"/>
                <div className="text-[8.5px] text-zinc-400">Select a conversation</div>
              </div>
            </div>
          </div>
        </div>
      </DraggableWindow>

      {/* ── Window 3: Team ── */}
      <DraggableWindow initialX={1110} initialY={16} zIndex={zOf('team')} onFocus={() => bringToFront('team')} canDrag={canInteract} scale={scale}>
        <div style={{ opacity: win3, transition: 'opacity 0.5s', width: 270 }}>
          <div className="mb-1 flex justify-end">
            <Chip label="Team & Contacts" href="/docs#team" plan="All plans"
              desc="Manage crew members, subcontractors, and client contacts. Set roles and permissions per member."
              windowOpacity={1} cardOpacity={team} onToggle={() => toggleChip('team')} openLeft />
          </div>
          <div className="bg-white rounded-2xl shadow-lg border border-zinc-200/80 overflow-hidden" style={{ cursor: canInteract ? 'grab' : 'default' }}>
            <div className="flex items-center gap-1.5 px-3 py-2.5 border-b border-zinc-100">
              <div className="flex gap-1.5">{['bg-zinc-200','bg-zinc-200','bg-zinc-200'].map((c,i)=><div key={i} className={`w-2.5 h-2.5 rounded-full ${c}`}/>)}</div>
              <span className="ml-2 text-[10px] text-zinc-500 font-medium">Team</span>
            </div>
            <div className="p-3">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[10px] font-semibold text-zinc-800">Team & Contacts</span>
                <div className="flex gap-1">
                  <button className="text-[8px] px-1.5 py-0.5 rounded-full border border-zinc-200 text-blue-500">Invite</button>
                  <button className="text-[8px] px-1.5 py-0.5 rounded-full bg-zinc-900 text-white">+ Add</button>
                </div>
              </div>
              <div className="flex gap-3 border-b border-zinc-100 pb-2 mb-3">
                {['Members (0)','Contacts (0)','Roles'].map((t,i)=>(
                  <span key={t} className={`text-[8.5px] pb-1 ${i===0?'text-zinc-900 border-b border-zinc-900':'text-zinc-400'}`}>{t}</span>
                ))}
              </div>
              <div className="flex flex-col items-center justify-center py-5 text-center">
                <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center mb-2">
                  <svg className="w-5 h-5 text-zinc-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                </div>
                <div className="text-[8.5px] text-zinc-400">No team members yet</div>
              </div>
            </div>
          </div>
        </div>
      </DraggableWindow>

      {/* ── Window 4: Estimates ── */}
      <DraggableWindow initialX={40} initialY={270} zIndex={zOf('est')} onFocus={() => bringToFront('est')} canDrag={canInteract} scale={scale}>
        <div style={{ opacity: feat1, transition: 'opacity 0.5s', width: 380 }}>
          <div className="mb-1">
            <Chip label="Smart Estimates" href="/docs#documents" plan="All plans"
              desc="Build itemized proposals with materials, labor, and markup. Send as PDF or a shareable portal link."
              windowOpacity={1} cardOpacity={est} onToggle={() => toggleChip('est')} />
          </div>
          <div className="bg-white rounded-2xl shadow-xl border border-zinc-200/80 overflow-hidden" style={{ cursor: canInteract ? 'grab' : 'default' }}>
            <div className="flex items-center gap-1.5 px-3 py-2.5 border-b border-zinc-100">
              <div className="flex gap-1.5">{['bg-zinc-200','bg-zinc-200','bg-zinc-200'].map((c,i)=><div key={i} className={`w-2.5 h-2.5 rounded-full ${c}`}/>)}</div>
              <span className="ml-2 text-[10px] font-semibold text-zinc-700">Smart Estimates</span>
            </div>
            <div className="p-3">
              <div className="text-[9px] font-semibold text-zinc-500 mb-2 uppercase tracking-wider">Proposal #1042 — Roof Replacement</div>
              {[['Materials — GAF Timberline HDZ','$4,200'],['Labor — Tear-off & Install (2 days)','$2,800'],['Fasteners & Underlayment','$380'],['Disposal & Cleanup','$320']].map(([item,price])=>(
                <div key={item} className="flex justify-between items-center py-1 border-b border-zinc-50 last:border-0">
                  <span className="text-[9px] text-zinc-600">{item}</span>
                  <span className="text-[9px] font-semibold text-zinc-900">{price}</span>
                </div>
              ))}
              <div className="flex justify-between items-center pt-2 mt-1 border-t border-zinc-200">
                <span className="text-[9px] font-bold text-zinc-900">Total</span>
                <span className="text-[10px] font-bold text-emerald-600">$7,700</span>
              </div>
              <div className="mt-2 flex gap-1.5">
                <div className="flex-1 py-1.5 bg-zinc-900 text-white text-[8px] font-medium text-center rounded-lg">Send Proposal</div>
                <div className="flex-1 py-1.5 bg-zinc-100 text-zinc-600 text-[8px] font-medium text-center rounded-lg">Export PDF</div>
              </div>
            </div>
          </div>
        </div>
      </DraggableWindow>

      {/* ── Window 5: Scheduling ── */}
      <DraggableWindow initialX={450} initialY={250} zIndex={zOf('sched')} onFocus={() => bringToFront('sched')} canDrag={canInteract} scale={scale}>
        <div style={{ opacity: feat2, transition: 'opacity 0.5s', width: 340 }}>
          <div className="mb-1">
            <Chip label="Live Scheduling" href="/docs#projects" plan="All plans"
              desc="Gantt timeline, weekly calendar, and task boards all stay in sync. Assign crews and track deadlines."
              windowOpacity={1} cardOpacity={sched} onToggle={() => toggleChip('sched')} />
          </div>
          <div className="bg-white rounded-2xl shadow-xl border border-zinc-200/80 overflow-hidden" style={{ cursor: canInteract ? 'grab' : 'default' }}>
            <div className="flex items-center gap-1.5 px-3 py-2.5 border-b border-zinc-100">
              <div className="flex gap-1.5">{['bg-zinc-200','bg-zinc-200','bg-zinc-200'].map((c,i)=><div key={i} className={`w-2.5 h-2.5 rounded-full ${c}`}/>)}</div>
              <span className="ml-2 text-[10px] font-semibold text-zinc-700">Live Scheduling</span>
            </div>
            <div className="p-3">
              <div className="grid grid-cols-7 gap-0.5 mb-2">{['M','T','W','T','F','S','S'].map((d,i)=><div key={i} className="text-center text-[8px] text-zinc-400 font-medium">{d}</div>)}</div>
              {[{task:'Site Prep',days:[1,1,0,0,0,0,0],color:'bg-blue-200'},{task:'Framing',days:[0,0,1,1,1,0,0],color:'bg-emerald-200'},{task:'Roofing',days:[0,0,0,0,1,1,0],color:'bg-amber-200'},{task:'Inspection',days:[0,0,0,0,0,0,1],color:'bg-purple-200'}].map(({task,days,color})=>(
                <div key={task} className="flex items-center gap-1 mb-1">
                  <div className="w-16 text-[8px] text-zinc-600 truncate">{task}</div>
                  <div className="flex gap-0.5 flex-1">{days.map((on,i)=><div key={i} className={`h-4 flex-1 rounded-sm ${on?color:'bg-zinc-100'}`}/>)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DraggableWindow>

      {/* ── Window 6: Financial Command ── */}
      <DraggableWindow initialX={1110} initialY={265} zIndex={zOf('fin')} onFocus={() => bringToFront('fin')} canDrag={canInteract} scale={scale}>
        <div style={{ opacity: feat3, transition: 'opacity 0.5s', width: 270 }}>
          <div className="mb-1 flex justify-end">
            <Chip label="Financial Command" href="/docs#budgeting" plan="All plans"
              desc="Track budget vs actuals, log expenses, and see profit margins per project before the job closes."
              windowOpacity={1} cardOpacity={fin} onToggle={() => toggleChip('fin')} openLeft />
          </div>
          <div className="bg-white rounded-2xl shadow-xl border border-zinc-200/80 overflow-hidden" style={{ cursor: canInteract ? 'grab' : 'default' }}>
            <div className="flex items-center gap-1.5 px-3 py-2.5 border-b border-zinc-100">
              <div className="flex gap-1.5">{['bg-zinc-200','bg-zinc-200','bg-zinc-200'].map((c,i)=><div key={i} className={`w-2.5 h-2.5 rounded-full ${c}`}/>)}</div>
              <span className="ml-2 text-[10px] font-semibold text-zinc-700">Financial Command</span>
            </div>
            <div className="p-3">
              {[{label:'Contract Value',val:'$142,500',bar:100,color:'bg-zinc-300'},{label:'Revenue Collected',val:'$98,200',bar:69,color:'bg-emerald-400'},{label:'Outstanding',val:'$44,300',bar:31,color:'bg-blue-400'},{label:'Total Expenses',val:'$67,100',bar:47,color:'bg-amber-400'}].map(({label,val,bar,color})=>(
                <div key={label} className="mb-2">
                  <div className="flex justify-between mb-0.5">
                    <span className="text-[8.5px] text-zinc-500">{label}</span>
                    <span className="text-[8.5px] font-semibold text-zinc-900">{val}</span>
                  </div>
                  <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${color}`} style={{width:`${bar}%`}}/></div>
                </div>
              ))}
              <div className="mt-2 pt-2 border-t border-zinc-100 flex justify-between">
                <span className="text-[8.5px] text-zinc-500">Net Profit</span>
                <span className="text-[9px] font-bold text-emerald-600">$31,100 (21.8%)</span>
              </div>
            </div>
          </div>
        </div>
      </DraggableWindow>

      {/* Watermark */}
      <div className="absolute top-3 left-4 z-50">
        <span className="text-[10px] font-bold tracking-[0.18em] text-zinc-400 uppercase">PROJEX</span>
      </div>
    </div>
  )
}

/* ─── Main scroll section: zoom in → lock → reveal features ─── */
function ScrollZoomSection() {
  const spacerRef = useRef<HTMLDivElement>(null)
  const [progress, setProgress] = useState(0)
  const [active, setActive] = useState(false)

  useEffect(() => {
    const update = () => {
      const el = spacerRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const scrollable = el.offsetHeight - window.innerHeight
      if (scrollable <= 0) return
      const raw = -rect.top / scrollable
      setActive(raw >= 0 && raw <= 1)
      setProgress(isNaN(raw) ? 0 : Math.max(0, Math.min(1, raw)))
    }
    window.addEventListener('scroll', update, { passive: true })
    update()
    return () => window.removeEventListener('scroll', update)
  }, [])

  const ZOOM_END = 0.28
  const zoomProgress = Math.min(1, progress / ZOOM_END)
  const scale = 0.46 + zoomProgress * 0.56
  const featureProgress = progress <= ZOOM_END ? 0 : (progress - ZOOM_END) / (1 - ZOOM_END)
  const canInteract = zoomProgress >= 1.0
  const opacity = progress > 0.92 ? Math.max(0, 1 - (progress - 0.92) / 0.08) : 1

  const browser = (
    <div className="rounded-2xl overflow-hidden border border-zinc-200 shadow-[0_32px_100px_rgba(0,0,0,0.14)]">
      {/* Browser chrome — CTA in address bar area */}
      <div className="bg-zinc-100 border-b border-zinc-200 px-4 py-3 flex items-center gap-3">
        <div className="flex gap-1.5 shrink-0">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 flex justify-center">
          <div className="bg-white rounded-lg px-4 py-1.5 text-xs text-zinc-400 border border-zinc-200 flex items-center gap-2 w-64">
            <svg className="w-3 h-3 text-zinc-300 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <span className="truncate">projex.live/access</span>
          </div>
        </div>
        <a href="/login" style={{ pointerEvents: canInteract ? 'auto' : 'none' }}
          className="shrink-0 bg-zinc-900 text-white text-[11px] font-semibold px-4 py-1.5 rounded-full hover:bg-zinc-700 transition-colors whitespace-nowrap">
          Start free trial →
        </a>
      </div>
      <AppMockup zoomProgress={zoomProgress} featureProgress={featureProgress} scale={scale} canInteract={canInteract} />
    </div>
  )

  return (
    <>
      <div ref={spacerRef} style={{ height: '700vh' }} className="bg-white" />

      {active && (
        <div style={{
          position: 'fixed',
          bottom: '7vh',
          left: 0,
          right: 0,
          width: '96vw',
          maxWidth: '1600px',
          margin: '0 auto',
          transform: `scale(${scale})`,
          transformOrigin: 'bottom center',
          opacity,
          zIndex: 10,
          willChange: 'transform',
          // Allow interactions once zoom is done
          pointerEvents: canInteract ? 'auto' : 'none',
        }}>
          {browser}
        </div>
      )}
    </>
  )
}

/* ─── Data ─── */
/* ─── Page ─── */
export default function Home() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [scrolled, setScrolled] = useState(false)
  const [mobileNav, setMobileNav] = useState(false)

  // Landing page is always accessible — no auth redirect
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  if (loading) return (
    <main className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-xl font-bold text-zinc-900 tracking-[0.2em] uppercase">Projex</h1>
        <div className="mt-3 w-16 h-0.5 bg-zinc-100 mx-auto overflow-hidden rounded-full">
          <div className="h-full w-1/3 bg-zinc-400 rounded-full animate-[shimmer_1s_ease-in-out_infinite]" />
        </div>
      </div>
    </main>
  )

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=JetBrains+Mono:wght@400;500&display=swap');
        body { font-family: 'DM Sans', system-ui, -apple-system, sans-serif; }
        @keyframes shimmer { 0%{transform:translateX(-200%)} 100%{transform:translateX(400%)} }
      `}</style>

      <main className="min-h-screen bg-white text-zinc-900 antialiased" style={{ overflowX: 'clip' }}>

        {/* ═══ NAV ═══ */}
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-white/90 backdrop-blur-xl border-b border-zinc-100' : 'bg-transparent'}`}>
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <a href="/" className="text-sm font-bold tracking-[0.18em] uppercase text-zinc-900">Projex</a>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-8">
              <a href="/solutions" className="text-[13px] text-zinc-500 hover:text-zinc-900 transition-colors duration-200">Solutions</a>
              <a href="#features" className="text-[13px] text-zinc-500 hover:text-zinc-900 transition-colors duration-200">Features</a>
              <a href="#pricing" className="text-[13px] text-zinc-500 hover:text-zinc-900 transition-colors duration-200">Pricing</a>
              <a href="/docs" className="text-[13px] text-zinc-500 hover:text-zinc-900 transition-colors duration-200">Docs</a>
              <a href="/references" className="text-[13px] text-zinc-500 hover:text-zinc-900 transition-colors duration-200">References</a>
            </div>

            {/* Auth actions */}
            <div className="hidden md:flex items-center gap-4">
              {user ? (
                <button
                  onClick={() => router.push('/access')}
                  className="text-[13px] bg-zinc-900 text-white px-5 py-2 rounded-full font-medium hover:bg-zinc-700 transition-all active:scale-[0.97]"
                >
                  Open app →
                </button>
              ) : (
                <>
                  <button onClick={() => router.push('/login')} className="text-[13px] text-zinc-500 hover:text-zinc-900 transition-colors">Sign in</button>
                  <button
                    onClick={() => router.push('/login')}
                    className="text-[13px] bg-zinc-900 text-white px-5 py-2 rounded-full font-medium hover:bg-zinc-700 transition-all active:scale-[0.97]"
                  >
                    Get started
                  </button>
                </>
              )}
            </div>

            {/* Mobile toggle */}
            <button onClick={() => setMobileNav(!mobileNav)} className="md:hidden p-2 text-zinc-500">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d={mobileNav ? 'M6 6l12 12M6 18L18 6' : 'M4 8h16M4 16h16'} />
              </svg>
            </button>
          </div>

          {/* Mobile menu */}
          {mobileNav && (
            <div className="md:hidden bg-white border-t border-zinc-100 px-6 py-5 space-y-4">
              {[
                { label: 'Solutions', href: '/solutions' },
                { label: 'Features', href: '#features' },
                { label: 'Pricing', href: '#pricing' },
                { label: 'Docs', href: '/docs' },
                { label: 'References', href: '/references' },
              ].map(({ label, href }) => (
                <a key={label} href={href} onClick={() => setMobileNav(false)} className="block text-sm text-zinc-500 hover:text-zinc-900">{label}</a>
              ))}
              <div className="pt-4 border-t border-zinc-100 flex gap-3">
                {user ? (
                  <button onClick={() => router.push('/access')} className="text-sm bg-zinc-900 text-white px-4 py-2 rounded-full font-medium">Open app →</button>
                ) : (
                  <>
                    <button onClick={() => router.push('/login')} className="text-sm text-zinc-500">Sign in</button>
                    <button onClick={() => router.push('/login')} className="text-sm bg-zinc-900 text-white px-4 py-2 rounded-full font-medium">Get started</button>
                  </>
                )}
              </div>
            </div>
          )}
        </nav>

        {/* ═══ HERO ═══ */}
        <section className="relative h-screen flex flex-col items-center justify-center px-6 pt-16 text-center overflow-hidden">
          {/* Very subtle dot grid */}
          <div className="absolute inset-0 opacity-[0.035]" style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

          <div className="relative max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-100 text-[11px] font-medium text-zinc-500 mb-10 tracking-wider uppercase">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              Now in beta
            </div>

            <h1 className="text-[clamp(3.5rem,10vw,7rem)] font-bold tracking-[-0.04em] leading-[0.88] text-zinc-900 mb-8">
              Management,<br />
              <span className="text-zinc-400">reimagined.</span>
            </h1>

            <p className="text-lg md:text-xl text-zinc-500 max-w-lg mx-auto leading-relaxed mb-10">
              One spatial workspace for estimates, scheduling, budgets, and team coordination. Built for businesses that move fast.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => router.push('/login')}
                className="px-8 py-3.5 bg-zinc-900 text-white rounded-full text-[15px] font-semibold hover:bg-zinc-700 transition-all active:scale-[0.97]"
              >
                Start free trial →
              </button>
              <button
                onClick={() => document.getElementById('app-preview')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-3.5 text-zinc-500 rounded-full text-[15px] font-medium border border-zinc-200 hover:border-zinc-400 hover:text-zinc-900 transition-all active:scale-[0.97]"
              >
                See it in action
              </button>
            </div>

            <p className="mt-5 text-[12px] text-zinc-400 tracking-wide">14-day free trial · No credit card required</p>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce opacity-40">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-400">
              <path d="M12 5v14M5 12l7 7 7-7"/>
            </svg>
          </div>
        </section>

        {/* ═══ SCROLL ZOOM + FEATURE REVEALS ═══ */}
        <div id="app-preview">
          <ScrollZoomSection />
        </div>

        {/* ═══ APP DIRECTORY ═══ */}
        <section className="px-6 pt-24 pb-16 border-t border-zinc-100 bg-white">
          <div className="max-w-5xl mx-auto">
            <Reveal>
              <div className="mb-14">
                <p className="text-[11px] text-zinc-400 uppercase tracking-[0.2em] font-medium mb-2">Everything in Projex</p>
                <h2 className="text-3xl font-bold text-zinc-900 tracking-tight">App Directory</h2>
              </div>
            </Reveal>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-10 gap-y-12">
              {[
                {
                  name: 'Operations',
                  items: [
                    { name: 'Dashboard', desc: 'KPIs, revenue, project overview' },
                    { name: 'Projects', desc: 'Active jobs and pipeline' },
                    { name: 'Tasks', desc: 'Assign and track crew work' },
                    { name: 'Phases', desc: 'Project lifecycle stages' },
                    { name: 'Timeline', desc: 'Gantt-style scheduling view' },
                    { name: 'Calendar', desc: 'Events, deadlines, meetings' },
                    { name: 'Schedule', desc: 'Crew and resource planning' },
                  ],
                },
                {
                  name: 'Finance',
                  items: [
                    { name: 'Estimating', desc: 'Build and send proposals' },
                    { name: 'Invoicing', desc: 'Invoice creation and tracking' },
                    { name: 'Budgeting', desc: 'Budget vs actuals per project' },
                    { name: 'KPI Dashboard', desc: 'Custom performance metrics' },
                    { name: 'Accounting', desc: 'QuickBooks sync & reports' },
                  ],
                },
                {
                  name: 'Team & Comms',
                  items: [
                    { name: 'Team', desc: 'Members, contacts, roles' },
                    { name: 'Messages', desc: 'Team and client inbox' },
                    { name: 'CommsHub', desc: 'Calls, SMS, activity logs' },
                    { name: 'Meetings', desc: 'Schedule and notes' },
                    { name: 'Lead Gen', desc: 'Lead tracking and pipeline' },
                  ],
                },
                {
                  name: 'Documents & Files',
                  items: [
                    { name: 'Documents', desc: 'File management and sharing' },
                    { name: 'Templates', desc: 'Reusable document templates' },
                    { name: 'Forms', desc: 'Inspection and custom forms' },
                    { name: 'Drawings', desc: 'Field annotations and plans' },
                    { name: 'Photos', desc: 'Site documentation' },
                  ],
                },
                {
                  name: 'Business',
                  items: [
                    { name: 'Branches', desc: 'Multi-location management' },
                    { name: 'Maps', desc: 'Geographic job view' },
                    { name: 'Client Portal', desc: 'Client-facing project view' },
                    { name: 'Integrations', desc: 'Google, QuickBooks, Twilio' },
                    { name: 'Settings', desc: 'Company and account config' },
                  ],
                },
                {
                  name: 'Site',
                  items: [
                    { name: 'Solutions', desc: 'By trade and industry', href: '/solutions' },
                    { name: 'Documentation', desc: 'Technical guides', href: '/docs' },
                    { name: 'References', desc: 'Client logos and use cases', href: '/references' },
                    { name: 'About', desc: 'Company and mission', href: '/about' },
                    { name: 'Pricing', desc: 'Plans and add-ons', href: '/pricing' },
                    { name: 'Blog', desc: 'Updates and guides', href: '/blog' },
                    { name: 'Privacy', desc: 'Data and compliance', href: '/privacy' },
                    { name: 'Terms', desc: 'Terms of service', href: '/terms' },
                  ],
                },
              ].map((cat, ci) => (
                <Reveal key={cat.name} delay={ci * 60}>
                  <div>
                    <h3 className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-4">{cat.name}</h3>
                    <ul className="space-y-3">
                      {cat.items.map((item) => (
                        <li key={item.name}>
                          <a
                            href={'href' in item ? (item as any).href : '/docs'}
                            className="group block"
                          >
                            <p className="text-[13px] font-medium text-zinc-900 group-hover:text-zinc-500 transition-colors leading-tight">
                              {item.name}
                            </p>
                            <p className="text-[11px] text-zinc-400 leading-tight mt-0.5">{item.desc}</p>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              ))}
            </div>

            {/* Footer line */}
            <div className="mt-20 pt-8 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-[11px] text-zinc-400">&copy; 2026 Projex. All rights reserved.</p>
              <div className="flex gap-6 text-[11px] text-zinc-400">
                <a href="/privacy" className="hover:text-zinc-900 transition-colors">Privacy</a>
                <a href="/terms" className="hover:text-zinc-900 transition-colors">Terms</a>
                <a href="mailto:hello@projex.live" className="hover:text-zinc-900 transition-colors">Contact</a>
              </div>
            </div>
          </div>
        </section>


      </main>
    </>
  )
}