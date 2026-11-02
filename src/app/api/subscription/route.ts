import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth-server'

const FREE_RESPONSE = { plan: 'free', status: 'none', trialEndsAt: null }

export async function GET() {
  try {
    const { ctx, error } = await requireUser()
    if (error) return error

    const supabase = ctx.admin
    const userId = ctx.user.id
    const profile = { org_id: ctx.orgId }

    let sub = null

    if (profile?.org_id) {
      // Check org-level subscription first (covers all org members)
      const { data } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('org_id', profile.org_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (data) sub = data

      // Fallback: find the org owner's subscription
      if (!sub) {
        const { data: org } = await supabase
          .from('organizations')
          .select('owner_id')
          .eq('id', profile.org_id)
          .single()

        if (org?.owner_id) {
          const { data: ownerSub } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', org.owner_id)
            .single()

          if (ownerSub) {
            sub = ownerSub
            // Backfill org_id on the subscription for future lookups
            await supabase.from('subscriptions')
              .update({ org_id: profile.org_id })
              .eq('id', ownerSub.id)
          }
        }
      }
    }

    if (!sub) {
      // Final fallback: check user-level subscription (pre-migration)
      const { data } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (data) sub = data
    }

    if (!sub) return NextResponse.json(FREE_RESPONSE)

    return NextResponse.json({
      plan: sub.plan,
      status: sub.status,
      stripeCustomerId: sub.stripe_customer_id,
      trialEndsAt: sub.trial_ends_at,
      currentPeriodEnd: sub.current_period_end,
      addons: sub.addons || [],
    })
  } catch (err: any) {
    console.error('Subscription API error:', err.message)
    return NextResponse.json(FREE_RESPONSE)
  }
}
