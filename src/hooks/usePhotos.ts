'use client'

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { BUCKET, buildStoragePath, resolveOrgId, signPaths, signPath } from '@/lib/storage'

export interface Photo {
  id: string
  projectId: string
  storagePath: string
  url: string
  name: string
  caption: string
  category: string
  createdAt: string
}


export function usePhotos(userId: string | undefined, orgId?: string | null) {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(false)

  const loadPhotos = useCallback(async (projectId?: string) => {
    if (!userId) return []
    setLoading(true)
    try {
      let query = supabase
        .from('photos')
        .select('*')
        .eq(orgId ? 'org_id' : 'user_id', orgId || userId)
        .order('created_at', { ascending: false })

      if (projectId) query = query.eq('project_id', projectId)

      const { data, error } = await query
      if (error) throw error

      // public_url is legacy — the bucket is private, so always sign storage_path
      const urls = await signPaths((data || []).map((p: any) => p.storage_path))
      const mapped: Photo[] = (data || []).map((p: any) => ({
        id: p.id,
        projectId: p.project_id,
        storagePath: p.storage_path,
        url: urls[p.storage_path] || '',
        name: p.name || '',
        caption: p.caption || '',
        category: p.category || 'General',
        createdAt: p.created_at,
      }))

      setPhotos(mapped)
      return mapped
    } catch (err) {
      console.error('Failed to load photos:', err)
      return []
    } finally {
      setLoading(false)
    }
  }, [userId, orgId])

  const uploadPhoto = useCallback(async (
    projectId: string,
    file: File,
    caption: string,
    category: string,
  ): Promise<Photo | null> => {
    if (!userId) return null
    try {
      const resolvedOrgId = await resolveOrgId(userId, orgId)
      const storagePath = buildStoragePath(resolvedOrgId, projectId, 'photos', file.name)

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, file, { cacheControl: '3600', upsert: false })

      if (uploadError) throw uploadError

      // Persist metadata to DB
      const { data: row, error: dbError } = await supabase
        .from('photos')
        .insert({
          user_id: userId,
          org_id: resolvedOrgId,
          project_id: projectId,
          storage_path: storagePath,
          public_url: '', // legacy NOT NULL column; URLs are signed on load
          name: file.name,
          caption,
          category,
        })
        .select()
        .single()

      if (dbError) throw dbError

      const newPhoto: Photo = {
        id: row.id,
        projectId: row.project_id,
        storagePath: row.storage_path,
        url: await signPath(row.storage_path),
        name: row.name || '',
        caption: row.caption || '',
        category: row.category || 'General',
        createdAt: row.created_at,
      }

      setPhotos(prev => [newPhoto, ...prev])
      return newPhoto
    } catch (err) {
      console.error('Failed to upload photo:', err)
      throw err
    }
  }, [userId, orgId])

  const deletePhoto = useCallback(async (photo: Photo) => {
    try {
      // Remove from storage
      await supabase.storage.from(BUCKET).remove([photo.storagePath])
      // Remove from DB
      await supabase.from('photos').delete().eq('id', photo.id)
      setPhotos(prev => prev.filter(p => p.id !== photo.id))
    } catch (err) {
      console.error('Failed to delete photo:', err)
    }
  }, [])

  return { photos, setPhotos, loading, loadPhotos, uploadPhoto, deletePhoto }
}
