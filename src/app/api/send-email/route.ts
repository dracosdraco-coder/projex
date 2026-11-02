import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { requireUser } from '@/lib/auth-server'
import { checkRateLimit } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  try {
    const { ctx, error } = await requireUser({ requireOrg: true })
    if (error) return error

    const host = process.env.SMTP_HOST
    const port = parseInt(process.env.SMTP_PORT || '587')
    const user = process.env.SMTP_USER
    const pass = process.env.SMTP_PASS
    const from = process.env.SMTP_FROM || user

    if (!host || !user || !pass) {
      console.error('Email: Missing SMTP env vars', { hasHost: !!host, hasUser: !!user, hasPass: !!pass })
      return NextResponse.json({ error: 'Email not configured' }, { status: 500 })
    }

    const { to, cc, subject, html, text, replyTo } = await req.json()

    if (!to || !subject) {
      return NextResponse.json({ error: 'Missing to or subject' }, { status: 400 })
    }

    const recipients = [to, cc].flat().filter(Boolean).flatMap((r: string) => String(r).split(',')).length
    const limit = await checkRateLimit(ctx.admin, ctx.orgId!, 'email', { cost: recipients })
    if (!limit.allowed) {
      return NextResponse.json({ error: 'Hourly email limit reached. Try again later.', code: 'RATE_LIMIT' }, { status: 429 })
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    })

    const result = await transporter.sendMail({
      from,
      to,
      cc: cc || undefined,
      replyTo: replyTo || user,
      subject,
      text: text || '',
      html: html || undefined,
    })

    return NextResponse.json({ success: true, messageId: result.messageId })
  } catch (err: any) {
    console.error('Email send error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
