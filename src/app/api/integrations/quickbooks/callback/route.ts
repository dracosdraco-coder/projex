import { NextRequest, NextResponse } from 'next/server'
import { requireUser, verifyState } from '@/lib/auth-server'

export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://projex.live'

  try {
    const code = req.nextUrl.searchParams.get('code')
    const realmId = req.nextUrl.searchParams.get('realmId')
    const stateRaw = req.nextUrl.searchParams.get('state') || ''
    const error = req.nextUrl.searchParams.get('error')

    if (error) return NextResponse.redirect(`${appUrl}/access?error=qb_auth_denied`)
    if (!code || !realmId) return NextResponse.redirect(`${appUrl}/access?error=qb_missing_params`)

    // State is HMAC-signed by /connect and must belong to whoever is completing the flow
    const state = verifyState(stateRaw)
    const { ctx } = await requireUser({ roles: ['owner', 'admin'] })
    if (!state || !ctx || ctx.user.id !== state.userId || ctx.orgId !== state.orgId) {
      return NextResponse.redirect(`${appUrl}/access?error=qb_invalid_state`)
    }
    const { userId, orgId } = state

    const clientId = process.env.QB_CLIENT_ID!
    const clientSecret = process.env.QB_CLIENT_SECRET!
    const redirectUri = `${appUrl}/api/integrations/quickbooks/callback`

    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        'Accept': 'application/json',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }).toString(),
    })

    if (!tokenRes.ok) {
      const err = await tokenRes.text()
      console.error('QB token exchange failed:', err)
      return NextResponse.redirect(`${appUrl}/access?error=qb_token_exchange`)
    }

    const tokens = await tokenRes.json()
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

    const supabase = ctx.admin

    await supabase.from('integrations').upsert({
      user_id: userId,
      org_id: orgId,
      provider: 'quickbooks',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      realm_id: realmId,
      token_type: tokens.token_type,
      expires_at: expiresAt,
      scope: tokens.scope || 'com.intuit.quickbooks.accounting',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'org_id,provider' })

    return NextResponse.redirect(`${appUrl}/access?integration=quickbooks_connected`)
  } catch (err: any) {
    console.error('QB callback error:', err)
    return NextResponse.redirect(`${appUrl}/access?error=qb_callback_error`)
  }
}
