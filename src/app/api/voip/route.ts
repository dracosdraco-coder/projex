import { NextRequest, NextResponse } from 'next/server'

// Lazy-load twilio to avoid build errors if not installed
async function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  if (!accountSid || !authToken) throw new Error('Twilio not configured')
  const twilio = (await import('twilio')).default
  return twilio(accountSid, authToken)
}

const TWILIO_NUMBER = () => process.env.TWILIO_PHONE_NUMBER || ''

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action } = body

    // ===== SEND SMS =====
    if (action === 'send_sms') {
      const { to, message } = body
      if (!to || !message) return NextResponse.json({ error: 'Missing to or message' }, { status: 400 })

      const client = await getTwilioClient()
      const msg = await client.messages.create({
        body: message,
        from: TWILIO_NUMBER(),
        to: to.startsWith('+') ? to : `+1${to.replace(/\D/g, '')}`,
      })

      return NextResponse.json({
        success: true,
        sid: msg.sid,
        status: msg.status,
        to: msg.to,
      })
    }

    // ===== INITIATE CALL =====
    if (action === 'make_call') {
      const { to } = body
      if (!to) return NextResponse.json({ error: 'Missing phone number' }, { status: 400 })

      const client = await getTwilioClient()
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://projex.live'

      const call = await client.calls.create({
        to: to.startsWith('+') ? to : `+1${to.replace(/\D/g, '')}`,
        from: TWILIO_NUMBER(),
        url: `${appUrl}/api/voip/twiml`,
        statusCallback: `${appUrl}/api/voip/status`,
        statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
        statusCallbackMethod: 'POST',
      })

      return NextResponse.json({
        success: true,
        sid: call.sid,
        status: call.status,
      })
    }

    // ===== GET CALL LOGS =====
    if (action === 'get_logs') {
      const client = await getTwilioClient()
      const calls = await client.calls.list({ limit: 50 })
      const messages = await client.messages.list({ limit: 50 })

      return NextResponse.json({
        calls: calls.map(c => ({
          sid: c.sid,
          to: c.to,
          from: c.from,
          status: c.status,
          direction: c.direction,
          duration: parseInt(c.duration || '0'),
          startTime: c.startTime?.toISOString(),
          endTime: c.endTime?.toISOString(),
        })),
        messages: messages.map(m => ({
          sid: m.sid,
          to: m.to,
          from: m.from,
          body: m.body,
          status: m.status,
          direction: m.direction,
          dateSent: m.dateSent?.toISOString(),
        })),
      })
    }

    // ===== SEND BULK SMS =====
    if (action === 'bulk_sms') {
      const { recipients, message } = body
      if (!recipients || !message) return NextResponse.json({ error: 'Missing recipients or message' }, { status: 400 })

      const client = await getTwilioClient()
      const numbers: string[] = recipients.split(',').map((n: string) => n.trim()).filter(Boolean)
      let sent = 0, failed = 0

      for (const num of numbers) {
        try {
          await client.messages.create({
            body: message,
            from: TWILIO_NUMBER(),
            to: num.startsWith('+') ? num : `+1${num.replace(/\D/g, '')}`,
          })
          sent++
        } catch { failed++ }
      }

      return NextResponse.json({ success: true, sent, failed, total: numbers.length })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err: any) {
    console.error('VoIP error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
