'use client'

import { useState, useRef } from 'react'
import { Camera, Upload, Grid3x3, List, Image, Plus, X, FileText } from 'lucide-react'
import type { Photo } from '@/hooks/usePhotos'

interface PhotosContentProps {
  projects: any[]
  photos?: Photo[]
  onUploadPhoto?: (projectId: string, file: File, caption: string, category: string) => Promise<Photo | null>
  onDeletePhoto?: (photo: Photo) => Promise<void>
}

const CATEGORIES = ['General', 'Before', 'After', 'Inspection', 'Progress', 'Damage', 'Materials', 'Completed']

export default function PhotosContent({ projects, photos: photosProp, onUploadPhoto, onDeletePhoto }: PhotosContentProps) {
  const [selectedProject, setSelectedProject] = useState('')
  const [localPhotos, setLocalPhotos] = useState<Photo[]>([])
  const photos = photosProp ?? localPhotos
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showUpload, setShowUpload] = useState(false)
  const [uploadCaption, setUploadCaption] = useState('')
  const [uploadCategory, setUploadCategory] = useState('General')
  const [uploading, setUploading] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [showReport, setShowReport] = useState(false)
  const [reportPhotos, setReportPhotos] = useState<Set<string>>(new Set())
  const fileRef = useRef<HTMLInputElement>(null)
  const [previewFiles, setPreviewFiles] = useState<{ file: File; preview: string }[]>([])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setPreviewFiles(files.map(f => ({ file: f, preview: URL.createObjectURL(f) })))
    setShowUpload(true)
    e.target.value = ''
  }

  const handleUpload = async () => {
    if (!selectedProject || previewFiles.length === 0) return
    setUploading(true)
    for (const { file, preview } of previewFiles) {
      try {
        if (onUploadPhoto) {
          const saved = await onUploadPhoto(selectedProject, file, uploadCaption, uploadCategory)
          if (saved) setLocalPhotos(prev => [saved, ...prev])
        } else {
          // fallback: local preview only (no DB)
          setLocalPhotos(prev => [{
            id: `p-${Date.now()}-${Math.random()}`,
            projectId: selectedProject,
            storagePath: '',
            url: preview,
            name: file.name,
            caption: uploadCaption,
            category: uploadCategory,
            createdAt: new Date().toISOString()
          }, ...prev])
        }
      } catch (err) { console.error('Upload failed:', err) }
    }
    setUploading(false); setShowUpload(false); setPreviewFiles([]); setUploadCaption(''); setUploadCategory('General')
  }

  const handleDeletePhoto = async (photo: Photo, e: React.MouseEvent) => {
    e.stopPropagation()
    if (onDeletePhoto) {
      await onDeletePhoto(photo)
    } else {
      setLocalPhotos(prev => prev.filter(p => p.id !== photo.id))
    }
    if (selectedPhoto?.id === photo.id) setSelectedPhoto(null)
  }

  const toggleReportPhoto = (id: string) => {
    setReportPhotos(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next })
  }

  const projectPhotos = photos.filter(p => !selectedProject || p.projectId === selectedProject)

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-[#111]">
      <div className="bg-white dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-[#2a2a2a] px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Camera className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Photos</h2>
            <span className="text-xs text-gray-400">{projectPhotos.length} photos</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowReport(!showReport)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${showReport ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#222]'}`}>
              <FileText className="w-3.5 h-3.5" /> Photo Report
            </button>
            <input ref={fileRef} type="file" accept="image/*" multiple capture="environment" onChange={handleFileSelect} className="hidden" />
            <button onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-xs font-medium hover:bg-gray-700 dark:hover:bg-gray-200">
              <Plus className="w-3.5 h-3.5" /> Add Photos
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)}
            className="px-3 py-1.5 bg-gray-50 dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-lg text-xs">
            <option value="">All Projects</option>
            {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <div className="flex bg-gray-100 dark:bg-[#222] rounded-lg p-0.5">
            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white dark:bg-[#2a2a2a] shadow-sm' : ''}`}><Grid3x3 className="w-3.5 h-3.5 text-gray-600" /></button>
            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white dark:bg-[#2a2a2a] shadow-sm' : ''}`}><List className="w-3.5 h-3.5 text-gray-600" /></button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {showReport && (
          <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100">Building Photo Report</h3>
              <span className="text-[10px] text-blue-600 dark:text-blue-400">{reportPhotos.size} selected</span>
            </div>
            <p className="text-[11px] text-blue-700 dark:text-blue-300 mb-3">Click photos below to select them for the report.</p>
          </div>
        )}

        {projectPhotos.length === 0 && !showUpload && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-[#222] flex items-center justify-center mb-4"><Image className="w-8 h-8 text-gray-300" /></div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">No photos yet</h3>
            <p className="text-xs text-gray-500 max-w-xs mb-4">{selectedProject ? 'Upload photos for this project.' : 'Select a project and upload photos.'}</p>
            {selectedProject && <button onClick={() => fileRef.current?.click()} className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-xs font-medium">Upload Photos</button>}
          </div>
        )}

        {viewMode === 'grid' && projectPhotos.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {projectPhotos.map(photo => (
              <div key={photo.id} onClick={() => showReport ? toggleReportPhoto(photo.id) : setSelectedPhoto(photo)}
                className={`relative group rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${showReport && reportPhotos.has(photo.id) ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-transparent hover:border-gray-300 dark:hover:border-[#444]'}`}>
                <div className="aspect-square bg-gray-200 dark:bg-[#222]"><img src={photo.url} alt={photo.name} className="w-full h-full object-cover" /></div>
                {showReport && reportPhotos.has(photo.id) && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center"><span className="text-white text-[10px] font-bold">{Array.from(reportPhotos).indexOf(photo.id) + 1}</span></div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => handleDeletePhoto(photo, e)} className="absolute top-2 right-2 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"><X className="w-3 h-3 text-white" /></button>
                  <div className="absolute bottom-0 left-0 right-0 p-2">
                    <p className="text-white text-[10px] font-medium truncate">{photo.caption || photo.name}</p>
                    <p className="text-white/60 text-[9px]">{photo.category}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {viewMode === 'list' && projectPhotos.length > 0 && (
          <div className="space-y-2">
            {projectPhotos.map(photo => (
              <div key={photo.id} onClick={() => showReport ? toggleReportPhoto(photo.id) : setSelectedPhoto(photo)}
                className={`flex items-center gap-3 p-3 bg-white dark:bg-[#1a1a1a] rounded-xl border cursor-pointer ${showReport && reportPhotos.has(photo.id) ? 'border-blue-500' : 'border-gray-200 dark:border-[#2a2a2a] hover:border-gray-300'}`}>
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200 shrink-0"><img src={photo.url} alt={photo.name} className="w-full h-full object-cover" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">{photo.caption || photo.name}</p>
                  <p className="text-[10px] text-gray-400">{photo.category} • {new Date(photo.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showUpload && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setShowUpload(false); setPreviewFiles([]) }} />
          <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-6 w-full max-w-lg shadow-2xl border border-gray-200 dark:border-[#2a2a2a] relative max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Upload Photos</h3>
            {!selectedProject && (
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-500 mb-1">Project *</label>
                <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)} className="w-full px-3 py-2 bg-gray-50 dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-lg text-sm">
                  <option value="">Select project...</option>
                  {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            )}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {previewFiles.map(({ file, preview }, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-gray-200">
                  <img src={preview} alt={file.name} className="w-full h-full object-cover" />
                  <button onClick={() => setPreviewFiles(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center"><X className="w-3 h-3 text-white" /></button>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Caption</label>
                <input type="text" value={uploadCaption} onChange={e => setUploadCaption(e.target.value)} placeholder="Describe these photos..." className="w-full px-3 py-2 bg-gray-50 dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map(cat => (
                    <button key={cat} onClick={() => setUploadCategory(cat)} className={`px-2.5 py-1 rounded-full text-[10px] font-medium ${uploadCategory === cat ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-[#222] text-gray-600 dark:text-gray-400'}`}>{cat}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => { setShowUpload(false); setPreviewFiles([]) }} className="flex-1 px-4 py-2 text-sm border border-gray-200 dark:border-[#333] rounded-lg">Cancel</button>
              <button onClick={handleUpload} disabled={uploading || !selectedProject} className="flex-1 px-4 py-2 text-sm text-white bg-gray-900 dark:bg-white dark:text-gray-900 rounded-lg font-medium disabled:opacity-50">
                {uploading ? 'Uploading...' : `Upload ${previewFiles.length} Photo${previewFiles.length !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedPhoto && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/90" onClick={() => setSelectedPhoto(null)}>
          <button className="absolute top-4 right-4 text-white/60 hover:text-white" onClick={() => setSelectedPhoto(null)}><X className="w-6 h-6" /></button>
          <img src={selectedPhoto.url} alt={selectedPhoto.name} className="max-w-full max-h-[85vh] rounded-lg object-contain" onClick={e => e.stopPropagation()} />
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm rounded-xl px-4 py-2 text-center">
            <p className="text-white text-sm font-medium">{selectedPhoto.caption || selectedPhoto.name}</p>
            <p className="text-white/60 text-[10px]">{selectedPhoto.category} • {new Date(selectedPhoto.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      )}
    </div>
  )
}
