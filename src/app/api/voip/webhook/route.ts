import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()

    // Check if this is an SMS or a call
    const messageSid = formData.get('MessageSid') as string
    const callSid = formData.get('CallSid') as string

    if (messageSid) {
      // Incoming SMS
      const from = formData.get('From') as string
      const body = formData.get('Body') as string
      console.log(`[Incoming SMS] From: ${from} | Body: ${body}`)

      // Auto-reply TwiML (optional)
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Thanks for your message! We'll get back to you shortly. — Projex</Message>
</Response>`

      return new NextResponse(twiml, { headers: { 'Content-Type': 'text/xml' } })
    }

    if (callSid) {
      // Incoming call — forward to voicemail or greet
      const from = formData.get('From') as string
      console.log(`[Incoming Call] From: ${from}`)

      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Thank you for calling. Please leave a message after the beep and we'll get back to you.</Say>
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
