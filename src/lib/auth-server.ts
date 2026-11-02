import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'
import crypto from 'crypto'

export interface AuthContext {
  user: User
  orgId: string | null
  role: string | null
  /** Anon-key client acting as the signed-in user (RLS applies) */
  supa: SupabaseClient
  /** Service-role client — only use with ids taken from this context, never from the request */
  admin: SupabaseClient
}

type AuthResult = { ctx: AuthContext; error: null } | { ctx: null; error: NextResponse }

interface RequireUserOptions {
  /** Fail with 403 unless the user belongs to an org */
  requireOrg?: boolean
  /** Fail with 403 unless the user's org role is one of these (implies requireOrg) */
  roles?: string[]
}

export function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase service role not configured')
  return createClient(url, key)
}

const fail = (status: number, error: string) => ({ ctx: null, error: NextResponse.json({ error }, { status }) })

/**
 * Resolve the signed-in user from the session cookie, plus their active org and role.
 * Usage:  const { ctx, error } = await requireUser(); if (error) return error
 */
export async function requireUser(opts: RequireUserOptions = {}): Promise<AuthResult> {
  const store = await cookies()
  const supa = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => store.getAll(), setAll: () => {} } }
  )

  const { data: { user } } = await supa.auth.getUser()
  if (!user) return fail(401, 'Unauthorized')

  let admin: SupabaseClient
  try { admin = getAdminClient() } catch { return fail(500, 'Server config error') }

  // The profile's org_id is the "current" org, but only trust it if there is an active membership
  const { data: profile } = await admin.from('profiles').select('org_id').eq('id', user.id).single()

  let orgId: string | null = null
  let role: string | null = null

  if (profile?.org_id) {
    const { data: m } = await admin.from('org_members')
      .select('org_id, role')
      .eq('user_id', user.id).eq('org_id', profile.org_id).eq('status', 'active')
      .maybeSingle()
    if (m) { orgId = m.org_id; role = m.role }
  }

  if (!orgId) {
    const { data: m } = await admin.from('org_members')
      .select('org_id, role')
      .eq('user_id', user.id).eq('status', 'active')
      .order('created_at', { ascending: true })
      .limit(1).maybeSingle()
    if (m) { orgId = m.org_id; role = m.role }
  }

  if ((opts.requireOrg || opts.roles) && !orgId) return fail(403, 'No organization found')
  if (opts.roles && (!role || !opts.roles.includes(role))) return fail(403, 'Insufficient permissions')

  return { ctx: { user, orgId, role, supa, admin }, error: null }
}

// ─── Signed OAuth state ─────────────────────────────────────────────────────

function stateSecret() {
  const secret = process.env.OAUTH_STATE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!secret) throw new Error('OAUTH_STATE_SECRET not configured')
  return secret
}

export function signState(payload: { userId: string; orgId: string }) {
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 10 * 60 * 1000 })).toString('base64url')
  const sig = crypto.createHmac('sha256', stateSecret()).update(body).digest('base64url')
  return `${body}.${sig}`
}

export function verifyState(state: string): { userId: string; orgId: string } | null {
  const [body, sig] = state.split('.')
  if (!body || !sig) return null
  const expected = crypto.createHmac('sha256', stateSecret()).update(body).digest('base64url')
  if (!safeEqual(sig, expected)) return null
  try {
    const parsed = JSON.parse(Buffer.from(body, 'base64url').toString())
    if (!parsed.exp || parsed.exp < Date.now()) return null
    return { userId: parsed.userId, orgId: parsed.orgId }
  } catch {
    return null
  }
}

export function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb)
}

export function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
}
