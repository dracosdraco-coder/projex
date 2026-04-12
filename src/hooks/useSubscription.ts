'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { PlanId, meetsMinimumPlan, getPlanLimits, CARD_PLAN_REQUIREMENTS } from '@/lib/stripe-plans'

interface SubscriptionState {
  plan: PlanId | 'free'
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'none'
  trialEndsAt: string | null
  currentPeriodEnd: string | null
  addons: string[]
  loading: boolean
}

export function useSubscription() {
  const { user } = useAuth()
  const [sub, setSub] = useState<SubscriptionState>({
    plan: 'free', status: 'none', trialEndsAt: null, currentPeriodEnd: null, addons: [], loading: true,
  })

  useEffect(() => {
    if (!user?.id) { setSub((s: SubscriptionState) => ({ ...s, loading: false })); return }
    
    fetch(`/api/subscription?userId=${user.id}`)
      .then((r: Response) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((data: any) => {
        setSub({
          plan: data.plan || 'free',
          status: data.status || 'none',
          trialEndsAt: data.trialEndsAt,
          currentPeriodEnd: data.currentPeriodEnd,
          addons: data.addons || [],
          loading: false,
        })
      })
      .catch(() => setSub({ plan: 'free', status: 'none', trialEndsAt: null, currentPeriodEnd: null, addons: [], loading: false }))
  }, [user?.id])

  const isActive = sub.status === 'active' || sub.status === 'trialing'
  const isPaid = sub.plan !== 'free' && isActive
  const limits = getPlanLimits(sub.plan)

  const canAccessCard = useCallback((cardId: string): boolean => {
    if (!isPaid) return false
    const required = CARD_PLAN_REQUIREMENTS[cardId]
    if (!required) return true // cards not in the map are always accessible
    return meetsMinimumPlan(sub.plan, required)
  }, [sub.plan, isPaid])

  const isTrialing = sub.status === 'trialing'
  const trialDaysLeft = sub.trialEndsAt 
    ? Math.max(0, Math.ceil((new Date(sub.trialEndsAt).getTime() - Date.now()) / 86400000))
    : 0

  const startCheckout = useCallback(async (planId: PlanId, interval: 'monthly' | 'annual') => {
    if (!user?.id || !user?.email) return
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, userEmail: user.email, planId, interval }),
      })
      if (!res.ok) {
        const text = await res.text()
        console.error('Checkout error:', res.status, text)
        return
      }
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        console.error('Checkout error:', data.error || 'No URL returned')
      }
    } catch (err) {
      console.error('Checkout fetch error:', err)
    }
  }, [user?.id, user?.email])

  return {
    ...sub,
    isActive,
    isPaid,
    isTrialing,
    trialDaysLeft,
    limits,
    canAccessCard,
    startCheckout,
  }
}
