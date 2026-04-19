'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import {
  Plug, Download, Upload, FileSpreadsheet, Calendar, DollarSign, MessageSquare,
  Globe, CheckCircle, AlertCircle, Loader2, FolderOpen, CheckSquare, Receipt,
  ArrowDownToLine, ArrowUpFromLine, X, ChevronRight, ExternalLink, RefreshCw, Unplug
} from 'lucide-react'

interface IntegrationsContentProps {
  projects: any[]
  tasks: any[]
  teamMembers: any[]
  userId?: string
  orgId?: string
  onBulkCreateProjects?: (data: any[]) => Promise<void>
  onBulkCreateTasks?: (data: any[]) => Promise<void>
  onBulkCreateExpenses?: (data: any[]) => Promise<void>
}

type ImportType = 'projects' | 'tasks' | 'expenses' | 'team' | null
type ExportType = 'projects' | 'tasks' | 'expenses' | 'team' | null

const INTEGRATIONS = [
  { id: 'csv', name: 'CSV Import / Export', desc: 'Bulk import projects, tasks, expenses from spreadsheets. Export your data anytime.', icon: FileSpreadsheet, status: 'available' as const, color: 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20' },
  { id: 'quickbooks', name: 'QuickBooks', desc: 'Sync invoices, expenses, and payments with QuickBooks Online.', icon: DollarSign, status: 'available' as const, color: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20' },
  { id: 'gcal', name: 'Google Calendar', desc: 'Sync project deadlines and meetings to Google Calendar.', icon: Calendar, status: 'available' as const, color: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20' },
  { id: 'twilio', name: 'SMS Notifications', desc: 'Send task reminders and project updates via text message.', icon: MessageSquare, status: 'coming' as const, color: 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/20' },
  { id: 'portal', name: 'Client Portal', desc: 'Shareable links for clients to view projects, approve docs, and make payments.', icon: Globe, status: 'available' as const, color: 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/20' },
]

const CSV_TEMPLATES: Record<string, { headers: string[]; example: string[][] }> = {
  projects: {
    headers: ['name', 'description', 'status', 'client_name', 'client_email', 'client_phone', 'address', 'contract_amount', 'start_date', 'end_date'],
    example: [
      ['Downtown Office Renovation', 'Full interior renovation', 'active', 'John Smith', 'john@example.com', '305-555-0100', '123 Main St, Miami FL', '150000', '2026-04-01', '2026-08-01'],
      ['Coral Gables Re-Roof', 'Tile to metal conversion', 'planning', 'Jane Doe', 'jane@example.com', '305-555-0200', '456 Alhambra Cir, Coral Gables FL', '45000', '2026-05-01', '2026-06-15'],
    ],
  },
  tasks: {
    headers: ['title', 'description', 'status', 'priority', 'assignee', 'due_date', 'project_name'],
    example: [
      ['Order roofing materials', 'Standing seam panels + underlayment', 'todo', 'high', 'Mike', '2026-04-10', 'Coral Gables Re-Roof'],
      ['Submit permit application', 'HVHZ permit for Miami-Dade', 'in_progress', 'urgent', 'Ethan', '2026-04-05', 'Downtown Office Renovation'],
    ],
  },
  expenses: {
    headers: ['description', 'amount', 'category', 'vendor', 'date', 'project_name'],
    example: [
      ['Standing seam panels - 40 squares', '28000', 'materials', 'ABC Supply', '2026-04-08', 'Coral Gables Re-Roof'],
      ['Dumpster rental', '850', 'equipment', 'Waste Management', '2026-04-01', 'Downtown Office Renovation'],
    ],
  },
  team: {
    headers: ['name', 'email', 'phone', 'role'],
    example: [
      ['Mike Johnson', 'mike@company.com', '305-555-0300', 'supervisor'],
      ['Sarah Williams', 'sarah@company.com', '305-555-0400', 'worker'],
    ],
  },
}

export default function IntegrationsContent({ projects, tasks, teamMembers, userId, orgId, onBulkCreateProjects, onBulkCreateTasks, onBulkCreateExpenses }: IntegrationsContentProps) {
  const [activePanel, setActivePanel] = useState<string | null>(null)
  const [importType, setImportType] = useState<ImportType>(null)
  const [exportType, setExportType] = useState<ExportType>(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ success: number; errors: string[] } | null>(null)
  const [parsedData, setParsedData] = useState<any[] | null>(null)
  const [fileName, setFileName] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  // Integration connection status
  const [integStatus, setIntegStatus] = useState({ quickbooks: false, google: false, quickbooksRealmId: null as string | null })
  const [syncingQB, setSyncingQB] = useState(false)
  const [syncingGoogle, setSyncingGoogle] = useState(false)
  const [syncResult, setSyncResult] = useState<string | null>(null)

  useEffect(() => {
    if (!orgId) return
    fetch(`/api/integrations/status?orgId=${orgId}`)
      .then(r => r.json())
      .then(data => setIntegStatus(data))
      .catch(() => {})
  }, [orgId])

  const connectQB = () => {
    if (!userId || !orgId) return
    window.location.href = `/api/integrations/quickbooks/connect?userId=${userId}&orgId=${orgId}`
  }

  const disconnectQB = async () => {
    if (!orgId) return
    await fetch('/api/integrations/quickbooks/disconnect', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orgId }) })
    setIntegStatus(s => ({ ...s, quickbooks: false, quickbooksRealmId: null }))
  }

  const syncQB = async (syncType: string) => {
    if (!orgId) return
    setSyncingQB(true); setSyncResult(null)
    try {
      const res = await fetch('/api/integrations/quickbooks/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orgId, syncType }) })
      const data = await res.json()
      setSyncResult(data.error ? `Error: ${data.error}` : `Synced ${data.synced} record${data.synced !== 1 ? 's' : ''} to QuickBooks`)
    } catch (e: any) { setSyncResult(`Error: ${e.message}`) }
    finally { setSyncingQB(false) }
  }

  const connectGoogle = () => {
    if (!userId || !orgId) return
    window.location.href = `/api/integrations/google/connect?userId=${userId}&orgId=${orgId}`
  }

  const disconnectGoogle = async () => {
    if (!orgId) return
    await fetch('/api/integrations/google/disconnect', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orgId }) })
    setIntegStatus(s => ({ ...s, google: false }))
  }

  const syncGoogle = async (syncType: string) => {
    if (!orgId) return
    setSyncingGoogle(true); setSyncResult(null)
    try {
      const res = await fetch('/api/integrations/google/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orgId, syncType }) })
      const data = await res.json()
      setSyncResult(data.error ? `Error: ${data.error}` : `Synced ${data.synced} event${data.synced !== 1 ? 's' : ''} to Google Calendar`)
    } catch (e: any) { setSyncResult(`Error: ${e.message}`) }
    finally { setSyncingGoogle(false) }
  }

  // Download CSV template
  const downloadTemplate = (type: string) => {
    const template = CSV_TEMPLATES[type]
    if (!template) return

    const rows = [template.headers, ...template.example]
    const csv = rows.map(r => r.map(c => `"${(c || '').replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `projex_${type}_template.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Export actual data
  const exportData = (type: ExportType) => {
    if (!type) return
    let headers: string[] = []
    let rows: string[][] = []

    if (type === 'projects') {
      headers = ['name', 'description', 'status', 'client_name', 'client_email', 'address', 'contract_amount', 'start_date', 'end_date']
      rows = projects.map(p => [p.name, p.description || '', p.status, p.clientName || '', p.clientEmail || '', p.address || '', String(p.contractAmount || 0), p.startDate || '', p.endDate || ''])
    } else if (type === 'tasks') {
      headers = ['title', 'description', 'status', 'priority', 'assignee', 'due_date']
      rows = tasks.map(t => [t.title, t.description || '', t.status, t.priority || '', t.assignee || '', t.dueDate || ''])
    } else if (type === 'team') {
      headers = ['name', 'email', 'phone', 'role']
      rows = teamMembers.map(m => [m.name, m.email || '', m.phone || '', m.role || ''])
    }

    const csv = [headers, ...rows].map(r => r.map(c => `"${(c || '').replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `projex_${type}_export_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Parse uploaded CSV
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)

    const reader = new FileReader()
    reader.onload = (evt) => {
      const text = evt.target?.result as string
      const lines = text.split('\n').filter(l => l.trim())
      if (lines.length < 2) { setImportResult({ success: 0, errors: ['File is empty or has no data rows'] }); return }

      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase())
      const rows: any[] = []
      const errors: string[] = []

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].match(/("([^"]*("")*)*"|[^,]*)/g)?.map(v => v.replace(/^"|"$/g, '').replace(/""/g, '"').trim()) || []
        if (values.length === 0 || values.every(v => !v)) continue

        const row: Record<string, string> = {}
        headers.forEach((h, idx) => { row[h] = values[idx] || '' })

        // Basic validation
        if (importType === 'projects' && !row.name) { errors.push(`Row ${i}: missing project name`); continue }
        if (importType === 'tasks' && !row.title) { errors.push(`Row ${i}: missing task title`); continue }
        if (importType === 'expenses' && !row.description) { errors.push(`Row ${i}: missing expense description`); continue }

        rows.push(row)
      }

      setParsedData(rows)
      if (errors.length > 0) setImportResult({ success: rows.length, errors })
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  // Confirm import
  const confirmImport = async () => {
    if (!parsedData || !importType) return
    setImporting(true)
    try {
      if (importType === 'projects' && onBulkCreateProjects) await onBulkCreateProjects(parsedData)
      else if (importType === 'tasks' && onBulkCreateTasks) await onBulkCreateTasks(parsedData)
      else if (importType === 'expenses' && onBulkCreateExpenses) await onBulkCreateExpenses(parsedData)

      setImportResult({ success: parsedData.length, errors: [] })
      setParsedData(null)
      setFileName('')
    } catch (err: any) {
      setImportResult({ success: 0, errors: [err.message || 'Import failed'] })
    } finally {
      setImporting(false)
    }
  }

  const resetImport = () => {
    setImportType(null)
    setParsedData(null)
    setImportResult(null)
    setFileName('')
  }

  const DATA_TYPES = [
    { id: 'projects' as const, label: 'Projects', icon: FolderOpen, count: projects.length },
    { id: 'tasks' as const, label: 'Tasks', icon: CheckSquare, count: tasks.length },
    { id: 'expenses' as const, label: 'Expenses', icon: Receipt, count: null },
    { id: 'team' as const, label: 'Team Members', icon: null, count: teamMembers.length },
  ]

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-[#111]">
      {/* Header */}
      <div className="bg-white dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-[#2a2a2a] px-6 py-4">
        <div className="flex items-center gap-3">
          <Plug className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Integrations</h2>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Connect your tools, import data, and share with clients.</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {/* Back button when in sub-panel */}
        {activePanel && (
          <button onClick={() => { setActivePanel(null); resetImport(); setExportType(null) }}
            className="mb-4 text-xs text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 flex items-center gap-1">
            ← Back to Integrations
          </button>
        )}

        {/* Integration Grid */}
        {!activePanel && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {INTEGRATIONS.map(integ => (
              <button key={integ.id}
                onClick={() => integ.status === 'available' ? setActivePanel(integ.id) : null}
                className={`text-left p-5 bg-white dark:bg-[#1a1a1a] rounded-xl border transition-all group ${integ.status === 'coming' ? 'opacity-60 border-gray-200 dark:border-[#2a2a2a]' : 'border-gray-200 dark:border-[#2a2a2a] hover:border-gray-300 dark:hover:border-[#3a3a3a]'}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${integ.color}`}>
                    <integ.icon className="w-5 h-5" />
                  </div>
                  {integ.status === 'coming' ? (
                    <span className="text-[9px] font-semibold text-gray-400 bg-gray-100 dark:bg-[#222] px-2 py-0.5 rounded-full uppercase">Coming Soon</span>
                  ) : (integ.id === 'quickbooks' && integStatus.quickbooks) || (integ.id === 'gcal' && integStatus.google) ? (
                    <span className="flex items-center gap-1 text-[9px] font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full"><CheckCircle className="w-2.5 h-2.5" /> Connected</span>
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                  )}
                </div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">{integ.name}</h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">{integ.desc}</p>
              </button>
            ))}
          </div>
        )}

        {/* CSV Import/Export Panel */}
        {activePanel === 'csv' && !importType && !exportType && (
          <div className="max-w-2xl space-y-6">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">CSV Import / Export</h3>

            {/* Import Section */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#2a2a2a] p-5">
              <div className="flex items-center gap-2 mb-3">
                <ArrowUpFromLine className="w-4 h-4 text-blue-500" />
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Import Data</h4>
              </div>
              <p className="text-xs text-gray-500 mb-4">Download a template, fill it in, and upload to bulk-create records.</p>
              <div className="grid grid-cols-2 gap-2">
                {DATA_TYPES.filter(d => d.id !== 'team').map(dt => (
                  <button key={dt.id} onClick={() => setImportType(dt.id as ImportType)}
                    className="flex items-center gap-2.5 px-3 py-2.5 bg-gray-50 dark:bg-[#222] rounded-lg hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors text-left">
                    {dt.icon && <dt.icon className="w-4 h-4 text-gray-500" />}
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Import {dt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Export Section */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#2a2a2a] p-5">
              <div className="flex items-center gap-2 mb-3">
                <ArrowDownToLine className="w-4 h-4 text-green-500" />
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Export Data</h4>
              </div>
              <p className="text-xs text-gray-500 mb-4">Download your data as CSV files.</p>
              <div className="grid grid-cols-2 gap-2">
                {DATA_TYPES.map(dt => (
                  <button key={dt.id} onClick={() => exportData(dt.id)}
                    className="flex items-center justify-between px-3 py-2.5 bg-gray-50 dark:bg-[#222] rounded-lg hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors">
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Export {dt.label}</span>
                    {dt.count !== null && <span className="text-[10px] text-gray-400">{dt.count} records</span>}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Import Flow */}
        {activePanel === 'csv' && importType && (
          <div className="max-w-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 capitalize">Import {importType}</h3>
              <button onClick={resetImport} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
            </div>

            {/* Step 1: Download template */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#2a2a2a] p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-5 h-5 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[10px] font-bold flex items-center justify-center">1</span>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Download Template</h4>
              </div>
              <p className="text-xs text-gray-500 mb-3 ml-7">Get the CSV template with the correct columns and example data.</p>
              <button onClick={() => downloadTemplate(importType)}
                className="ml-7 flex items-center gap-1.5 px-3 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-xs font-medium hover:bg-gray-700 dark:hover:bg-gray-200 transition-colors">
                <Download className="w-3.5 h-3.5" /> Download {importType}_template.csv
              </button>
            </div>

            {/* Step 2: Upload filled CSV */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#2a2a2a] p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-5 h-5 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[10px] font-bold flex items-center justify-center">2</span>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Upload Your Data</h4>
              </div>
              <p className="text-xs text-gray-500 mb-3 ml-7">Fill in the template and upload it back.</p>
              <input ref={fileRef} type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
              <button onClick={() => fileRef.current?.click()}
                className="ml-7 flex items-center gap-1.5 px-3 py-2 border border-gray-200 dark:border-[#333] rounded-lg text-xs font-medium hover:bg-gray-50 dark:hover:bg-[#222] transition-colors text-gray-700 dark:text-gray-300">
                <Upload className="w-3.5 h-3.5" /> {fileName || 'Choose CSV file'}
              </button>
            </div>

            {/* Step 3: Preview & confirm */}
            {parsedData && parsedData.length > 0 && (
              <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#2a2a2a] p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-5 h-5 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[10px] font-bold flex items-center justify-center">3</span>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Preview & Import</h4>
                </div>
                <p className="text-xs text-gray-500 mb-3 ml-7">Found <strong>{parsedData.length}</strong> records to import.</p>

                {/* Preview table */}
                <div className="ml-7 overflow-x-auto mb-4">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-[#2a2a2a]">
                        {Object.keys(parsedData[0]).slice(0, 5).map(h => (
                          <th key={h} className="text-left py-1.5 px-2 text-gray-500 font-medium">{h}</th>
                        ))}
                        {Object.keys(parsedData[0]).length > 5 && <th className="text-gray-400 px-2">...</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {parsedData.slice(0, 5).map((row, i) => (
                        <tr key={i} className="border-b border-gray-100 dark:border-[#222]">
                          {Object.values(row).slice(0, 5).map((v: any, j) => (
                            <td key={j} className="py-1.5 px-2 text-gray-700 dark:text-gray-300 truncate max-w-[150px]">{v}</td>
                          ))}
                          {Object.keys(row).length > 5 && <td className="text-gray-400 px-2">...</td>}
                        </tr>
                      ))}
                      {parsedData.length > 5 && (
                        <tr><td colSpan={6} className="py-1.5 px-2 text-gray-400 text-center">...and {parsedData.length - 5} more</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <button onClick={confirmImport} disabled={importing}
                  className="ml-7 flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 disabled:opacity-50 transition-colors">
                  {importing ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Importing...</> : <><CheckCircle className="w-3.5 h-3.5" /> Import {parsedData.length} {importType}</>}
                </button>
              </div>
            )}

            {/* Result */}
            {importResult && !parsedData && (
              <div className={`rounded-xl p-4 ${importResult.errors.length === 0 ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'}`}>
                {importResult.errors.length === 0 ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-700 dark:text-green-400 font-medium">Successfully imported {importResult.success} {importType}!</span>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <span className="text-sm text-red-700 dark:text-red-400 font-medium">{importResult.errors.length} errors found</span>
                    </div>
                    <ul className="space-y-1 ml-6">
                      {importResult.errors.slice(0, 5).map((err, i) => (
                        <li key={i} className="text-xs text-red-600 dark:text-red-400">{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* QuickBooks Panel */}
        {activePanel === 'quickbooks' && (
          <div className="max-w-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">QuickBooks Online</h3>
              {integStatus.quickbooks && (
                <span className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 font-medium">
                  <CheckCircle className="w-3.5 h-3.5" /> Connected
                </span>
              )}
            </div>

            {syncResult && (
              <div className={`p-3 rounded-lg text-xs ${syncResult.startsWith('Error') ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'}`}>
                {syncResult}
              </div>
            )}

            {!integStatus.quickbooks ? (
              <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#2a2a2a] p-6">
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                    <DollarSign className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Connect QuickBooks Online</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Sync your Projex invoices and expenses directly to QuickBooks. You'll be redirected to authorize the connection.</p>
                  </div>
                </div>
                <button onClick={connectQB} className="flex items-center gap-2 px-4 py-2.5 bg-[#2CA01C] hover:bg-[#259118] text-white rounded-xl text-sm font-medium transition-colors">
                  <DollarSign className="w-4 h-4" /> Connect QuickBooks
                </button>
                <p className="mt-3 text-[10px] text-gray-400">Requires QuickBooks Online account. Env vars needed: QB_CLIENT_ID, QB_CLIENT_SECRET</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#2a2a2a] p-5">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Sync Data</h4>
                  <div className="space-y-2">
                    <button onClick={() => syncQB('invoices')} disabled={syncingQB} className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-[#222] rounded-lg hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors">
                      <div className="flex items-center gap-2.5">
                        <Receipt className="w-4 h-4 text-blue-500" />
                        <div className="text-left">
                          <p className="text-xs font-medium text-gray-900 dark:text-gray-100">Sync Invoices</p>
                          <p className="text-[10px] text-gray-400">Push sent invoices to QuickBooks</p>
                        </div>
                      </div>
                      {syncingQB ? <Loader2 className="w-4 h-4 animate-spin text-gray-400" /> : <RefreshCw className="w-4 h-4 text-gray-400" />}
                    </button>
                    <button onClick={() => syncQB('expenses')} disabled={syncingQB} className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-[#222] rounded-lg hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors">
                      <div className="flex items-center gap-2.5">
                        <ArrowUpFromLine className="w-4 h-4 text-green-500" />
                        <div className="text-left">
                          <p className="text-xs font-medium text-gray-900 dark:text-gray-100">Sync Expenses</p>
                          <p className="text-[10px] text-gray-400">Push project expenses to QuickBooks</p>
                        </div>
                      </div>
                      {syncingQB ? <Loader2 className="w-4 h-4 animate-spin text-gray-400" /> : <RefreshCw className="w-4 h-4 text-gray-400" />}
                    </button>
                  </div>
                </div>
                <button onClick={disconnectQB} className="flex items-center gap-1.5 px-3 py-2 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                  <Unplug className="w-3.5 h-3.5" /> Disconnect QuickBooks
                </button>
              </div>
            )}
          </div>
        )}

        {/* Google Calendar Panel */}
        {activePanel === 'gcal' && (
          <div className="max-w-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Google Calendar</h3>
              {integStatus.google && (
                <span className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 font-medium">
                  <CheckCircle className="w-3.5 h-3.5" /> Connected
                </span>
              )}
            </div>

            {syncResult && (
              <div className={`p-3 rounded-lg text-xs ${syncResult.startsWith('Error') ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'}`}>
                {syncResult}
              </div>
            )}

            {!integStatus.google ? (
              <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#2a2a2a] p-6">
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-6 h-6 text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Connect Google Calendar</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Sync active project deadlines and upcoming meetings directly to your Google Calendar. You'll be redirected to authorize the connection.</p>
                  </div>
                </div>
                <button onClick={connectGoogle} className="flex items-center gap-2 px-4 py-2.5 bg-[#4285F4] hover:bg-[#3367D6] text-white rounded-xl text-sm font-medium transition-colors">
                  <Calendar className="w-4 h-4" /> Connect Google Calendar
                </button>
                <p className="mt-3 text-[10px] text-gray-400">Requires Google account. Env vars needed: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#2a2a2a] p-5">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Sync to Calendar</h4>
                  <div className="space-y-2">
                    <button onClick={() => syncGoogle('projects')} disabled={syncingGoogle} className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-[#222] rounded-lg hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors">
                      <div className="flex items-center gap-2.5">
                        <FolderOpen className="w-4 h-4 text-blue-500" />
                        <div className="text-left">
                          <p className="text-xs font-medium text-gray-900 dark:text-gray-100">Sync Project Deadlines</p>
                          <p className="text-[10px] text-gray-400">Add active project end dates as calendar events</p>
                        </div>
                      </div>
                      {syncingGoogle ? <Loader2 className="w-4 h-4 animate-spin text-gray-400" /> : <RefreshCw className="w-4 h-4 text-gray-400" />}
                    </button>
                    <button onClick={() => syncGoogle('meetings')} disabled={syncingGoogle} className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-[#222] rounded-lg hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors">
                      <div className="flex items-center gap-2.5">
                        <Calendar className="w-4 h-4 text-green-500" />
                        <div className="text-left">
                          <p className="text-xs font-medium text-gray-900 dark:text-gray-100">Sync Meetings</p>
                          <p className="text-[10px] text-gray-400">Add upcoming meetings to Google Calendar</p>
                        </div>
                      </div>
                      {syncingGoogle ? <Loader2 className="w-4 h-4 animate-spin text-gray-400" /> : <RefreshCw className="w-4 h-4 text-gray-400" />}
                    </button>
                    <button onClick={() => syncGoogle('all')} disabled={syncingGoogle} className="w-full flex items-center justify-between px-4 py-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                      <div className="flex items-center gap-2.5">
                        <RefreshCw className="w-4 h-4 text-blue-600" />
                        <div className="text-left">
                          <p className="text-xs font-medium text-blue-700 dark:text-blue-300">Sync Everything</p>
                          <p className="text-[10px] text-blue-500 dark:text-blue-400">Projects + meetings</p>
                        </div>
                      </div>
                      {syncingGoogle ? <Loader2 className="w-4 h-4 animate-spin text-blue-400" /> : <RefreshCw className="w-4 h-4 text-blue-400" />}
                    </button>
                  </div>
                </div>
                <button onClick={disconnectGoogle} className="flex items-center gap-1.5 px-3 py-2 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                  <Unplug className="w-3.5 h-3.5" /> Disconnect Google Calendar
                </button>
              </div>
            )}
          </div>
        )}

        {/* Client Portal Panel — redirect to dedicated card */}
        {activePanel === 'portal' && (
          <div className="max-w-2xl space-y-4">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Client Portal</h3>
            <p className="text-xs text-gray-500 mb-4">Generate shareable links for clients to view project progress, approve documents, and make payments — no login required.</p>
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#2a2a2a] p-5">
              <p className="text-xs text-gray-500 mb-3">Select a project to generate a client portal link:</p>
              <div className="space-y-2">
                {projects.length === 0 ? (
                  <p className="text-xs text-gray-400 py-4 text-center">No projects yet. Create a project first.</p>
                ) : (
                  projects.map(p => (
                    <div key={p.id} className="flex items-center justify-between px-3 py-2.5 bg-gray-50 dark:bg-[#222] rounded-lg">
                      <div>
                        <p className="text-xs font-medium text-gray-900 dark:text-gray-100">{p.name}</p>
                        <p className="text-[10px] text-gray-400">{p.clientName || 'No client'}</p>
                      </div>
                      <button onClick={() => {
                        const portalUrl = `${window.location.origin}/portal/${p.id}`
                        navigator.clipboard.writeText(portalUrl)
                      }}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-lg hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors">
                        <ExternalLink className="w-3 h-3" /> Copy Link
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
