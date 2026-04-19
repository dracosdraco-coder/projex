import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

async function refreshGoogleToken(supabase: any, orgId: string) {
  const { data: integ } = await supabase
    .from('integrations')
    .select('refresh_token')
    .eq('org_id', orgId)
    .eq('provider', 'google')
    .single()

  if (!integ?.refresh_token) throw new Error('No refresh token')

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: integ.refresh_token,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: 'refresh_token',
    }).toString(),
  })

  if (!res.ok) throw new Error('Google token refresh failed')
  const tokens = await res.json()
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

  await supabase.from('integrations').update({
    access_token: tokens.access_token,
    expires_at: expiresAt,
    updated_at: new Date().toISOString(),
  }).eq('org_id', orgId).eq('provider', 'google')

  return tokens.access_token as string
}

export async function POST(req: NextRequest) {
  try {
    const { orgId, syncType = 'projects' } = await req.json()
    if (!orgId) return NextResponse.json({ error: 'Missing orgId' }, { status: 400 })

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: integ } = await supabase
      .from('integrations')
      .select('access_token, expires_at')
      .eq('org_id', orgId)
      .eq('provider', 'google')
      .single()

    if (!integ) return NextResponse.json({ error: 'Google Calendar not connected' }, { status: 400 })

    let accessToken = integ.access_token
    if (integ.expires_at && new Date(integ.expires_at) <= new Date()) {
      accessToken = await refreshGoogleToken(supabase, orgId)
    }

    const calendarApi = 'https://www.googleapis.com/calendar/v3/calendars/primary/events'
    const headers = { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' }
    const results: any = { synced: 0, errors: [] }

    if (syncType === 'projects' || syncType === 'all') {
      const { data: projects } = await supabase
        .from('projects')
        .select('id, name, description, end_date, start_date, status, address')
        .eq('org_id', orgId)
        .eq('status', 'active')
        .not('end_date', 'is', null)

      for (const p of (projects || [])) {
        try {
          const event = {
            summary: `📋 ${p.name} — Deadline`,
            description: [p.description, p.address].filter(Boolean).join('\n'),
            start: { date: p.end_date.split('T')[0] },
            end: { date: p.end_date.split('T')[0] },
            colorId: '6',
            source: { title: 'Projex', url: `${process.env.NEXT_PUBLIC_APP_URL}/access` },
          }
          await fetch(calendarApi, { method: 'POST', headers, body: JSON.stringify(event) })
          results.synced++
        } catch (e: any) {
          results.errors.push(`Project "${p.name}": ${e.message}`)
        }
      }
    }

    if (syncType === 'meetings' || syncType === 'all') {
      const { data: meetings } = await supabase
        .from('meetings')
        .select('title, description, start_time, end_time, location')
        .eq('org_id', orgId)
        .gte('start_time', new Date().toISOString())

      for (const m of (meetings || [])) {
        try {
          const event = {
            summary: m.title,
            description: m.description || '',
            location: m.location || '',
            start: { dateTime: m.start_time },
            end: { dateTime: m.end_time || m.start_time },
            source: { title: 'Projex', url: `${process.env.NEXT_PUBLIC_APP_URL}/access` },
          }
          await fetch(calendarApi, { method: 'POST', headers, body: JSON.stringify(event) })
          results.synced++
        } catch (e: any) {
          results.errors.push(`Meeting "${m.title}": ${e.message}`)
        }
      }
    }

    return NextResponse.json({ success: true, ...results })
  } catch (err: any) {
    console.error('Google sync error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
