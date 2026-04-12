import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

// Add-on price IDs — set these in Vercel env vars
// STRIPE_ADDON_AI_ESTIMATING, STRIPE_ADDON_ADVANCED_REPORTS, etc.
const ADDON_ENV_MAP: Record<string, string> = {
  'ai-estimating': 'STRIPE_ADDON_AI_ESTIMATING',
  'advanced-reports': 'STRIPE_ADDON_ADVANCED_REPORTS',
  'client-portal': 'STRIPE_ADDON_CLIENT_PORTAL',
  'storage-plus': 'STRIPE_ADDON_STORAGE_PLUS',
  'gps-tracking': 'STRIPE_ADDON_GPS_TRACKING',
  'quickbooks': 'STRIPE_ADDON_QUICKBOOKS',
}

export async function POST(req: NextRequest) {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY
    if (!stripeKey) return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })

    const stripe = new Stripe(stripeKey, { apiVersion: '2024-12-18.acacia' as any })
    const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supaUrl || !supaKey) return NextResponse.json({ error: 'Server config error' }, { status: 500 })

    const supabase = createClient(supaUrl, supaKey)
    const { userId, userEmail, addonId } = await req.json()

    if (!userId || !addonId) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    // Get price ID from env
    const envKey = ADDON_ENV_MAP[addonId]
    if (!envKey) return NextResponse.json({ error: `Unknown add-on: ${addonId}` }, { status: 400 })

    const priceId = process.env[envKey]
    if (!priceId) {
      return NextResponse.json({ 
        error: 'Add-on not yet available for purchase. Contact support.',
        code: 'ADDON_NOT_CONFIGURED',
      }, { status: 400 })
    }

    // Get or create Stripe customer
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single()

    let customerId = sub?.stripe_customer_id
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userEmail || '',
        metadata: { supabase_user_id: userId },
      })
      customerId = customer.id
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://projex.live'}/access?addon=${addonId}&checkout=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://projex.live'}/access`,
      metadata: { supabase_user_id: userId, addon_id: addonId },
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error('Addon checkout error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
