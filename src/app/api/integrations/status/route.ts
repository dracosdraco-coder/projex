import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const orgId = req.nextUrl.searchParams.get('orgId')
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
