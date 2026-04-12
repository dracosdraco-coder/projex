'use client'

import { useState } from 'react'
import { useFiles, UploadedFile } from '@/context/FileContext'
import ProposalBuilder from '@/components/ProposalBuilder'

interface DocumentUploadProps {
  projectId?: string
  onFileUploaded?: (file: UploadedFile) => void
  onViewFile?: (file: UploadedFile) => void
  onEditFile?: (file: UploadedFile) => void
}

export default function DocumentUpload({ 
  projectId, 
  onFileUploaded, 
  onViewFile,
  onEditFile 
}: DocumentUploadProps) {
  const { 
    files, 
    addFile,
    removeFile,
    getFilesByProject 
  } = useFiles()

  const [dragActive, setDragActive] = useState(false)
  const [filterCategory, setFilterCategory] = useState<UploadedFile['category'] | 'all'>('all')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  
  // Selection mode for proposals
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [showProposalBuilder, setShowProposalBuilder] = useState(false)

  const displayFiles = projectId 
    ? getFilesByProject(projectId)
    : filterCategory === 'all' 
      ? files 
      : files.filter(f => f.category === filterCategory)

  const ALLOWED_TYPES = [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
  ]

  const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

  const processFiles = async (fileList: FileList) => {
    setUploading(true)
    setUploadProgress(0)

    const totalFiles = fileList.length

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i]

      if (!ALLOWED_TYPES.includes(file.type)) {
        continue
      }

      if (file.size > MAX_FILE_SIZE) {
        continue
      }

      const reader = new FileReader()
      const fileData = await new Promise<string>((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as string)
        reader.readAsDataURL(file)
      })

      let category: UploadedFile['category'] = 'other'
      const nameLower = file.name.toLowerCase()
      if (nameLower.includes('invoice')) category = 'invoice'
      else if (nameLower.includes('estimate')) category = 'estimate'
      else if (nameLower.includes('contract')) category = 'contract'
      else if (file.type.startsWith('image/')) category = 'photo'

      addFile({
        name: file.name,
        size: file.size,
        type: file.type,
        category,
        isProjectFile: false,
        url: fileData,
        projectId,
      })

      setUploadProgress(((i + 1) / totalFiles) * 100)
    }

    setUploading(false)
    setUploadProgress(0)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const droppedFiles = e.dataTransfer.files
    if (droppedFiles.length > 0) {
      processFiles(droppedFiles)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (selectedFiles && selectedFiles.length > 0) {
      processFiles(selectedFiles)
    }
  }

  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles(prev =>
      prev.includes(fileId)
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    )
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / 1024 / 1024).toFixed(1) + ' MB'
  }

  const getFileIcon = (type: string) => {
    if (type === 'application/pdf') {
      return (
        <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path d="M4 18h12V6h-4V2H4v16zm-2 1V0h12l4 4v16H2v-1z"/>
        </svg>
      )
    }
    if (type.startsWith('image/')) {
      return (
        <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    }
    return (
      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    )
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-[#000000]">
      {/* Upload Zone */}
      <div className="p-6">
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
            dragActive
              ? 'border-gray-900 dark:border-white bg-gray-100 dark:bg-[#1a1a1a]'
              : 'border-gray-300 dark:border-[#2c2c2e] hover:border-gray-400 dark:hover:border-[#3c3c3e]'
          }`}
        >
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-[#2c2c2e] flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {dragActive ? 'Drop files here' : 'Upload Documents'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Drag & drop files or click to browse
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-6">
              Supports PDF, JPG, PNG up to 10MB
            </p>
            <input
              type="file"
              id="file-upload"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={handleFileSelect}
              className="hidden"
            />
            <label
              htmlFor="file-upload"
              className="px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Choose Files
            </label>
          </div>
        </div>

        {uploading && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Uploading...</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{Math.round(uploadProgress)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-[#2c2c2e] rounded-full h-2">
              <div 
                className="bg-gray-900 dark:bg-white h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Filter Tabs & Selection Mode */}
      {!projectId && (
        <div className="px-6 pb-4">
          <div className="flex gap-2 overflow-x-auto mb-4">
            {[
              { value: 'all' as const, label: 'All Files' },
              { value: 'invoice' as const, label: 'Invoices' },
              { value: 'estimate' as const, label: 'Estimates' },
              { value: 'contract' as const, label: 'Contracts' },
              { value: 'photo' as const, label: 'Photos' },
              { value: 'other' as const, label: 'Other' },
            ].map(tab => (
              <button
                key={tab.value}
                onClick={() => setFilterCategory(tab.value)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                  filterCategory === tab.value
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Selection Mode Controls */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                setSelectionMode(!selectionMode)
                setSelectedFiles([])
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2c2c2e] rounded-lg transition-colors"
            >
              {selectionMode ? 'Cancel Selection' : 'Select Files'}
            </button>

            {selectionMode && selectedFiles.length > 0 && (
              <button
                onClick={() => setShowProposalBuilder(true)}
                className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
              >
                Create Proposal ({selectedFiles.length})
              </button>
            )}
          </div>
        </div>
      )}

      {/* Files List */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {displayFiles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No files uploaded yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayFiles.map(file => (
              <div
                key={file.id}
                className={`relative bg-white dark:bg-[#1c1c1e] rounded-xl border-2 p-4 transition-all ${
                  selectionMode && selectedFiles.includes(file.id)
                    ? 'border-gray-900 dark:border-white'
                    : 'border-gray-200 dark:border-[#2c2c2e] hover:border-gray-300 dark:hover:border-[#3c3c3e]'
                } ${selectionMode ? 'cursor-pointer' : ''}`}
                onClick={() => {
                  if (selectionMode) {
                    toggleFileSelection(file.id)
                  }
                }}
              >
                {/* Checkbox in selection mode */}
                {selectionMode && (
                  <div className="absolute top-2 right-2 z-10">
                    <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
                      selectedFiles.includes(file.id)
                        ? 'bg-gray-900 dark:bg-white border-gray-900 dark:border-white'
                        : 'bg-white dark:bg-[#1c1c1e] border-gray-300 dark:border-[#3c3c3e]'
                    }`}>
                      {selectedFiles.includes(file.id) && (
                        <svg className="w-4 h-4 text-white dark:text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <div 
                    className="flex-shrink-0"
                    onClick={(e) => {
                      if (!selectionMode) {
                        e.stopPropagation()
                        onViewFile?.(file)
                      }
                    }}
                  >
                    {file.type.startsWith('image/') && file.url ? (
                      <img 
                        src={file.url} 
                        alt={file.name}
                        className="w-12 h-12 rounded object-cover cursor-pointer"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded bg-gray-100 dark:bg-[#2c2c2e] flex items-center justify-center cursor-pointer">
                        {getFileIcon(file.type)}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate mb-1">
                      {file.name}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>{formatFileSize(file.size)}</span>
                      {file.category && (
                        <>
                          <span>•</span>
                          <span className="capitalize">{file.category}</span>
                        </>
                      )}
                      {file.isProjectFile && (
                        <>
                          <span>•</span>
                          <span className="px-1.5 py-0.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[10px] font-medium rounded">
                            PROJEX
                          </span>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {new Date(file.uploadedAt).toLocaleDateString()}
                    </p>
                    
                    {/* Action Buttons (only show when not in selection mode) */}
                    {!selectionMode && (
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onViewFile?.(file)
                          }}
                          className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                        >
                          View
                        </button>
                        {file.isProjectFile && file.formData && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onEditFile?.(file)
                            }}
                            className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                          >
                            Edit
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (confirm('Delete this file?')) {
                              removeFile(file.id)
                            }
                          }}
                          className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Proposal Builder Modal */}
      {showProposalBuilder && (
        <ProposalBuilder
          isOpen={showProposalBuilder}
          onClose={() => {
            setShowProposalBuilder(false)
            setSelectionMode(false)
            setSelectedFiles([])
          }}
          onSave={(proposalFile) => {
            addFile(proposalFile)
            setShowProposalBuilder(false)
            setSelectionMode(false)
            setSelectedFiles([])
          }}
        />
      )}
    </div>
  )
}