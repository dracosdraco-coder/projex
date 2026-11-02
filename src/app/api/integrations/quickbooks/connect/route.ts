import { NextResponse } from 'next/server'
import { requireUser, signState } from '@/lib/auth-server'

export async function GET() {
  const clientId = process.env.QB_CLIENT_ID
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://projex.live'

  if (!clientId) {
    return NextResponse.redirect(`${appUrl}/access?error=quickbooks_not_configured`)
  }

  const { ctx } = await requireUser({ roles: ['owner', 'admin'] })
  if (!ctx) return NextResponse.redirect(`${appUrl}/access?error=integration_not_allowed`)

  const state = encodeURIComponent(signState({ userId: ctx.user.id, orgId: ctx.orgId! }))

  const redirectUri = encodeURIComponent(`${appUrl}/api/integrations/quickbooks/callback`)
  const scope = encodeURIComponent('com.intuit.quickbooks.accounting')

  const authUrl = `https://appcenter.intuit.com/connect/oauth2` +
    `?client_id=${clientId}` +
    `&redirect_uri=${redirectUri}` +
    `&response_type=code` +
    `&scope=${scope}` +
    `&state=${state}`

  return NextResponse.redirect(authUrl)
}
