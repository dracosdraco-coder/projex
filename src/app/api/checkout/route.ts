import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY
    const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!stripeKey || !supaUrl || !supaKey) {
      console.error('Checkout missing env vars:', { hasStripe: !!stripeKey, hasSupaUrl: !!supaUrl, hasSupaKey: !!supaKey })
      return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 })
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2024-12-18.acacia' as any })
    const supabase = createClient(supaUrl, supaKey)

    const { userId, userEmail, planId, interval } = await req.json()

    if (!userId || !userEmail || !planId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Resolve price ID server-side from env vars
    const envKey = `STRIPE_PRICE_${planId.toUpperCase()}_${(interval || 'monthly').toUpperCase()}`
    const priceId = process.env[envKey]

    if (!priceId) {
      console.error(`Missing price env var: ${envKey}`)
      return NextResponse.json({ error: `Price not configured for ${planId} ${interval}` }, { status: 500 })
    }

    const { data: sub } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single()

    let customerId = sub?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: { supabase_user_id: userId },
      })
      customerId = customer.id
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://projex.live'}/access?checkout=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://projex.live'}/#pricing`,
      subscription_data: {
        trial_period_days: 7,
        metadata: { supabase_user_id: userId, plan_id: planId, interval },
      },
      metadata: { supabase_user_id: userId, plan_id: planId },
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error('Checkout error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
