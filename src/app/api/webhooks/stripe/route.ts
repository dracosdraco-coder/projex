import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!stripeKey || !webhookSecret || !supaUrl || !supaKey) {
    console.error('Webhook missing env vars:', { hasStripe: !!stripeKey, hasWebhook: !!webhookSecret, hasSupaUrl: !!supaUrl, hasSupaKey: !!supaKey })
    return NextResponse.json({ error: 'Server config error' }, { status: 500 })
  }

  const stripe = new Stripe(stripeKey, { apiVersion: '2024-12-18.acacia' as any })
  const supabase = createClient(supaUrl, supaKey)
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.supabase_user_id
        const planId = session.metadata?.plan_id || 'duo'
        const customerId = session.customer as string
        const subscriptionId = session.subscription as string

        if (userId) {
          // Fetch subscription details
          const subscription = await stripe.subscriptions.retrieve(subscriptionId)

          // Get user's org_id
          const { data: profile } = await supabase
            .from('profiles')
            .select('org_id')
            .eq('id', userId)
            .single()

          const orgId = profile?.org_id || null

          await supabase.from('subscriptions').upsert({
            user_id: userId,
            org_id: orgId,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            plan: planId,
            status: subscription.status,
            trial_ends_at: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' })

          // Update user profile with plan
          await supabase.from('profiles').upsert({
            id: userId,
            plan: planId,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'id' })
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.supabase_user_id

        if (userId) {
          // Get org_id for this user
          const { data: profile } = await supabase
            .from('profiles')
            .select('org_id')
            .eq('id', userId)
            .single()

          await supabase.from('subscriptions').update({
            status: subscription.status,
            plan: subscription.metadata?.plan_id || undefined,
            org_id: profile?.org_id || undefined,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          }).eq('user_id', userId)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.supabase_user_id

        if (userId) {
          await supabase.from('subscriptions').update({
            status: 'canceled',
            plan: 'free',
            updated_at: new Date().toISOString(),
          }).eq('user_id', userId)

          await supabase.from('profiles').update({
            plan: 'free',
          }).eq('id', userId)
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = invoice.subscription as string
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId)
          const userId = subscription.metadata?.supabase_user_id
          if (userId) {
            await supabase.from('subscriptions').update({
              status: 'past_due',
              updated_at: new Date().toISOString(),
            }).eq('user_id', userId)
          }
        }
        break
      }
    }
  } catch (err: any) {
    console.error('Webhook handler error:', err)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
