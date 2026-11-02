import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth-server'

export async function GET() {
  try {
    const { ctx, error } = await requireUser()
    if (error) return error

    const supabase = ctx.admin
    const orgId = ctx.orgId
    if (!orgId) return NextResponse.json({ quickbooks: false, google: false })

    const { data } = await supabase
      .from('integrations')
      .select('provider, expires_at, realm_id')
      .eq('org_id', orgId)

    const now = new Date()
    const qb = data?.find(r => r.provider === 'quickbooks')
    const gc = data?.find(r => r.provider === 'google')

    return NextResponse.json({
      quickbooks: !!qb && (!qb.expires_at || new Date(qb.expires_at) > now),
      quickbooksRealmId: qb?.realm_id || null,
      google: !!gc && (!gc.expires_at || new Date(gc.expires_at) > now),
    })
  } catch {
    return NextResponse.json({ quickbooks: false, google: false })
  }
}
