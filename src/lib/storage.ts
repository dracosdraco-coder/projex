import { supabase } from '@/lib/supabase'

// Private bucket — files are only reachable through signed URLs.
// Paths are org-scoped: {org_id}/{project_id|general}/{kind}/{timestamp}_{name}
// (the storage RLS policy checks the first segment against org membership).
export const BUCKET = 'documents'

// Long enough that a window left open during a work session keeps working;
// URLs are re-signed on every reload.
const SIGNED_URL_TTL = 6 * 60 * 60

export function buildStoragePath(orgId: string, projectId: string | null | undefined, kind: string, fileName: string) {
  const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
  return `${orgId}/${projectId || 'general'}/${kind}/${Date.now()}_${safe}`
}

// orgId loads asynchronously; fall back to the profile so uploads never race it.
export async function resolveOrgId(userId: string, current?: string | null): Promise<string> {
  if (current) return current
  const { data } = await supabase.from('profiles').select('org_id').eq('id', userId).single()
  if (!data?.org_id) throw new Error('No organization found for your account')
  return data.org_id
}

/** Sign many storage paths in one request. Returns path → signed URL (missing on failure). */
export async function signPaths(paths: string[]): Promise<Record<string, string>> {
  const unique = Array.from(new Set(paths.filter(Boolean)))
  if (unique.length === 0) return {}
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrls(unique, SIGNED_URL_TTL)
  if (error || !data) return {}
  const out: Record<string, string> = {}
  for (const item of data) {
    if (item.path && item.signedUrl) out[item.path] = item.signedUrl
  }
  return out
}

export async function signPath(path: string): Promise<string> {
  const urls = await signPaths([path])
  return urls[path] || ''
}
