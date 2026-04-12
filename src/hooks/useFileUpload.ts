'use client'

import { useState, useCallback } from 'react'

export interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  uploadedAt: string
  projectId?: string
  category?: 'invoice' | 'estimate' | 'contract' | 'photo' | 'drawing' | 'other'
  isProjectFile: boolean // true = made in Projex, false = uploaded from client
  url?: string // For preview (base64 or blob URL)
}

interface UseFileUploadReturn {
  files: UploadedFile[]
  uploading: boolean
  uploadProgress: number
  handleFileDrop: (e: React.DragEvent<HTMLDivElement>) => void
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  removeFile: (id: string) => void
  getFilesByProject: (projectId: string) => UploadedFile[]
  getFilesByCategory: (category: UploadedFile['category']) => UploadedFile[]
  addProjectFile: (file: Omit<UploadedFile, 'id' | 'uploadedAt'>) => UploadedFile
}

const ALLOWED_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/msword', // .doc
]

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export function useFileUpload(): UseFileUploadReturn {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Load files from localStorage on mount
  useState(() => {
    const saved = localStorage.getItem('projex-uploaded-files')
    if (saved) {
      try {
        setFiles(JSON.parse(saved))
      } catch (e) {
      }
    }
  })

  // Save files to localStorage whenever they change
  const saveFiles = useCallback((newFiles: UploadedFile[]) => {
    setFiles(newFiles)
    localStorage.setItem('projex-uploaded-files', JSON.stringify(newFiles))
  }, [])

  const processFiles = useCallback(async (fileList: FileList) => {
    setUploading(true)
    setUploadProgress(0)

    const validFiles: UploadedFile[] = []
    const totalFiles = fileList.length

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i]

      // Validate file type
      if (!ALLOWED_TYPES.includes(file.type)) {
        continue
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        continue
      }

      // Read file as base64 for preview
      const reader = new FileReader()
      const fileData = await new Promise<string>((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as string)
        reader.readAsDataURL(file)
      })

      // Determine category based on file name
      let category: UploadedFile['category'] = 'other'
      const nameLower = file.name.toLowerCase()
      if (nameLower.includes('invoice')) category = 'invoice'
      else if (nameLower.includes('estimate')) category = 'estimate'
      else if (nameLower.includes('contract')) category = 'contract'
      else if (file.type.startsWith('image/')) category = 'photo'

      validFiles.push({
        id: `file-${Date.now()}-${i}`,
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString(),
        category,
        isProjectFile: false, // Uploaded files are from clients
        url: fileData,
      })

      setUploadProgress(((i + 1) / totalFiles) * 100)
    }

    // Add to existing files
    saveFiles([...files, ...validFiles])
    setUploading(false)
    setUploadProgress(0)
  }, [files, saveFiles])

  const handleFileDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const droppedFiles = e.dataTransfer.files
    if (droppedFiles.length > 0) {
      processFiles(droppedFiles)
    }
  }, [processFiles])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (selectedFiles && selectedFiles.length > 0) {
      processFiles(selectedFiles)
    }
  }, [processFiles])

  const removeFile = useCallback((id: string) => {
    const newFiles = files.filter(f => f.id !== id)
    saveFiles(newFiles)
  }, [files, saveFiles])

  const getFilesByProject = useCallback((projectId: string) => {
    return files.filter(f => f.projectId === projectId)
  }, [files])

  const getFilesByCategory = useCallback((category: UploadedFile['category']) => {
    return files.filter(f => f.category === category)
  }, [files])

  // Add files created in Projex (invoices, estimates, etc.)
  const addProjectFile = useCallback((file: Omit<UploadedFile, 'id' | 'uploadedAt'>) => {
    const newFile: UploadedFile = {
      ...file,
      id: `projex-${Date.now()}`,
      uploadedAt: new Date().toISOString(),
      isProjectFile: true,
    }
    saveFiles([...files, newFile])
    return newFile
  }, [files, saveFiles])

  return {
    files,
    uploading,
    uploadProgress,
    handleFileDrop,
    handleFileSelect,
    removeFile,
    getFilesByProject,
    getFilesByCategory,
    addProjectFile,
  }
}
