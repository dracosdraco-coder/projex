'use client'

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

const BUCKET = 'documents'
const MAX_SIZE = 25 * 1024 * 1024 // 25MB

interface StorageFile {
  path: string
  publicUrl: string
  name: string
  size: number
  type: string
}

export function useStorage(userId: string | undefined) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  // Upload a file to Supabase Storage
  const uploadFile = useCallback(async (
    file: File,
    folder: string = 'general',
    projectId?: string,
  ): Promise<StorageFile | null> => {
    if (!userId) return null
    if (file.size > MAX_SIZE) throw new Error(`File too large (max ${MAX_SIZE / 1024 / 1024}MB)`)

    setUploading(true); setProgress(10)

    const timestamp = Date.now()
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const storagePath = projectId
      ? `${userId}/${projectId}/${folder}/${timestamp}_${safe}`
      : `${userId}/${folder}/${timestamp}_${safe}`

    try {
      setProgress(30)
      const { error } = await supabase.storage.from(BUCKET).upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
      })
      if (error) throw error

      setProgress(80)
      const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)

      // Also save metadata to documents table
      await supabase.from('documents').insert({
        user_id: userId,
        project_id: projectId || null,
        name: file.name,
        storage_path: storagePath,
        file_type: file.type,
        file_size: file.size,
        category: detectCategory(file),
        is_project_file: false,
      })

      setProgress(100)
      return { path: storagePath, publicUrl, name: file.name, size: file.size, type: file.type }
    } catch (err) {
      throw err
    } finally {
      setUploading(false); setProgress(0)
    }
  }, [userId])

  // Upload image and return public URL (for inline photos in line items, inspections)
  const uploadImage = useCallback(async (
    dataUrl: string,
    filename: string,
    folder: string = 'photos',
    projectId?: string,
  ): Promise<string | null> => {
    if (!userId) return null

    // Convert base64 data URL to Blob
    const res = await fetch(dataUrl)
    const blob = await res.blob()
    const file = new File([blob], filename, { type: blob.type })

    const result = await uploadFile(file, folder, projectId)
    return result?.publicUrl || null
  }, [userId, uploadFile])

  // Delete a file from storage
  const deleteFile = useCallback(async (storagePath: string) => {
    const { error } = await supabase.storage.from(BUCKET).remove([storagePath])
    if (error) throw error

    // Also remove from documents table
    await supabase.from('documents').delete().eq('storage_path', storagePath)
  }, [])

  // Get signed URL for private files
  const getSignedUrl = useCallback(async (storagePath: string, expiresIn = 3600): Promise<string | null> => {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(storagePath, expiresIn)
    if (error) return null
    return data.signedUrl
  }, [])

  // List files in a folder
  const listFiles = useCallback(async (folder: string, projectId?: string) => {
    if (!userId) return []
    const prefix = projectId ? `${userId}/${projectId}/${folder}` : `${userId}/${folder}`
    const { data, error } = await supabase.storage.from(BUCKET).list(prefix)
    if (error) return []
    return data.map(f => ({
      name: f.name,
      path: `${prefix}/${f.name}`,
      size: f.metadata?.size || 0,
      type: f.metadata?.mimetype || '',
      createdAt: f.created_at,
    }))
  }, [userId])

  return { uploadFile, uploadImage, deleteFile, getSignedUrl, listFiles, uploading, progress }
}

function detectCategory(file: File): string {
  const name = file.name.toLowerCase()
  if (file.type.startsWith('image/')) return 'photo'
  if (file.type === 'application/pdf') {
    if (name.includes('invoice')) return 'invoice'
    if (name.includes('estimate')) return 'estimate'
    if (name.includes('contract')) return 'contract'
    if (name.includes('permit')) return 'permit'
    return 'document'
  }
  if (name.includes('drawing') || name.includes('plan')) return 'drawing'
  return 'other'
}
