import { NextResponse } from 'next/server'
import { requireUser, signState } from '@/lib/auth-server'

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://projex.live'

  if (!clientId) {
    return NextResponse.redirect(`${appUrl}/access?error=google_not_configured`)
  }

  const { ctx } = await requireUser({ roles: ['owner', 'admin'] })
  if (!ctx) return NextResponse.redirect(`${appUrl}/access?error=integration_not_allowed`)

  const state = encodeURIComponent(signState({ userId: ctx.user.id, orgId: ctx.orgId! }))

  const redirectUri = encodeURIComponent(`${appUrl}/api/integrations/google/callback`)
  const scope = encodeURIComponent('https://www.googleapis.com/auth/calendar')

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth` +
    `?client_id=${clientId}` +
    `&redirect_uri=${redirectUri}` +
    `&response_type=code` +
    `&scope=${scope}` +
    `&access_type=offline` +
    `&prompt=consent` +
    `&state=${state}`

  return NextResponse.redirect(authUrl)
}
