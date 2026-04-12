'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'

export interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  uploadedAt: string
  projectId?: string
  category?: 'invoice' | 'estimate' | 'contract' | 'photo' | 'drawing' | 'other'
  isProjectFile: boolean
  url?: string
  formData?: any // Store original form data for editing
}

interface FileContextValue {
  files: UploadedFile[]
  addFile: (file: Omit<UploadedFile, 'id' | 'uploadedAt'>) => UploadedFile
  removeFile: (id: string) => void
  updateFile: (id: string, updates: Partial<UploadedFile>) => void
  getFilesByProject: (projectId: string) => UploadedFile[]
  getFilesByCategory: (category: UploadedFile['category']) => UploadedFile[]
  refreshFiles: () => void
}

const FileContext = createContext<FileContextValue | undefined>(undefined)

const STORAGE_KEY = 'projex-uploaded-files'

export function FileProvider({ children }: { children: React.ReactNode }) {
  const [files, setFiles] = useState<UploadedFile[]>([])

  // Load from localStorage on mount
  useEffect(() => {
    refreshFiles()
  }, [])

  // Save to localStorage whenever files change
  useEffect(() => {
    if (files.length > 0 || localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(files))
    }
  }, [files])

  const refreshFiles = useCallback(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        setFiles(JSON.parse(saved))
      } catch (e) {
      }
    }
  }, [])

  const addFile = useCallback((file: Omit<UploadedFile, 'id' | 'uploadedAt'>) => {
    const newFile: UploadedFile = {
      ...file,
      id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      uploadedAt: new Date().toISOString(),
    }
    setFiles(prev => [...prev, newFile])
    return newFile
  }, [])

  const removeFile = useCallback((id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id))
  }, [])

  const updateFile = useCallback((id: string, updates: Partial<UploadedFile>) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f))
  }, [])

  const getFilesByProject = useCallback((projectId: string) => {
    return files.filter(f => f.projectId === projectId)
  }, [files])

  const getFilesByCategory = useCallback((category: UploadedFile['category']) => {
    return files.filter(f => f.category === category)
  }, [files])

  return (
    <FileContext.Provider value={{
      files,
      addFile,
      removeFile,
      updateFile,
      getFilesByProject,
      getFilesByCategory,
      refreshFiles,
    }}>
      {children}
    </FileContext.Provider>
  )
}

export function useFiles() {
  const context = useContext(FileContext)
  if (!context) {
    throw new Error('useFiles must be used within FileProvider')
  }
  return context
}
