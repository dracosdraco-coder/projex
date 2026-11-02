import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { requireUser } from '@/lib/auth-server'
import { sendInviteEmail, getInviterContext, inviteUrl } from '@/lib/invites'

type Params = { params: Promise<{ id: string }> }

async function loadOpenInvite(admin: any, id: string, orgId: string) {
  const { data } = await admin.from('org_invites')
    .select('id, email, role, accepted_at, revoked_at')
    .eq('id', id).eq('org_id', orgId).maybeSingle()
  return data && !data.accepted_at && !data.revoked_at ? data : null
}

// Resend: issue a fresh token (old link stops working), extend expiry, email again
export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const { ctx, error } = await requireUser({ roles: ['owner', 'admin'] })
    if (error) return error
    const { id } = await params

    const invite = await loadOpenInvite(ctx.admin, id, ctx.orgId!)
    if (!invite) return NextResponse.json({ error: 'Invite not found or no longer pending' }, { status: 404 })

    const token = crypto.randomBytes(24).toString('hex')
    const { error: updateErr } = await ctx.admin.from('org_invites')
      .update({ token, expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() })
      .eq('id', invite.id)
    if (updateErr) return NextResponse.json({ error: 'Could not resend invite' }, { status: 500 })

    const { inviterName, orgName } = await getInviterContext(ctx.admin, ctx.user.id, ctx.orgId!)
    const url = inviteUrl(token)
    const emailSent = await sendInviteEmail({ to: invite.email, inviterName, orgName, role: invite.role, url })

    return NextResponse.json({ success: true, emailSent, inviteUrl: url })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// Revoke: the link stops working and the seat is freed
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { ctx, error } = await requireUser({ roles: ['owner', 'admin'] })
    if (error) return error
    const { id } = await params

    const invite = await loadOpenInvite(ctx.admin, id, ctx.orgId!)
    if (!invite) return NextResponse.json({ error: 'Invite not found or no longer pending' }, { status: 404 })

    const { error: updateErr } = await ctx.admin.from('org_invites')
      .update({ revoked_at: new Date().toISOString() }).eq('id', invite.id)
    if (updateErr) return NextResponse.json({ error: 'Could not revoke invite' }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
