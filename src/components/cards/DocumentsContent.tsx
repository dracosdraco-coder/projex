'use client'

import { useState, useMemo } from 'react'
import { Project } from '@/types'

interface Document {
  id: string
  projectId: string
  name: string
  type: 'contract' | 'permit' | 'photo' | 'invoice' | 'drawing' | 'proposal' | 'other' | 'projex'
  fileUrl: string
  fileSize: number
  mimeType: string
  uploadedAt: string
}

interface DocumentsContentProps {
  projects: Project[]
  documents: Document[]
  onUploadDocument?: (projectId: string, file: File, type: string) => Promise<void>
  onDeleteDocument?: (documentId: string) => Promise<void>
  onDownloadDocument?: (documentId: string, fileName: string) => Promise<void>
}

const DOC_TYPES = [
  { value: 'contract', label: 'Contract', color: 'blue' },
  { value: 'permit', label: 'Permit', color: 'green' },
  { value: 'photo', label: 'Photo', color: 'purple' },
  { value: 'invoice', label: 'Invoice', color: 'orange' },
  { value: 'drawing', label: 'Drawing', color: 'pink' },
  { value: 'proposal', label: 'Proposal', color: 'indigo' },
  { value: 'projex', label: 'Projex Doc', color: 'cyan' },
  { value: 'other', label: 'Other', color: 'gray' },
]

export default function DocumentsContent({
  projects = [],
  documents = [],
  onUploadDocument,
  onDeleteDocument,
  onDownloadDocument,
}: DocumentsContentProps) {
  const [projectFilter, setProjectFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [showUpload, setShowUpload] = useState(false)
  const [uploadProjectId, setUploadProjectId] = useState('')
  const [uploadType, setUploadType] = useState('other')
  const [uploading, setUploading] = useState(false)
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null)
  const [dragActive, setDragActive] = useState(false)

  const filtered = useMemo(() => {
    return documents.filter(d => {
      if (projectFilter !== 'all' && d.projectId !== projectFilter) return false
      if (typeFilter !== 'all' && d.type !== typeFilter) return false
      if (search && !d.name.toLowerCase().includes(search.toLowerCase())) return false
      return true
    }).sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
  }, [documents, projectFilter, typeFilter, search])

  const getProjectName = (pid: string) => projects.find(p => p.id === pid)?.name || 'Unknown'
  const fmt = (bytes: number) => { if (bytes === 0) return '0 B'; const k = 1024, s = ['B', 'KB', 'MB', 'GB']; const i = Math.floor(Math.log(bytes) / Math.log(k)); return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${s[i]}` }
  const getTypeColor = (t: string) => DOC_TYPES.find(dt => dt.value === t)?.color || 'gray'
  const isImage = (mime: string) => mime?.startsWith('image/')
  const isPDF = (mime: string) => mime === 'application/pdf'

  const handleFiles = async (files: FileList | File[]) => {
    if (!uploadProjectId) return
    setUploading(true)
    for (const file of Array.from(files)) {
      await onUploadDocument?.(uploadProjectId, file, uploadType)
    }
    setUploading(false)
    setShowUpload(false)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-5 py-3 border-b border-gray-100 dark:border-[#2a2a2a] flex-shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Documents</h2>
          <span className="text-xs text-gray-400">{filtered.length} files</span>
          <div className="flex-1" />
          <button onClick={() => setShowUpload(!showUpload)} className="px-3 py-1.5 text-xs font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors">
            + Upload
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
            className="flex-1 px-3 py-1.5 bg-gray-50 dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-lg text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          <select value={projectFilter} onChange={e => setProjectFilter(e.target.value)}
            className="px-2 py-1.5 bg-gray-50 dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-lg text-xs text-gray-900 dark:text-gray-100">
            <option value="all">All Projects</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
            className="px-2 py-1.5 bg-gray-50 dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-lg text-xs text-gray-900 dark:text-gray-100">
            <option value="all">All Types</option>
            {DOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
      </div>

      {/* Upload panel */}
      {showUpload && (
        <div className="px-5 py-4 bg-blue-50 dark:bg-blue-900/10 border-b border-blue-100 dark:border-blue-900/20 flex-shrink-0">
          <div className="flex items-end gap-3 mb-3">
            <div className="flex-1">
              <label className="block text-[10px] font-medium text-gray-500 mb-1 uppercase">Project</label>
              <select value={uploadProjectId} onChange={e => setUploadProjectId(e.target.value)}
                className="w-full px-2 py-1.5 bg-white dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded text-xs">
                <option value="">Select project...</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-500 mb-1 uppercase">Type</label>
              <select value={uploadType} onChange={e => setUploadType(e.target.value)}
                className="px-2 py-1.5 bg-white dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded text-xs">
                {DOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>
          <div
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${dragActive ? 'border-blue-400 bg-blue-100 dark:bg-blue-900/20' : 'border-gray-300 dark:border-[#444]'} ${!uploadProjectId ? 'opacity-50 pointer-events-none' : ''}`}
            onDragEnter={e => { e.preventDefault(); setDragActive(true) }}
            onDragLeave={() => setDragActive(false)}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); setDragActive(false); handleFiles(e.dataTransfer.files) }}
          >
            <p className="text-sm text-gray-500">{uploading ? 'Uploading...' : 'Drop files here or'}</p>
            <label className="inline-block mt-2 px-4 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg cursor-pointer hover:bg-blue-700">
              Browse Files
              <input type="file" multiple className="hidden" onChange={e => e.target.files && handleFiles(e.target.files)} />
            </label>
          </div>
        </div>
      )}

      {/* File list */}
      <div className="flex-1 overflow-y-auto p-5">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <div className="text-4xl mb-3">📄</div>
            <p className="text-sm font-medium">No documents</p>
            <p className="text-xs mt-1">Upload files or create documents from Forms</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {filtered.map(doc => (
              <div key={doc.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-[#222] transition-colors group cursor-pointer"
                onClick={() => setPreviewDoc(doc)}
              >
                {/* Type indicator */}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold bg-${getTypeColor(doc.type)}-100 dark:bg-${getTypeColor(doc.type)}-900/20 text-${getTypeColor(doc.type)}-600 dark:text-${getTypeColor(doc.type)}-400`}>
                  {doc.type === 'photo' ? '📷' : doc.type === 'drawing' ? '📐' : '📄'}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{doc.name}</p>
                  <div className="flex items-center gap-2 text-[10px] text-gray-400">
                    <span>{getProjectName(doc.projectId)}</span>
                    <span>·</span>
                    <span className="capitalize">{doc.type}</span>
                    <span>·</span>
                    <span>{fmt(doc.fileSize)}</span>
                    <span>·</span>
                    <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                  {doc.fileUrl && (
                    <button onClick={() => onDownloadDocument?.(doc.id, doc.name)} className="p-1.5 text-gray-400 hover:text-blue-500 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20" title="Download">
                      ⬇
                    </button>
                  )}
                  <button onClick={() => { if (confirm('Delete this document?')) onDeleteDocument?.(doc.id) }} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20" title="Delete">
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview overlay */}
      {previewDoc && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4" onClick={() => setPreviewDoc(null)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative bg-white dark:bg-[#1a1a1a] rounded-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-[#2a2a2a]">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{previewDoc.name}</h3>
                <p className="text-xs text-gray-400">{getProjectName(previewDoc.projectId)} · {fmt(previewDoc.fileSize)}</p>
              </div>
              <div className="flex gap-2">
                {previewDoc.fileUrl && (
                  <button onClick={() => onDownloadDocument?.(previewDoc.id, previewDoc.name)} className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Download
                  </button>
                )}
                <button onClick={() => setPreviewDoc(null)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-[#333]">✕</button>
              </div>
            </div>
            <div className="overflow-auto max-h-[70vh] p-4 flex items-center justify-center bg-gray-50 dark:bg-[#111]">
              {isImage(previewDoc.mimeType) && previewDoc.fileUrl ? (
                <img src={previewDoc.fileUrl} alt={previewDoc.name} className="max-w-full max-h-[65vh] object-contain rounded" />
              ) : isPDF(previewDoc.mimeType) && previewDoc.fileUrl ? (
                <iframe src={previewDoc.fileUrl} className="w-full h-[65vh] rounded" />
              ) : (
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">📄</div>
                  <p className="text-sm text-gray-500">Preview not available for this file type</p>
                  <p className="text-xs text-gray-400 mt-1">{previewDoc.mimeType}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
