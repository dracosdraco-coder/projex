'use client'

// ============================================
// PDF GENERATION — Client-side with jsPDF
// Generates real downloadable PDFs
// CRITICAL: Margins/costs NEVER shown to clients
// ============================================

import jsPDF from 'jspdf'
import * as pdfjsLib from 'pdfjs-dist'

// Use CDN worker matching installed version — no build config needed
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`
}

async function renderPdfToImages(dataUrl: string, pageW: number, pageH: number): Promise<string[]> {
  const images: string[] = []
  try {
    const base64 = dataUrl.split(',')[1]
    const binary = atob(base64)
    const array = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i)
    const pdfDoc = await pdfjsLib.getDocument({ data: array }).promise
    for (let p = 1; p <= pdfDoc.numPages; p++) {
      const page = await pdfDoc.getPage(p)
      const nativeVp = page.getViewport({ scale: 1 })
      const scale = (pageW / nativeVp.width) * 1.5
      const vp = page.getViewport({ scale })
      const canvas = document.createElement('canvas')
      canvas.width = vp.width; canvas.height = vp.height
      await page.render({ canvasContext: canvas.getContext('2d')!, viewport: vp }).promise
      images.push(canvas.toDataURL('image/jpeg', 0.92))
    }
  } catch (e) { console.warn('PDF render failed', e) }
  return images
}

const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0)

function getBrandRgb(): [number, number, number] {
  const hex = (typeof window !== 'undefined' ? localStorage.getItem('projex_brand_color') : null) || '#2563eb'
  const clean = hex.replace('#', '')
  return [parseInt(clean.slice(0, 2), 16), parseInt(clean.slice(2, 4), 16), parseInt(clean.slice(4, 6), 16)]
}

const TYPE_LABELS: Record<string, string> = {
  estimate: 'ESTIMATE', invoice: 'INVOICE', work_order: 'WORK ORDER',
  change_order: 'CHANGE ORDER', purchase_order: 'PURCHASE ORDER',
  proposal: 'PROPOSAL', contract: 'CONTRACT', inspection: 'INSPECTION',
}

export async function generateDocumentPDF(doc: any): Promise<string> {
  if (doc.type === 'inspection') return generateInspectionPDF(doc)
  if (doc.type === 'proposal' || doc.type === 'contract') return generateProposalPDF(doc)
  return generateFinancialPDF(doc)
}

// Stub — kept for import compatibility
export function saveProjectXFormat(_document: any, _outputPath?: string): void {
  // no-op in client-side mode
}

// ---- Financial documents (estimate, invoice, work order, etc.) ----

async function generateFinancialPDF(doc: any): Promise<string> {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' })
  const W = pdf.internal.pageSize.getWidth()
  const H = pdf.internal.pageSize.getHeight()
  const M = 36
  let y = M

  const checkPage = (need: number) => { if (y + need > H - M) { pdf.addPage(); y = M } }

  const [aR, aG, aB] = getBrandRgb()

  // Accent top bar
  pdf.setFillColor(aR, aG, aB); pdf.rect(0, 0, W, 5, 'F')
  y = M + 8

  // Company header (left)
  const headerY = y
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(13); pdf.setTextColor(17, 24, 39)
  pdf.text(doc.companyName || 'Company', M, y); y += 14
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8.5); pdf.setTextColor(107, 114, 128)
  if (doc.companyAddress) { pdf.text(doc.companyAddress, M, y); y += 11 }
  if (doc.companyPhone) { pdf.text(doc.companyPhone, M, y); y += 11 }
  if (doc.companyEmail) { pdf.text(doc.companyEmail, M, y); y += 11 }

  // Doc type + meta (top right) — dark and prominent
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(18); pdf.setTextColor(17, 24, 39)
  pdf.text(TYPE_LABELS[doc.type] || 'DOCUMENT', W - M, headerY, { align: 'right' })
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.setTextColor(107, 114, 128)
  pdf.text(`#${doc.documentNumber || '—'}`, W - M, headerY + 16, { align: 'right' })
  pdf.text(`Issued ${doc.dateIssued || '—'}`, W - M, headerY + 27, { align: 'right' })
  if (doc.dateDue) {
    pdf.setTextColor(234, 88, 12)
    pdf.text(`Due ${doc.dateDue}`, W - M, headerY + 38, { align: 'right' })
  }

  y = Math.max(y, headerY + 52) + 12
  // Header divider
  pdf.setDrawColor(229, 231, 235); pdf.setLineWidth(0.5); pdf.line(M, y, W - M, y); y += 16

  // Bill To (left) + Amount Due (right)
  const blockY = y
  // Split multi-line address (user can type Enter in the address field)
  const addrLines: string[] = doc.clientAddress
    ? doc.clientAddress.split('\n').flatMap((l: string) => pdf.splitTextToSize(l.trim(), W / 2 - M - 20) as string[])
    : []
  const blockH = Math.max(42, 30 + addrLines.length * 11)

  pdf.setFillColor(aR, aG, aB); pdf.rect(M, blockY, 3, blockH, 'F')
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(7.5); pdf.setTextColor(156, 163, 175)
  pdf.text(doc.type === 'invoice' ? 'BILL TO' : 'PREPARED FOR', M + 8, blockY + 11)
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(10.5); pdf.setTextColor(17, 24, 39)
  pdf.text(doc.clientName || '—', M + 8, blockY + 24)
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8.5); pdf.setTextColor(107, 114, 128)
  addrLines.forEach((line: string, i: number) => pdf.text(line, M + 8, blockY + 36 + i * 11))

  // Amount Due (right) — the number clients look at first
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(7.5); pdf.setTextColor(156, 163, 175)
  pdf.text('AMOUNT DUE', W - M, blockY + 11, { align: 'right' })
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(20); pdf.setTextColor(aR, aG, aB)
  pdf.text(fmt(doc.total || 0), W - M, blockY + 30, { align: 'right' })
  if (doc.dateDue) {
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.setTextColor(156, 163, 175)
    pdf.text(`due ${doc.dateDue}`, W - M, blockY + 42, { align: 'right' })
  }

  y = blockY + blockH + 16

  // Scope of Work
  const sowText = (doc.scopeOfWork || '').trim()
  if (sowText) {
    checkPage(30)
    pdf.setDrawColor(229, 231, 235); pdf.setLineWidth(0.5); pdf.line(M, y, W - M, y); y += 12
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(7.5); pdf.setTextColor(156, 163, 175)
    pdf.text('SCOPE OF WORK', M, y); y += 10
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); pdf.setTextColor(55, 65, 81)
    const sowLines = sowText.split('\n')
    sowLines.forEach((line: string) => {
      if (!line.trim()) { y += 4; return }
      const isBullet = /^[-•]\s/.test(line)
      const text = isBullet ? line.replace(/^[-•]\s+/, '') : line
      const wrapped: string[] = pdf.splitTextToSize(text, W - M * 2 - (isBullet ? 10 : 0))
      checkPage(wrapped.length * 12 + 4)
      if (isBullet) {
        pdf.setFillColor(aR, aG, aB); pdf.circle(M + 3, y - 2.5, 2, 'F')
        wrapped.forEach((l: string, wi: number) => { pdf.text(l, M + 9, y + wi * 12); })
      } else {
        wrapped.forEach((l: string, wi: number) => { pdf.text(l, M, y + wi * 12) })
      }
      y += wrapped.length * 12 + 2
    })
    y += 6
  }

  // Line items table
  const allItems = doc.lineItems || []
  const colDesc = M
  const colQty = M + 295
  const colUnit = M + 340
  const colPrice = M + 395
  const colAmt = W - M

  pdf.setDrawColor(17, 24, 39); pdf.setLineWidth(1.5); pdf.line(M, y, W - M, y); y += 13
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(7.5); pdf.setTextColor(107, 114, 128)
  pdf.text('DESCRIPTION', colDesc, y)
  pdf.text('QTY', colQty, y)
  pdf.text('UNIT', colUnit, y)
  pdf.text('PRICE', colPrice, y)
  pdf.text('AMOUNT', colAmt, y, { align: 'right' })
  y += 7; pdf.setDrawColor(17, 24, 39); pdf.setLineWidth(0.5); pdf.line(M, y, W - M, y); y += 5

  // Group items by section
  const hasSections = allItems.some((li: any) => li.type === 'section')
  const groups: Array<{ title: string; items: any[]; subtotal: number }> = []
  let curGroup: { title: string; items: any[]; subtotal: number } | null = null
  for (const li of allItems) {
    if (li.type === 'section') {
      curGroup = { title: li.description || 'Section', items: [], subtotal: 0 }
      groups.push(curGroup)
    } else {
      if (!curGroup) { curGroup = { title: '', items: [], subtotal: 0 }; groups.push(curGroup) }
      curGroup.items.push(li)
      curGroup.subtotal += (li.quantity || 0) * (li.price || li.unitPrice || 0)
    }
  }

  let globalRowIdx = 0
  const renderItem = (li: any, indent = 0) => {
    const descLines: string[] = pdf.splitTextToSize(li.description || '—', colQty - colDesc - indent - 10)
    const extraLines = descLines.length - 1
    const rowH = 16 + extraLines * 12
    checkPage(rowH + 6)

    // Alternating row fill
    if (globalRowIdx % 2 === 0) {
      pdf.setFillColor(248, 249, 250)
      pdf.rect(M, y, W - M * 2, rowH, 'F')
    }
    globalRowIdx++

    y += 12
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); pdf.setTextColor(31, 41, 55)
    descLines.forEach((line: string, i: number) => pdf.text(line, colDesc + indent, y + i * 12))
    pdf.setFontSize(8.5); pdf.setTextColor(75, 85, 99)
    pdf.text(String(li.quantity || 0), colQty, y)
    pdf.text(li.unit || 'ea', colUnit, y)
    pdf.text(fmt(li.price || li.unitPrice || 0), colPrice, y)
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.setTextColor(17, 24, 39)
    pdf.text(fmt((li.quantity || 0) * (li.price || li.unitPrice || 0)), colAmt, y, { align: 'right' })
    y += extraLines * 12 + (rowH - 12 - extraLines * 12)

    // Row border — visible but subtle
    pdf.setDrawColor(209, 213, 219); pdf.setLineWidth(0.4)
    pdf.line(M, y, W - M, y)
  }

  groups.forEach(group => {
    if (group.title) {
      checkPage(28)
      y += 10
      // Section header band with left accent bar
      pdf.setFillColor(Math.round(aR * 0.1 + 240), Math.round(aG * 0.1 + 240), Math.round(aB * 0.1 + 240))
      pdf.rect(M, y, W - M * 2, 18, 'F')
      pdf.setFillColor(aR, aG, aB); pdf.rect(M, y, 3, 18, 'F')
      pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8); pdf.setTextColor(aR, aG, aB)
      pdf.text(group.title.toUpperCase(), M + 9, y + 11.5)
      y += 18 + 2
    }
    group.items.forEach((li: any) => renderItem(li, group.title ? 8 : 0))
    if (hasSections && group.title && group.items.length > 0) {
      // Subtotal row
      checkPage(20)
      pdf.setFillColor(243, 244, 246); pdf.rect(M, y, W - M * 2, 18, 'F')
      pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8); pdf.setTextColor(107, 114, 128)
      pdf.text(`${group.title.toUpperCase()} SUBTOTAL`, colPrice, y + 12, { align: 'right' })
      pdf.setFontSize(9); pdf.setTextColor(17, 24, 39)
      pdf.text(fmt(group.subtotal), colAmt, y + 12, { align: 'right' })
      y += 18 + 4
    }
  })

  y += 20

  // Totals
  const tx = W - M - 155
  checkPage(60)
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); pdf.setTextColor(107, 114, 128)
  pdf.text('Subtotal', tx, y); pdf.text(fmt(doc.subtotal || 0), colAmt, y, { align: 'right' }); y += 13
  if ((doc.taxRate || 0) > 0 || (doc.taxTotal || 0) > 0) {
    pdf.text(`Tax (${doc.taxRate || 0}%)`, tx, y); pdf.text(fmt(doc.taxTotal || 0), colAmt, y, { align: 'right' }); y += 13
  }
  pdf.setDrawColor(aR, aG, aB); pdf.setLineWidth(1.5); pdf.line(tx, y, colAmt, y); y += 14
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11); pdf.setTextColor(17, 24, 39)
  pdf.text('Total', tx, y)
  pdf.setTextColor(aR, aG, aB)
  pdf.text(fmt(doc.total || 0), colAmt, y, { align: 'right' }); y += 28

  // Terms / Notes — side by side, fine print weight
  const termsText = doc.terms || ''
  const hasTerms = !!(termsText && !termsText.startsWith('{'))
  const hasNotes = !!(doc.notes && !doc.notes.startsWith('{') && doc.notes.length < 500)

  if (hasTerms || hasNotes) {
    checkPage(50)
    pdf.setDrawColor(229, 231, 235); pdf.setLineWidth(0.5); pdf.line(M, y, W - M, y); y += 14

    const midX = W / 2 + 10
    const colW = hasTerms && hasNotes ? midX - M - 15 : W - M * 2

    if (hasTerms) {
      pdf.setFont('helvetica', 'bold'); pdf.setFontSize(7.5); pdf.setTextColor(156, 163, 175)
      pdf.text('TERMS', M, y)
    }
    if (hasNotes) {
      pdf.setFont('helvetica', 'bold'); pdf.setFontSize(7.5); pdf.setTextColor(156, 163, 175)
      pdf.text('NOTES', hasTerms ? midX : M, y)
    }
    y += 12

    const textStartY = y
    if (hasTerms) {
      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8.5); pdf.setTextColor(107, 114, 128)
      pdf.splitTextToSize(termsText, colW).forEach((line: string) => { checkPage(12); pdf.text(line, M, y); y += 11 })
    }
    if (hasNotes) {
      let noteY = textStartY
      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8.5); pdf.setTextColor(107, 114, 128)
      pdf.splitTextToSize(doc.notes, colW).forEach((line: string) => { pdf.text(line, hasTerms ? midX : M, noteY); noteY += 11 })
      y = Math.max(y, noteY)
    }
  }

  // Signature block
  checkPage(80)
  y += 10
  pdf.setDrawColor(229, 231, 235); pdf.setLineWidth(0.5); pdf.line(M, y, W - M, y); y += 22
  const sigMid = W / 2 + 10
  const sigW = sigMid - M - 20
  pdf.setDrawColor(156, 163, 175); pdf.setLineWidth(0.5)
  pdf.line(M, y + 28, M + sigW, y + 28)
  pdf.line(sigMid, y + 28, sigMid + sigW, y + 28)
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(7); pdf.setTextColor(156, 163, 175)
  pdf.text('CLIENT SIGNATURE / DATE', M, y + 36)
  pdf.text('AUTHORIZED SIGNATURE / DATE', sigMid, y + 36)
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.setTextColor(107, 114, 128)
  pdf.text(doc.clientName || '—', M, y + 44)
  pdf.text(doc.companyName || '—', sigMid, y + 44)

  // Photo attachments — full-bleed page per photo
  for (const a of (doc.attachments || []).filter((a: any) => a.type === 'photo')) {
    pdf.addPage()
    const imgFormat = (a.mimeType || '').includes('png') ? 'PNG' : 'JPEG'
    try { pdf.addImage(a.data, imgFormat, 0, 0, W, H, undefined, 'FAST') } catch { /* skip unsupported */ }
  }

  // PDF attachments — render each page via pdfjs → canvas → image
  for (const a of (doc.attachments || []).filter((a: any) => a.type === 'pdf')) {
    const images = await renderPdfToImages(a.data, W, H)
    for (const imgData of images) {
      pdf.addPage()
      pdf.addImage(imgData, 'JPEG', 0, 0, W, H, undefined, 'FAST')
    }
  }

  const filename = `${doc.documentNumber || doc.type || 'document'}.pdf`
  pdf.save(filename)
  return filename
}

// ---- Inspection documents ----

function generateInspectionPDF(doc: any): string {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' })
  const W = pdf.internal.pageSize.getWidth()
  const H = pdf.internal.pageSize.getHeight()
  const M = 50
  let y = M

  const checkPage = (need: number) => { if (y + need > H - M) { pdf.addPage(); y = M } }

  let meta: any = {}
  try { meta = JSON.parse(doc.terms || '{}') } catch { /* noop */ }

  // Title
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(18); pdf.setTextColor(30, 30, 30)
  pdf.text(meta.title || doc.documentNumber || 'Inspection Report', W / 2, y, { align: 'center' }); y += 20

  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); pdf.setTextColor(100, 100, 100)
  const info = `Inspector: ${meta.inspector || doc.companyName || '—'}    Date: ${doc.dateIssued || '—'}    Location: ${meta.location || doc.notes || '—'}`
  pdf.text(info, W / 2, y, { align: 'center' }); y += 10

  pdf.setDrawColor(30, 30, 30); pdf.setLineWidth(1.5); pdf.line(M, y, W - M, y); y += 20

  // Sections
  const sections = (doc.lineItems || []).filter((li: any) => li.description?.startsWith('__section__:'))

  sections.forEach((section: any) => {
    const sTitle = section.description.replace('__section__:', '')
    const items = section.items || []

    checkPage(40)
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11); pdf.setTextColor(30, 30, 30)
    pdf.text(sTitle, M, y); y += 4
    pdf.setDrawColor(200, 200, 200); pdf.setLineWidth(0.5); pdf.line(M, y, W - M, y); y += 14

    items.forEach((item: any, idx: number) => {
      checkPage(18)
      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9)
      pdf.setTextColor(150, 150, 150); pdf.text(String(idx + 1), M, y)
      pdf.setTextColor(30, 30, 30); pdf.text((item.question || '—').substring(0, 55), M + 20, y, { maxWidth: 280 })

      const ans = item.answer || ''
      if (ans === 'pass' || ans === 'yes') {
        pdf.setTextColor(22, 163, 74); pdf.setFont('helvetica', 'bold'); pdf.text('PASS', W - M - 100, y)
      } else if (ans === 'fail' || ans === 'no') {
        pdf.setTextColor(220, 38, 38); pdf.setFont('helvetica', 'bold'); pdf.text('FAIL', W - M - 100, y)
      } else if (ans === 'na') {
        pdf.setTextColor(150, 150, 150); pdf.text('N/A', W - M - 100, y)
      } else if (ans) {
        pdf.setTextColor(80, 80, 80); pdf.text(ans, W - M - 100, y)
      } else {
        pdf.setTextColor(200, 200, 200); pdf.text('—', W - M - 100, y)
      }

      if (item.notes) {
        pdf.setFont('helvetica', 'normal'); pdf.setTextColor(130, 130, 130); pdf.setFontSize(8)
        pdf.text(item.notes.substring(0, 30), W - M, y, { align: 'right' })
      }

      y += 16
      pdf.setDrawColor(240, 240, 240); pdf.setLineWidth(0.3); pdf.line(M + 20, y - 4, W - M, y - 4)
    })
    y += 10
  })

  // Signatures
  checkPage(80); y += 20
  pdf.setDrawColor(30, 30, 30); pdf.setLineWidth(0.5)
  pdf.line(M, y + 30, M + 200, y + 30)
  pdf.line(W - M - 200, y + 30, W - M, y + 30)
  pdf.setFontSize(8); pdf.setTextColor(150, 150, 150)
  pdf.text('Inspector Signature', M, y + 42)
  pdf.text('Client/Owner Signature', W - M - 200, y + 42)

  const filename = `${doc.documentNumber || 'inspection'}.pdf`
  pdf.save(filename)
  return filename
}

// ---- Proposals & Contracts ----

function generateProposalPDF(doc: any): string {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' })
  const W = pdf.internal.pageSize.getWidth()
  const H = pdf.internal.pageSize.getHeight()
  const M = 60
  let y = M

  const checkPage = (need: number) => { if (y + need > H - M) { pdf.addPage(); y = M } }

  let meta: any = {}
  try { meta = JSON.parse(doc.terms || '{}') } catch { /* noop */ }

  // Cover page
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10); pdf.setTextColor(150, 150, 150)
  pdf.text(doc.type === 'contract' ? 'SERVICE AGREEMENT' : 'PROPOSAL', M, y); y += 30

  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(28); pdf.setTextColor(30, 30, 30)
  const title = meta.title || doc.documentNumber || 'Proposal'
  const titleLines = pdf.splitTextToSize(title, W - M * 2)
  titleLines.forEach((line: string) => { pdf.text(line, M, y); y += 34 })

  if (meta.projectName) {
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(14); pdf.setTextColor(100, 100, 100)
    pdf.text(meta.projectName, M, y); y += 30
  }

  // Prepared by/for at bottom of cover
  y = H - 200
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8); pdf.setTextColor(150, 150, 150)
  pdf.text('PREPARED BY', M, y); pdf.text('PREPARED FOR', W / 2 + 20, y); y += 14
  pdf.setFontSize(11); pdf.setTextColor(30, 30, 30)
  pdf.text(doc.companyName || '—', M, y); pdf.text(doc.clientName || '—', W / 2 + 20, y); y += 14
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); pdf.setTextColor(100, 100, 100)
  if (meta.companyAddress || doc.companyAddress) pdf.text(meta.companyAddress || doc.companyAddress, M, y)
  if (meta.clientAddress || doc.clientAddress) pdf.text(meta.clientAddress || doc.clientAddress, W / 2 + 20, y)
  y += 20
  pdf.setFontSize(9); pdf.setTextColor(150, 150, 150)
  pdf.text(meta.date || doc.dateIssued || '', M, y)

  // Cover border
  pdf.setDrawColor(30, 30, 30); pdf.setLineWidth(3); pdf.line(M, H - 140, W - M, H - 140)

  // Content pages
  pdf.addPage(); y = M

  const sections = meta.sections || (doc.lineItems || []).map((li: any) => {
    const desc = li.description || ''
    if (desc.startsWith('__section__:')) {
      const parts = desc.replace('__section__:', '').split(':')
      return { type: parts[0] || 'text', title: parts[1] || '', content: li.content || '' }
    }
    return { type: 'text', title: '', content: li.content || li.description || '' }
  })

  sections.forEach((s: any) => {
    if (s.type === 'pagebreak') { pdf.addPage(); y = M; return }

    if (s.type === 'heading') {
      checkPage(30)
      pdf.setFont('helvetica', 'bold'); pdf.setFontSize(14); pdf.setTextColor(30, 30, 30)
      pdf.text(s.title || '', M, y); y += 6
      pdf.setDrawColor(220, 220, 220); pdf.setLineWidth(0.5); pdf.line(M, y, W - M, y); y += 18
      return
    }

    if (s.content) {
      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10); pdf.setTextColor(60, 60, 60)
      const lines = pdf.splitTextToSize(s.content, W - M * 2)
      lines.forEach((line: string) => { checkPage(14); pdf.text(line, M, y); y += 14 })
      y += 10
    }
  })

  // Signature block
  checkPage(100); y += 30
  pdf.setDrawColor(200, 200, 200); pdf.setLineWidth(0.5); pdf.line(M, y, W - M, y); y += 30

  pdf.setDrawColor(30, 30, 30); pdf.setLineWidth(0.5)
  pdf.line(M, y + 40, M + 200, y + 40)
  pdf.line(W - M - 200, y + 40, W - M, y + 40)

  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.setTextColor(150, 150, 150)
  pdf.text('Company Representative', M, y + 52)
  pdf.text('Client', W - M - 200, y + 52)
  pdf.setFontSize(9); pdf.setTextColor(80, 80, 80)
  pdf.text(doc.companyName || '', M, y + 64)
  pdf.text(doc.clientName || '', W - M - 200, y + 64)
  pdf.setFontSize(8); pdf.setTextColor(150, 150, 150)
  pdf.text('Date: ____________', M, y + 80)
  pdf.text('Date: ____________', W - M - 200, y + 80)

  const filename = `${doc.documentNumber || doc.type || 'proposal'}.pdf`
  pdf.save(filename)
  return filename
}
