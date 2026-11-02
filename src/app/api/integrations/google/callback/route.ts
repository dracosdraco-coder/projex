import { NextRequest, NextResponse } from 'next/server'
import { requireUser, verifyState } from '@/lib/auth-server'

export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://projex.live'

  try {
    const code = req.nextUrl.searchParams.get('code')
    const stateRaw = req.nextUrl.searchParams.get('state') || ''
    const error = req.nextUrl.searchParams.get('error')

    if (error) return NextResponse.redirect(`${appUrl}/access?error=google_auth_denied`)
    if (!code) return NextResponse.redirect(`${appUrl}/access?error=google_missing_code`)

    // State is HMAC-signed by /connect and must belong to whoever is completing the flow
    const state = verifyState(stateRaw)
    const { ctx } = await requireUser({ roles: ['owner', 'admin'] })
    if (!state || !ctx || ctx.user.id !== state.userId || ctx.orgId !== state.orgId) {
      return NextResponse.redirect(`${appUrl}/access?error=google_invalid_state`)
    }
    const { userId, orgId } = state

    const clientId = process.env.GOOGLE_CLIENT_ID!
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET!
    const redirectUri = `${appUrl}/api/integrations/google/callback`

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }).toString(),
    })

    if (!tokenRes.ok) {
      const err = await tokenRes.text()
      console.error('Google token exchange failed:', err)
      return NextResponse.redirect(`${appUrl}/access?error=google_token_exchange`)
    }

    const tokens = await tokenRes.json()
    const expiresAt = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      : null

    const supabase = ctx.admin

    await supabase.from('integrations').upsert({
      user_id: userId,
      org_id: orgId,
      provider: 'google',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_type: tokens.token_type,
      expires_at: expiresAt,
      scope: tokens.scope,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'org_id,provider' })

    return NextResponse.redirect(`${appUrl}/access?integration=google_connected`)
  } catch (err: any) {
    console.error('Google callback error:', err)
    return NextResponse.redirect(`${appUrl}/access?error=google_callback_error`)
  }
}
