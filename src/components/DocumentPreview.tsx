'use client'

// DocumentPreview — branded, print-ready HTML renderer for all PROJEX document types.
// Matches the MEC Group document style shown in design reference.
// Supports 3 themes and internal (cost-visible) vs external (client-facing) view modes.

import React from 'react'
import { DesignTheme } from '@/types/templates'

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0)

const fmtDate = (d?: string) => {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  } catch {
    return d
  }
}

const TYPE_LABELS: Record<string, string> = {
  estimate: 'ESTIMATE',
  invoice: 'INVOICE',
  work_order: 'WORK ORDER',
  change_order: 'CHANGE ORDER',
  purchase_order: 'PURCHASE ORDER',
  proposal: 'PROPOSAL',
  contract: 'SERVICE AGREEMENT',
  inspection: 'INSPECTION REPORT',
}

const TYPE_SUBTITLES: Record<string, string> = {
  estimate: 'PROJECT COST ESTIMATE',
  invoice: 'PAYMENT INVOICE',
  work_order: 'FIELD WORK ORDER',
  change_order: 'CONTRACT CHANGE ORDER',
  purchase_order: 'PURCHASE ORDER',
  proposal: 'SERVICE PROPOSAL',
  contract: 'RETAINER & PRICING SCHEDULE',
  inspection: 'PROPERTY INSPECTION & ASSESSMENT',
}

interface ThemeConfig {
  primary: string
  accent: string
  accentMuted: string
  tableBorder: string
  metaBg: string
  calloutBg: string
  calloutBorder: string
}

export const DESIGN_THEMES: Record<DesignTheme, ThemeConfig> = {
  classic: {
    primary: '#1a1a1a',
    accent: '#8B7355',
    accentMuted: '#f5f2ee',
    tableBorder: '#e5e2de',
    metaBg: '#fafafa',
    calloutBg: '#f9f6f2',
    calloutBorder: '#8B7355',
  },
  corporate: {
    primary: '#0f172a',
    accent: '#1d4ed8',
    accentMuted: '#eff6ff',
    tableBorder: '#e2e8f0',
    metaBg: '#f8fafc',
    calloutBg: '#f0f7ff',
    calloutBorder: '#1d4ed8',
  },
  modern: {
    primary: '#111827',
    accent: '#0891b2',
    accentMuted: '#ecfeff',
    tableBorder: '#e5e7eb',
    metaBg: '#f9fafb',
    calloutBg: '#f0fdfe',
    calloutBorder: '#0891b2',
  },
}

export interface DocData {
  type: string
  documentNumber?: string
  clientName?: string
  clientAddress?: string
  clientEmail?: string
  clientPhone?: string
  dateIssued?: string
  dateDue?: string
  companyName?: string
  companyAddress?: string
  companyPhone?: string
  companyEmail?: string
  companyWebsite?: string
  lineItems?: any[]
  subtotal?: number
  taxRate?: number
  taxTotal?: number
  total?: number
  costTotal?: number
  profit?: number
  marginPercent?: number
  terms?: string
  notes?: string
  status?: string
}

export interface BrandSettings {
  tagline?: string
  licenseTag?: string
  logo?: string
  primaryColor?: string
  accentColor?: string
  designTheme?: DesignTheme
}

interface DocumentPreviewProps {
  doc: DocData
  brand?: BrandSettings
  viewMode?: 'internal' | 'external'
  className?: string
}

export default function DocumentPreview({
  doc,
  brand = {},
  viewMode = 'external',
  className = '',
}: DocumentPreviewProps) {
  const themeKey: DesignTheme = brand.designTheme || 'classic'
  const base = DESIGN_THEMES[themeKey]

  const theme: ThemeConfig = {
    ...base,
    primary: brand.primaryColor || base.primary,
    accent: brand.accentColor || base.accent,
  }

  const companyName = doc.companyName || 'Your Company'
  const tagline = brand.tagline || ''
  const licenseTag = brand.licenseTag || ''
  const showInternal = viewMode === 'internal'

  const items = doc.lineItems || []
  const subtotal = doc.subtotal ?? items.reduce((s, li) => s + (li.quantity || 1) * (li.price || li.unitPrice || 0), 0)
  const taxRate = doc.taxRate || 0
  const taxAmount = doc.taxTotal ?? (subtotal * taxRate / 100)
  const total = doc.total ?? (subtotal + taxAmount)
  const costTotal = doc.costTotal || 0
  const profit = doc.profit ?? (subtotal - costTotal)

  const isFinancial = !['proposal', 'contract', 'inspection'].includes(doc.type)
  const isInspection = doc.type === 'inspection'

  const metaRows = [
    { label: 'AGREEMENT PREPARED FOR', value: doc.clientName || '—' },
    { label: 'PREPARED BY', value: companyName },
    { label: 'DATE ISSUED', value: fmtDate(doc.dateIssued) },
    { label: 'AGREEMENT TYPE', value: TYPE_LABELS[doc.type] || 'DOCUMENT' },
    ...(doc.clientAddress ? [{ label: 'JURISDICTION / LOCATION', value: doc.clientAddress }] : []),
    ...(doc.documentNumber ? [{ label: 'DOCUMENT NO.', value: doc.documentNumber }] : []),
    ...(doc.dateDue ? [{ label: 'DUE DATE', value: fmtDate(doc.dateDue) }] : []),
  ]

  const headerTagline = [tagline, licenseTag].filter(Boolean).join(' · ')

  return (
    <div
      className={`bg-white text-gray-900 ${className}`}
      style={{ fontFamily: 'system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif', color: theme.primary }}
    >
      {/* ── PAGE BODY ── */}
      <div style={{ padding: '52px 60px 80px', minHeight: '11in', position: 'relative' }}>

        {/* ── HEADER ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 0 }}>
          {/* Left: logo / company */}
          <div>
            {brand.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={brand.logo} alt={companyName} style={{ height: 40, marginBottom: 4 }} />
            ) : (
              <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.5px', color: theme.primary, lineHeight: 1 }}>
                {companyName.toUpperCase()}
              </div>
            )}
            {headerTagline && (
              <div style={{ fontSize: 7.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: theme.accent, marginTop: 5 }}>
                {headerTagline}
              </div>
            )}
          </div>

          {/* Right: POWERED BY PROJEX badge */}
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 6.5, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#aaa', marginBottom: 2 }}>
              POWERED BY
            </div>
            <div style={{ fontSize: 14, fontWeight: 900, color: theme.primary, letterSpacing: '-0.3px' }}>
              PROJEX.live
            </div>
            <div style={{ fontSize: 6, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#aaa', marginTop: 2 }}>
              CONSTRUCTION MANAGEMENT PLATFORM
            </div>
          </div>
        </div>

        {/* Accent rule */}
        <div style={{
          height: 2,
          marginTop: 14,
          marginBottom: 22,
          background: `linear-gradient(to right, ${theme.accent}, ${theme.accent}60, transparent)`,
        }} />

        {/* ── DOCUMENT TITLE ── */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: theme.primary, marginBottom: 4 }}>
            {TYPE_LABELS[doc.type] || 'DOCUMENT'}
          </div>
          {TYPE_SUBTITLES[doc.type] && (
            <div style={{ fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#999' }}>
              {TYPE_SUBTITLES[doc.type]}
            </div>
          )}
        </div>

        {/* ── META TABLE ── */}
        <div style={{ border: '1px solid #e0e0e0', borderRadius: 2, marginBottom: 22, overflow: 'hidden' }}>
          {metaRows.map((row, i) => (
            <div
              key={row.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                borderBottom: i < metaRows.length - 1 ? '1px solid #ebebeb' : 'none',
                background: i % 2 === 0 ? '#fff' : theme.metaBg,
              }}
            >
              <div style={{ width: '38%', padding: '7px 12px', fontSize: 7.5, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#888' }}>
                {row.label}
              </div>
              <div style={{ flex: 1, padding: '7px 12px', fontSize: 10, textAlign: 'right', color: i === 0 ? theme.accent : theme.primary, fontWeight: i === 0 ? 600 : 400 }}>
                {row.value}
              </div>
            </div>
          ))}
        </div>

        {/* ── FINANCIAL DOCUMENT: line items ── */}
        {isFinancial && items.length > 0 && (
          <FinancialSection
            items={items}
            subtotal={subtotal}
            taxRate={taxRate}
            taxAmount={taxAmount}
            total={total}
            costTotal={costTotal}
            profit={profit}
            showInternal={showInternal}
            theme={theme}
          />
        )}

        {/* ── INSPECTION ── */}
        {isInspection && <InspectionSection doc={doc} theme={theme} />}

        {/* ── TERMS & NOTES ── */}
        {isFinancial && (doc.terms || doc.notes) && (
          <div style={{ marginTop: 24, display: 'flex', gap: 24 }}>
            {doc.terms && !doc.terms.startsWith('{') && (
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 7, letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 700, color: theme.accent, marginBottom: 6 }}>
                  Terms &amp; Conditions
                </div>
                <div style={{ fontSize: 8.5, color: '#555', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{doc.terms}</div>
              </div>
            )}
            {doc.notes && !doc.notes.startsWith('{') && (
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 7, letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 700, color: theme.accent, marginBottom: 6 }}>
                  Notes
                </div>
                <div style={{ fontSize: 8.5, color: '#555', lineHeight: 1.6 }}>{doc.notes}</div>
              </div>
            )}
          </div>
        )}

        {/* ── INTERNAL PROFIT SUMMARY ── */}
        {showInternal && isFinancial && costTotal > 0 && (
          <div style={{
            marginTop: 20,
            padding: '10px 14px',
            background: theme.calloutBg,
            borderLeft: `3px solid ${theme.accent}`,
            borderRadius: 2,
          }}>
            <div style={{ fontSize: 7, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, color: theme.accent, marginBottom: 6 }}>
              Internal — Profit Summary
            </div>
            <div style={{ display: 'flex', gap: 28, fontSize: 9 }}>
              <span><span style={{ color: '#888' }}>Cost: </span><strong>{fmt(costTotal)}</strong></span>
              <span><span style={{ color: '#888' }}>Revenue: </span><strong>{fmt(subtotal)}</strong></span>
              <span><span style={{ color: '#888' }}>Profit: </span><strong style={{ color: profit >= 0 ? '#16a34a' : '#dc2626' }}>{fmt(profit)}</strong></span>
              {subtotal > 0 && (
                <span><span style={{ color: '#888' }}>Margin: </span><strong style={{ color: profit >= 0 ? '#16a34a' : '#dc2626' }}>{((profit / subtotal) * 100).toFixed(1)}%</strong></span>
              )}
            </div>
          </div>
        )}

        {/* ── SIGNATURE BLOCK (external only) ── */}
        {!showInternal && (
          <div style={{ marginTop: 40, paddingTop: 16, borderTop: `1px solid ${theme.tableBorder}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 40 }}>
              {[
                { label: `${companyName} — Authorized Representative`, name: '' },
                { label: `${doc.clientName || 'Client'} — Authorized Representative`, name: '' },
              ].map((sig, i) => (
                <div key={i} style={{ flex: 1 }}>
                  <div style={{ height: 32 }} />
                  <div style={{ borderTop: `1px solid ${theme.primary}`, paddingTop: 6 }}>
                    <div style={{ fontSize: 7.5, color: '#888', marginBottom: 2 }}>{sig.label}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 7.5, color: '#888' }}>
                      <span>Signature</span>
                      <span>Date: ________________</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── FOOTER ── */}
        <div style={{ position: 'absolute', bottom: 28, left: 60, right: 60 }}>
          <div style={{ height: 1, background: `${theme.accent}40`, marginBottom: 8 }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 6.5, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#aaa' }}>
            <span>{[companyName, licenseTag || 'PROJEX.LIVE'].filter(Boolean).join(' · ')}</span>
            <span>{[doc.documentNumber, 'CONFIDENTIAL'].filter(Boolean).join(' · ')}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Financial line items table ──────────────────────────────────────────────

interface FinancialSectionProps {
  items: any[]
  subtotal: number
  taxRate: number
  taxAmount: number
  total: number
  costTotal: number
  profit: number
  showInternal: boolean
  theme: ThemeConfig
}

function FinancialSection({ items, subtotal, taxRate, taxAmount, total, costTotal, profit, showInternal, theme }: FinancialSectionProps) {
  const cols = showInternal
    ? { grid: '1fr 44px 44px 60px 50px 64px 72px', headers: ['Description', 'Qty', 'Unit', 'Cost', 'Mkp%', 'Price', 'Amount'] }
    : { grid: '1fr 44px 44px 68px 72px', headers: ['Description', 'Qty', 'Unit', 'Price', 'Amount'] }

  return (
    <div>
      {/* Table header rule */}
      <div style={{ borderBottom: `1.5px solid ${theme.primary}`, paddingBottom: 8, marginBottom: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: cols.grid, gap: 8, fontSize: 7.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#888' }}>
          {cols.headers.map((h, i) => (
            <span key={h} style={{ textAlign: i === 0 ? 'left' : 'right' }}>{h}</span>
          ))}
        </div>
      </div>

      {/* Rows */}
      {items.map((li, idx) => {
        const price = li.price || li.unitPrice || 0
        const qty = li.quantity || 1
        const amount = qty * price
        const cost = li.cost || 0
        const markupPct = li.markup != null ? `${Math.round(li.markup)}%` : '—'

        return (
          <div
            key={li.id || idx}
            style={{
              display: 'grid',
              gridTemplateColumns: cols.grid,
              gap: 8,
              padding: '7px 0',
              borderBottom: `0.5px solid ${theme.tableBorder}`,
              fontSize: 9,
              color: theme.primary,
              alignItems: 'center',
            }}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{li.description || '—'}</span>
            <span style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{qty}</span>
            <span style={{ textAlign: 'right', color: '#888' }}>{li.unit || 'ea'}</span>
            {showInternal && <span style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: '#777' }}>{fmt(cost)}</span>}
            {showInternal && <span style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: '#b45309' }}>{markupPct}</span>}
            <span style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(price)}</span>
            <span style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{fmt(amount)}</span>
          </div>
        )
      })}

      {/* Totals */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
        <div style={{ width: 200, fontSize: 9 }}>
          {showInternal && costTotal > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#888', paddingBottom: 3 }}>
              <span>Total Cost</span><span style={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(costTotal)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666', paddingBottom: 3 }}>
            <span>Subtotal</span><span style={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(subtotal)}</span>
          </div>
          {taxRate > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666', paddingBottom: 3 }}>
              <span>Tax ({taxRate}%)</span><span style={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(taxAmount)}</span>
            </div>
          )}
          <div style={{
            display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 11,
            borderTop: `1.5px solid ${theme.primary}`, paddingTop: 6, marginTop: 4,
          }}>
            <span>Total</span><span style={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(total)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Inspection section ──────────────────────────────────────────────────────

function InspectionSection({ doc, theme }: { doc: DocData; theme: ThemeConfig }) {
  let meta: any = {}
  try { meta = JSON.parse(doc.terms || '{}') } catch { /* noop */ }

  const sections = (doc.lineItems || []).filter((li: any) => li.description?.startsWith('__section__:'))

  if (sections.length === 0) {
    return (
      <div style={{ marginTop: 12, fontSize: 9, color: '#888' }}>No inspection items recorded.</div>
    )
  }

  return (
    <div style={{ marginTop: 4 }}>
      {sections.map((section: any, si: number) => {
        const sTitle = section.description.replace('__section__:', '')
        const sItems = section.items || []

        return (
          <div key={si} style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: theme.primary, marginBottom: 4 }}>{sTitle}</div>
            <div style={{ borderTop: `0.5px solid ${theme.tableBorder}` }}>
              {sItems.map((item: any, idx: number) => {
                const ans = item.answer || ''
                const isPass = ans === 'pass' || ans === 'yes'
                const isFail = ans === 'fail' || ans === 'no'
                const isNA = ans === 'na'

                return (
                  <div key={idx} style={{
                    display: 'flex', alignItems: 'center', padding: '5px 0',
                    borderBottom: `0.5px solid ${theme.tableBorder}`, gap: 8, fontSize: 9,
                  }}>
                    <span style={{ color: '#bbb', width: 18, flexShrink: 0 }}>{idx + 1}</span>
                    <span style={{ flex: 1, color: theme.primary }}>{item.question || '—'}</span>
                    {item.notes && <span style={{ fontSize: 8, color: '#999', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.notes}</span>}
                    <span style={{
                      fontWeight: 700, fontSize: 8, width: 36, textAlign: 'right',
                      color: isPass ? '#16a34a' : isFail ? '#dc2626' : isNA ? '#999' : theme.primary,
                    }}>
                      {isPass ? 'PASS' : isFail ? 'FAIL' : isNA ? 'N/A' : ans || '—'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Theme preview mini-card (used in settings) ──────────────────────────────

export function ThemePreviewCard({
  theme,
  label,
  selected,
  onClick,
}: {
  theme: DesignTheme
  label: string
  selected: boolean
  onClick: () => void
}) {
  const t = DESIGN_THEMES[theme]
  return (
    <button
      onClick={onClick}
      className={`relative rounded-xl overflow-hidden border-2 transition-all text-left ${selected ? 'shadow-md' : 'hover:border-gray-300'}`}
      style={{ borderColor: selected ? t.accent : '#e5e7eb' }}
    >
      {/* Mini document preview */}
      <div className="bg-white p-3" style={{ height: 100 }}>
        {/* Header bar */}
        <div className="flex justify-between items-start mb-1.5">
          <div>
            <div className="font-black text-[8px]" style={{ color: t.primary }}>COMPANY</div>
            <div className="text-[5px]" style={{ color: t.accent }}>LICENSED & BONDED</div>
          </div>
          <div className="text-right">
            <div className="text-[5px] text-gray-400">POWERED BY</div>
            <div className="font-bold text-[6px]" style={{ color: t.primary }}>PROJEX.live</div>
          </div>
        </div>
        <div className="h-[1px] mb-1.5" style={{ background: `linear-gradient(to right, ${t.accent}, transparent)` }} />
        <div className="text-[7px] font-semibold mb-1" style={{ color: t.primary }}>ESTIMATE</div>
        {/* Mini table */}
        <div className="border rounded-sm overflow-hidden" style={{ borderColor: '#e5e5e5' }}>
          {['Prepared For', 'Date', 'Doc #'].map((r, i) => (
            <div key={r} className="flex" style={{ background: i % 2 === 0 ? '#fff' : t.metaBg, borderBottom: i < 2 ? '0.5px solid #ebebeb' : 'none' }}>
              <div className="text-[5px] text-gray-400 px-1.5 py-0.5 w-[45%]">{r}</div>
              <div className="text-[5px] px-1.5 py-0.5" style={{ color: i === 0 ? t.accent : t.primary }}>—</div>
            </div>
          ))}
        </div>
      </div>
      {/* Label */}
      <div className="px-3 py-1.5 border-t" style={{ borderColor: '#f0f0f0', background: selected ? t.accentMuted : '#fafafa' }}>
        <div className="text-xs font-semibold" style={{ color: selected ? t.accent : '#374151' }}>{label}</div>
      </div>
      {selected && (
        <div className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: t.accent }}>
          <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </button>
  )
}
