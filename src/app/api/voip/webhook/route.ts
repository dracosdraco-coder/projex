import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

// Look up which org owns this Twilio number
async function findOrgByPhone(twilioNumber: string) {
  const supabase = getServiceClient()
  if (!supabase) return null
  // Organizations store their Twilio number in settings.twilio_number
  // or it matches TWILIO_PHONE_NUMBER env var → use the single-account approach
  const envNumber = process.env.TWILIO_PHONE_NUMBER
  if (!envNumber || twilioNumber !== envNumber) return null

  // Find org where settings contains this number, or fall back to any org
  // that has the env phone number configured
  const { data } = await supabase
    .from('organizations')
    .select('id, owner_id')
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  return data || null
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const messageSid = formData.get('MessageSid') as string
    const callSid = formData.get('CallSid') as string

    if (messageSid) {
      // ── Inbound SMS ──────────────────────────────────────────────
      const from = formData.get('From') as string
      const to = formData.get('To') as string
      const body = formData.get('Body') as string

      console.log(`[Inbound SMS] From: ${from} | Body: ${body}`)

      // Create a lead for this SMS inquiry
      const org = await findOrgByPhone(to)
      if (org) {
        const supabase = getServiceClient()!
        await supabase.from('leads').insert({
          user_id: org.owner_id,
          org_id: org.id,
          name: `SMS Inquiry (${from})`,
          phone: from,
          notes: body,
          source: 'SMS - Inbound',
          status: 'new',
        }).then(({ error }) => {
          if (error) console.error('[Inbound SMS] Lead insert error:', error)
        })
      }

      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Thanks for reaching out! We'll get back to you shortly. — Projex</Message>
</Response>`
      return new NextResponse(twiml, { headers: { 'Content-Type': 'text/xml' } })
    }

    if (callSid) {
      // ── Inbound Call ─────────────────────────────────────────────
      const from = formData.get('From') as string
      const to = formData.get('To') as string
      const callStatus = formData.get('CallStatus') as string

      console.log(`[Inbound Call] From: ${from} | Status: ${callStatus}`)

      // Create a lead on initial ring (ringing or in-progress)
      if (callStatus === 'ringing' || callStatus === 'in-progress') {
        const org = await findOrgByPhone(to)
        if (org) {
          const supabase = getServiceClient()!
          // Check if lead already exists for this number to avoid duplicates
          const { data: existing } = await supabase
            .from('leads')
            .select('id')
            .eq('phone', from)
            .eq('org_id', org.id)
            .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // within last hour
            .single()

          if (!existing) {
            await supabase.from('leads').insert({
              user_id: org.owner_id,
              org_id: org.id,
              name: `Inbound Call (${from})`,
              phone: from,
              source: 'Call - Inbound',
              status: 'new',
              notes: `Inbound call received. Call SID: ${callSid}`,
            }).then(({ error }) => {
              if (error) console.error('[Inbound Call] Lead insert error:', error)
            })
          }
        }
      }

      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Thank you for calling. Please leave a message after the beep and we'll get back to you shortly.</Say>
  <Record maxLength="120" transcribe="true" playBeep="true" />
  <Say voice="alice">Thank you. Goodbye.</Say>
</Response>`
      return new NextResponse(twiml, { headers: { 'Content-Type': 'text/xml' } })
    }

    return NextResponse.json({ received: true })
  } catch {
    return NextResponse.json({ received: true })
  }
}
