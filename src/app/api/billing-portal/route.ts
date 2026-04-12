import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY
    const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!stripeKey || !supaUrl || !supaKey) {
      return NextResponse.json({ error: 'Server config error' }, { status: 500 })
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2024-12-18.acacia' as any })
    const supabase = createClient(supaUrl, supaKey)
    const { userId } = await req.json()

    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

    // Get stripe customer ID
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single()

    if (!sub?.stripe_customer_id) {
      return NextResponse.json({ error: 'No billing account found. Subscribe first.' }, { status: 400 })
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://projex.live'}/access`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error('Billing portal error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
