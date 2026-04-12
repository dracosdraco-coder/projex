import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  try {
    const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supaUrl || !supaKey) return NextResponse.json({ sent: 0, joined: 0, converted: 0 })

    const supabase = createClient(supaUrl, supaKey)
    const userId = req.nextUrl.searchParams.get('userId')
    if (!userId) return NextResponse.json({ sent: 0, joined: 0, converted: 0 })

    const { data } = await supabase
      .from('referrals')
      .select('status')
      .eq('referrer_id', userId)

    const stats = { sent: 0, joined: 0, converted: 0 }
    ;(data || []).forEach((r: any) => {
      stats.sent++
      if (r.status === 'joined' || r.status === 'converted') stats.joined++
      if (r.status === 'converted') stats.converted++
    })

    return NextResponse.json(stats)
  } catch {
    return NextResponse.json({ sent: 0, joined: 0, converted: 0 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supaUrl || !supaKey) return NextResponse.json({ error: 'Server config' }, { status: 500 })

    const supabase = createClient(supaUrl, supaKey)
    const { referrerId, referredEmail, referredUserId, action } = await req.json()

    if (action === 'track_signup' && referrerId && referredUserId) {
      // A referred user just signed up — update their referral to 'joined'
      await supabase.from('referrals')
        .update({ referred_user_id: referredUserId, status: 'joined' })
        .eq('referrer_id', referrerId)
        .eq('status', 'sent')
        .is('referred_user_id', null)
        .limit(1)

      return NextResponse.json({ success: true })
    }

    if (action === 'track_conversion' && referredUserId) {
      // Referred user subscribed — mark as converted
      await supabase.from('referrals')
        .update({ status: 'converted', converted_at: new Date().toISOString() })
        .eq('referred_user_id', referredUserId)
        .eq('status', 'joined')

      return NextResponse.json({ success: true })
    }

    if (referrerId && referredEmail) {
      // Create a new referral record
      const { error } = await supabase.from('referrals').insert({
        referrer_id: referrerId,
        referred_email: referredEmail.trim().toLowerCase(),
        status: 'sent',
      })
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
