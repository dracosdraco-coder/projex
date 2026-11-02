import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth-server'

const ERRORS: Record<string, [number, string]> = {
  invite_not_found: [404, 'This invite link is not valid.'],
  invite_revoked: [410, 'This invite was revoked. Ask your admin for a new one.'],
  invite_used: [410, 'This invite has already been used.'],
  invite_expired: [410, 'This invite has expired. Ask your admin to resend it.'],
}

// Accept an invite as the signed-in user. The database function validates the token,
// creates the membership, links the contact-list entry and makes it the active org.
export async function POST(req: NextRequest) {
  try {
    const { ctx, error } = await requireUser()
    if (error) return error

    const { token } = await req.json()
    if (typeof token !== 'string' || !/^[a-f0-9]{48}$/.test(token)) {
      return NextResponse.json({ error: ERRORS.invite_not_found[1] }, { status: 404 })
    }

    // Runs as the user (auth.uid()), not the service role
    const { data: orgId, error: rpcErr } = await ctx.supa.rpc('accept_org_invite', { invite_token: token })
    if (rpcErr) {
      const known = Object.keys(ERRORS).find(k => rpcErr.message.includes(k))
      if (known) return NextResponse.json({ error: ERRORS[known][1], code: known }, { status: ERRORS[known][0] })
      console.error('accept_org_invite failed:', rpcErr)
      return NextResponse.json({ error: 'Could not accept the invite. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, orgId })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
