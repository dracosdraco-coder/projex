import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const callSid = formData.get('CallSid') as string
    const callStatus = formData.get('CallStatus') as string
    const duration = formData.get('CallDuration') as string
    const to = formData.get('To') as string
    const from = formData.get('From') as string

    console.log(`[Call Status] ${callSid}: ${callStatus} | ${from} → ${to} | ${duration || 0}s`)

    return NextResponse.json({ received: true })
  } catch {
    return NextResponse.json({ received: true })
  }
}
