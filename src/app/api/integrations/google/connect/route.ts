import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://projex.live'

  if (!clientId) {
    return NextResponse.redirect(`${appUrl}/access?error=google_not_configured`)
  }

  const userId = req.nextUrl.searchParams.get('userId') || ''
  const orgId = req.nextUrl.searchParams.get('orgId') || ''
  const state = Buffer.from(JSON.stringify({ userId, orgId })).toString('base64')

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
