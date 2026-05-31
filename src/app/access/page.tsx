'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import AccessClient from './AccessClient'

export default function Access() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (loading) return

    if (!user) {
      router.push('/login')
      return
    }

    // Check if user has completed onboarding (has an org linked)
    supabase
      .from('profiles')
      .select('org_id')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (!data?.org_id) {
          router.push('/onboarding')
        } else {
          setChecking(false)
        }
      })
  }, [user, loading, router])

  if (loading || checking) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm font-bold tracking-[0.18em] uppercase text-zinc-900 mb-3">Projex</p>
          <div className="w-20 h-0.5 bg-zinc-100 mx-auto overflow-hidden rounded-full">
            <div className="h-full w-1/3 bg-zinc-400 rounded-full animate-[shimmer_1s_ease-in-out_infinite]" />
          </div>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <AccessClient />
    </Suspense>
  )
}
