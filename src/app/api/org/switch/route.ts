import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth-server'

// Make one of the caller's orgs the active one (profiles.org_id).
export async function POST(req: NextRequest) {
  try {
    const { ctx, error } = await requireUser()
    if (error) return error

    const { orgId } = await req.json()
    if (typeof orgId !== 'string') return NextResponse.json({ error: 'Missing orgId' }, { status: 400 })

    const { data: membership } = await ctx.admin.from('org_members')
      .select('id').eq('org_id', orgId).eq('user_id', ctx.user.id).eq('status', 'active').maybeSingle()
    if (!membership) return NextResponse.json({ error: 'You are not a member of that organization' }, { status: 403 })

    const { error: updateErr } = await ctx.admin.from('profiles').update({ org_id: orgId }).eq('id', ctx.user.id)
    if (updateErr) return NextResponse.json({ error: 'Could not switch organization' }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
