import { NextRequest, NextResponse } from 'next/server'
import { requireUser, getAdminClient } from '@/lib/auth-server'

const EMPTY_STATS = { sent: 0, joined: 0, converted: 0 }
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Stats for the signed-in user's own referrals
export async function GET() {
  try {
    const { ctx, error } = await requireUser()
    if (error) return error

    const { data } = await ctx.admin
      .from('referrals')
      .select('status')
      .eq('referrer_id', ctx.user.id)

    const stats = { ...EMPTY_STATS }
    ;(data || []).forEach((r: any) => {
      stats.sent++
      if (r.status === 'joined' || r.status === 'converted') stats.joined++
      if (r.status === 'converted') stats.converted++
    })

    return NextResponse.json(stats)
  } catch {
    return NextResponse.json(EMPTY_STATS)
  }
}

// Record a referral at signup. The new user has no session yet (email confirmation),
// so this stays unauthenticated — it can only create a 'sent' row for a real referrer,
// once per email. Status changes to joined/converted happen server-side only.
export async function POST(req: NextRequest) {
  try {
    const { referrerId, referredEmail } = await req.json()

    if (typeof referrerId !== 'string' || !UUID_RE.test(referrerId)
      || typeof referredEmail !== 'string' || !EMAIL_RE.test(referredEmail.trim())) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const supabase = getAdminClient()
    const email = referredEmail.trim().toLowerCase()

    const { data: referrer } = await supabase.from('profiles').select('id').eq('id', referrerId).maybeSingle()
    if (!referrer) return NextResponse.json({ error: 'Invalid referrer' }, { status: 400 })

    const { data: existing } = await supabase.from('referrals').select('id').eq('referred_email', email).limit(1)
    if (existing && existing.length > 0) return NextResponse.json({ success: true })

    const { error } = await supabase.from('referrals').insert({
      referrer_id: referrerId,
      referred_email: email,
      status: 'sent',
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
