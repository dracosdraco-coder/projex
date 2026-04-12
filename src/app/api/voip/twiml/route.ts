import { NextResponse } from 'next/server'

export async function POST() {
  // TwiML that says a greeting and connects the call
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Connecting your call via Projex.</Say>
  <Dial callerId="${process.env.TWILIO_PHONE_NUMBER || ''}">
  </Dial>
</Response>`

  return new NextResponse(twiml, {
    headers: { 'Content-Type': 'text/xml' },
  })
}

export async function GET() {
  return POST()
}
