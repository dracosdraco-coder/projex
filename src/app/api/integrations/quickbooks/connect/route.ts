import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const clientId = process.env.QB_CLIENT_ID
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://projex.live'

  if (!clientId) {
    return NextResponse.redirect(`${appUrl}/access?error=quickbooks_not_configured`)
  }

  const userId = req.nextUrl.searchParams.get('userId') || ''
  const orgId = req.nextUrl.searchParams.get('orgId') || ''
  const state = Buffer.from(JSON.stringify({ userId, orgId })).toString('base64')

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
