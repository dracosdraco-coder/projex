import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Per-org sliding-window rate limit backed by the api_rate_events table
 * (supabase/migration-api-rate-limits.sql). In-memory counters don't work
 * across serverless instances, so this goes through the database.
 *
 * Fails open (allows) if the table doesn't exist yet, so deploying this
 * before running the migration doesn't take messaging down.
 */
export async function checkRateLimit(
  admin: SupabaseClient,
  orgId: string,
  bucket: string,
  { limit = 50, windowMs = 60 * 60 * 1000, cost = 1 } = {}
): Promise<{ allowed: boolean; remaining: number }> {
  const since = new Date(Date.now() - windowMs).toISOString()

  const { data, error } = await admin
    .from('api_rate_events')
    .select('cost')
    .eq('org_id', orgId)
    .eq('bucket', bucket)
    .gte('created_at', since)

  if (error) {
    console.warn(`[rate-limit] ${bucket}: ${error.message} — allowing request`)
    return { allowed: true, remaining: limit }
  }

  const used = (data || []).reduce((sum, r: any) => sum + (r.cost || 1), 0)
  if (used + cost > limit) return { allowed: false, remaining: Math.max(0, limit - used) }

  await admin.from('api_rate_events').insert({ org_id: orgId, bucket, cost })
  return { allowed: true, remaining: limit - used - cost }
}
