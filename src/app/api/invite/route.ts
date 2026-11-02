import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth-server'
import {
  ASSIGNABLE_ROLES, getSeatUsage, sendInviteEmail, getInviterContext, inviteUrl,
} from '@/lib/invites'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Invite someone to the caller's org. Creates an org_invites row and a contact-list
// entry (team_members), and emails a /invite/{token} link. Nobody is added to the org
// until they open the link and accept.
export async function POST(req: NextRequest) {
  try {
    const { ctx, error } = await requireUser({ roles: ['owner', 'admin'] })
    if (error) return error

    const admin = ctx.admin
    const orgId = ctx.orgId!
    const { memberName, memberEmail, memberRole, memberPhone } = await req.json()

    if (typeof memberEmail !== 'string' || !EMAIL_RE.test(memberEmail.trim())) {
      return NextResponse.json({ error: 'A valid email is required' }, { status: 400 })
    }
    const role = memberRole || 'worker'
    if (!ASSIGNABLE_ROLES.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    const email = memberEmail.trim().toLowerCase()
    const name = (typeof memberName === 'string' && memberName.trim()) || email.split('@')[0]
    const { inviterName, orgName, ownerId } = await getInviterContext(admin, ctx.user.id, orgId)

    const { data: existingMember } = await admin.from('org_members')
      .select('id').eq('org_id', orgId).eq('email', email).eq('status', 'active').maybeSingle()
    if (existingMember) {
      return NextResponse.json({ error: `${email} is already a member of ${orgName}.`, code: 'ALREADY_MEMBER' }, { status: 409 })
    }

    const { data: openInvite } = await admin.from('org_invites')
      .select('id').eq('org_id', orgId).eq('email', email)
      .is('accepted_at', null).is('revoked_at', null).maybeSingle()
    if (openInvite) {
      return NextResponse.json({
        error: `${email} already has a pending invite. Resend it from Team → Members.`,
        code: 'ALREADY_INVITED',
      }, { status: 409 })
    }

    const seats = await getSeatUsage(admin, orgId, ownerId)
    if (!seats.subscribed) {
      return NextResponse.json({
        error: 'You need an active subscription to invite team members. Start a free trial to get started.',
        code: 'NO_SUBSCRIPTION',
      }, { status: 403 })
    }
    if (seats.used >= seats.max) {
      const planLabel = seats.plan.charAt(0).toUpperCase() + seats.plan.slice(1)
      return NextResponse.json({
        error: `You've used all ${seats.max} seats on your ${planLabel} plan (members plus pending invites). Revoke an invite or upgrade to add more.`,
        code: 'SEAT_LIMIT', current: seats.used, max: seats.max,
      }, { status: 403 })
    }

    const { data: invite, error: inviteErr } = await admin.from('org_invites')
      .insert({ org_id: orgId, email, name, role, invited_by: ctx.user.id })
      .select('id, token')
      .single()
    if (inviteErr || !invite) {
      console.error('Failed to create invite:', inviteErr)
      return NextResponse.json({ error: 'Could not create the invite. Please try again.' }, { status: 500 })
    }

    // Contact-list entry, linked to the invite so acceptance can attach the real member
    const { data: teamMember } = await admin.from('team_members')
      .insert({
        user_id: ctx.user.id, org_id: orgId, name, email, role,
        phone: typeof memberPhone === 'string' ? memberPhone : null,
        invite_id: invite.id,
      })
      .select()
      .single()

    const url = inviteUrl(invite.token)
    const emailSent = await sendInviteEmail({ to: email, inviterName, orgName, role, url })

    return NextResponse.json({
      success: true,
      emailSent,
      // Returned so admins can copy the link when email isn't configured or fails
      inviteUrl: url,
      teamMember,
      seatsUsed: seats.used + 1,
      seatsMax: seats.max,
    })
  } catch (err: any) {
    console.error('Invite error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
