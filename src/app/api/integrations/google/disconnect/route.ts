import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth-server'

export async function POST() {
  try {
    const { ctx, error } = await requireUser({ roles: ['owner', 'admin'] })
    if (error) return error

    const orgId = ctx.orgId!
    await ctx.admin.from('integrations').delete().eq('org_id', orgId).eq('provider', 'google')
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
