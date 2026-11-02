import { getAdminClient } from '@/lib/auth-server'
import InviteClient from './InviteClient'

export const dynamic = 'force-dynamic'

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  if (!/^[a-f0-9]{48}$/.test(token)) {
    return <InviteClient token={token} state="invalid" />
  }

  const admin = getAdminClient()
  const { data: invite } = await admin.from('org_invites')
    .select('email, role, invited_by, expires_at, accepted_at, revoked_at, organizations(name)')
    .eq('token', token)
    .maybeSingle()

  if (!invite) return <InviteClient token={token} state="invalid" />

  const state = invite.revoked_at ? 'revoked'
    : invite.accepted_at ? 'used'
    : new Date(invite.expires_at) < new Date() ? 'expired'
    : 'open'

  let inviterName = 'Your team admin'
  if (invite.invited_by) {
    const { data: p } = await admin.from('profiles').select('full_name').eq('id', invite.invited_by).maybeSingle()
    if (p?.full_name) inviterName = p.full_name
  }

  return (
    <InviteClient
      token={token}
      state={state}
      email={invite.email}
      role={invite.role}
      orgName={(invite.organizations as any)?.name || 'a team'}
      inviterName={inviterName}
    />
  )
}
