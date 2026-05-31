import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ─── Google Ads Lead Form Webhook ───────────────────────────────────────────
//
// Set this URL in Google Ads:
//   Ads → Lead Forms → Webhook URL
//   https://projex.live/api/integrations/google-ads/leads?org=YOUR_ORG_ID&key=YOUR_WEBHOOK_KEY
//
// Google sends:
//   GET  → verification (returns the key)
//   POST → new lead form submission

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase service role not configured')
  return createClient(url, key)
}

// Google verification: GET ?key=YOUR_KEY → must return the key as plain text
export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key')
  if (!key) return new NextResponse('Missing key', { status: 400 })
  return new NextResponse(key, { status: 200, headers: { 'Content-Type': 'text/plain' } })
}

// Incoming lead form submission
export async function POST(req: NextRequest) {
  try {
    const orgId = req.nextUrl.searchParams.get('org')
    const incomingKey = req.nextUrl.searchParams.get('key')
    const expectedKey = process.env.GOOGLE_ADS_WEBHOOK_KEY

    // Verify webhook key if configured
    if (expectedKey && incomingKey !== expectedKey) {
      return NextResponse.json({ error: 'Invalid webhook key' }, { status: 403 })
    }

    const body = await req.json()

    // Parse Google Ads field columns into a flat map
    const cols: Record<string, string> = {}
    for (const col of body.user_column_data || []) {
      cols[col.column_name] = col.string_value || col.number_value?.toString() || ''
    }

    // Build a human-readable name
    const fullName = cols['FULL_NAME']
      || [cols['FIRST_NAME'], cols['LAST_NAME']].filter(Boolean).join(' ')
      || 'Unknown'

    const notes = [
      cols['MESSAGE'],
      cols['DESCRIBE_YOUR_REQUEST'],
      cols['HOW_CAN_I_HELP_YOU'],
      cols['WHAT_IS_YOUR_REQUEST'],
    ].filter(Boolean).join('\n') || ''

    const address = [cols['CITY'], cols['REGION'], cols['COUNTRY']].filter(Boolean).join(', ')

    if (!orgId) {
      return NextResponse.json(
        { error: 'Missing org parameter. Webhook URL must include ?org=YOUR_ORG_ID' },
        { status: 400 }
      )
    }

    const supabase = getServiceClient()

    // Get org owner so we can set user_id (required FK)
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('owner_id')
      .eq('id', orgId)
      .single()

    if (orgError || !org) {
      return NextResponse.json({ error: 'Org not found' }, { status: 404 })
    }

    // Create the lead
    const { error: leadError } = await supabase.from('leads').insert({
      user_id: org.owner_id,
      org_id: orgId,
      name: fullName,
      email: cols['EMAIL'] || '',
      phone: cols['PHONE_NUMBER'] || '',
      company: cols['COMPANY_NAME'] || '',
      address,
      notes,
      source: 'Google Ads',
      status: 'new',
      campaign_name: body.campaign_name || '',
      campaign_id: body.campaign_id?.toString() || '',
      ad_group_name: body.ad_group_name || '',
      google_click_id: body.gcl_id || '',
    })

    if (leadError) {
      console.error('[Google Ads Lead] DB insert error:', leadError)
      return NextResponse.json({ error: leadError.message }, { status: 500 })
    }

    console.log(`[Google Ads Lead] Created lead: ${fullName} | Campaign: ${body.campaign_name}`)
    return NextResponse.json({ success: true, lead: fullName })
  } catch (err: any) {
    console.error('[Google Ads Lead] Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
