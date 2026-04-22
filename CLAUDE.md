# PROJEX — Claude Code Reference

## Stack
- **Framework**: Next.js 14 App Router, TypeScript, Tailwind CSS
- **Auth/DB**: Supabase (`@supabase/ssr`) — browser client in hooks/components, server client in API routes
- **PDF**: jsPDF (`src/lib/pdf-generator.ts`)
- **State**: localStorage for templates, brand settings, document packages — no global state library
- **Icons**: lucide-react only

## Critical Rules
- **Never call `createBrowserClient` at module level** — SSR prerender crashes. Always call inside a function/hook.
- `src/lib/supabase.ts` exports a singleton `supabase` client (safe, uses placeholder fallback for prerender).
- All Supabase `load*` functions in hooks **must return silently on error** (never throw) — one throw crashes all data loads.
- `get_next_document_number` RPC may not exist — always have a timestamp fallback.

## Key Files

| File | Purpose |
|------|---------|
| `src/app/access/AccessClient.tsx` | Main app shell — 1900 lines, renders all card content via switch on active card |
| `src/hooks/useDocuments.ts` | CRUD for `GeneratedDocument` — localStorage + Supabase |
| `src/hooks/useTemplates.ts` | Company info, line item templates, form templates — localStorage |
| `src/hooks/useCompanySettings.ts` | Reads default company template, exposes brand settings |
| `src/components/DocumentEditor.tsx` | Edit/preview modal for financial docs (estimate, invoice, etc.) |
| `src/components/DocumentPreview.tsx` | Branded HTML renderer — exports `DocData`, `BrandSettings`, `DESIGN_THEMES`, `ThemePreviewCard` |
| `src/components/ProposalBuilder.tsx` | Editor for proposals and contracts (sections + attached PDFs) |
| `src/components/InspectionFormBuilder.tsx` | Inspection form editor |
| `src/components/cards/FormsContent.tsx` | Documents list UI — filter, grid/list view, action menus |
| `src/components/cards/SettingsContent.tsx` | Settings tabs including Branding tab |
| `src/types/templates.ts` | `CompanyInfoTemplate`, `DesignTheme`, brand fields |
| `src/types/index.ts` | Core types: `GeneratedDocument`, `AttachedPdf`, etc. |

## Data Shapes

### GeneratedDocument (localStorage key: `projex-generated-documents`)
```ts
{
  id: string
  type: 'estimate'|'invoice'|'work_order'|'change_order'|'purchase_order'|'proposal'|'contract'|'inspection'
  documentNumber: string
  clientName?: string
  lineItems?: LineItem[]
  subtotal?: number; taxRate?: number; taxTotal?: number; total?: number
  costTotal?: number; profit?: number
  terms?: string; notes?: string
  status: 'draft'|'sent'|'approved'|'paid'|'rejected'
  attachedPdfs?: { name: string; dataUrl: string }[]
  parentDocumentId?: string
  dateIssued?: string; dateDue?: string
}
```

### CompanyInfoTemplate (localStorage key: `projex-templates`, type `company_info`)
```ts
{
  id: string; name: string; companyName: string
  address?: string; phone?: string; email?: string; website?: string
  logo?: string          // base64 dataUrl
  tagline?: string
  licenseTag?: string
  primaryColor?: string  // hex
  accentColor?: string   // hex
  designTheme?: 'classic'|'corporate'|'modern'
}
```

### Document Packages (localStorage key: `projex-doc-packages`)
```ts
Record<string, string[]>  // packageName → array of GeneratedDocument IDs
```

## Design Themes (DocumentPreview)
- **classic**: olive/gold `#8B7355`, dark primary `#1a1a1a`
- **corporate**: navy/blue `#1d4ed8`, dark primary `#0f172a`
- **modern**: teal `#0891b2`, dark primary `#111827`

## DocumentPreview Props
```ts
<DocumentPreview
  doc={DocData}
  brand={BrandSettings}        // from useCompanySettings().settings
  viewMode="internal"|"external"
  linkedDocs={DocData[]}       // conjoined docs rendered after main doc
/>
```

## FormsContent Props
```ts
onCreateDocument(type: string)
onEditDocument(doc)
onDeleteDocument(id)
onDuplicateDocument?(doc)
onSendDocument?(doc)
onDownloadDocument?(doc)
onConvertDocument?(doc)
onPreviewDocument?(doc)   // full-screen branded preview
onConjoinDocument?(doc)   // open package builder modal
onOpenTemplates()
```

## Pending Features (next tasks)
1. **DocumentPreview multi-page** — Cover page → Content pages (running header) → Contract/Disclaimer page → Attached PDF iframes → Linked docs
2. **DocumentPackageModal** — checkbox list of all docs, save as named package to `projex-doc-packages`
3. **FormsContent** — wire `onPreviewDocument` and `onConjoinDocument` into action menu
4. **AccessClient** — add preview modal state, conjoin modal, pass `linkedDocs` to DocumentPreview

## Conventions
- Tailwind for layout/spacing; inline `style={{}}` for theme-driven colors in DocumentPreview
- No comments unless the WHY is non-obvious
- `'use client'` at top of every component/hook file
- API routes live in `src/app/api/` and use `createServerClient` from `src/lib/supabase-server.ts`
- PDF generation: `generateDocumentPDF(docData)` in `src/lib/pdf-generator.ts`
