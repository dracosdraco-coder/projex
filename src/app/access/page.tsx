'use client'

import { useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import AccessClient from './AccessClient'

export default function Access() {
  const { user, loading } = useAuth()
  const router = useRouter()
  
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-[#000000] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Loading...</h1>
            <p className="text-gray-600 dark:text-gray-400">Checking authentication</p>
          </div>
        </div>
      </div>
    )
  }
  
  if (!user) {
    return null
  }

  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-100 dark:bg-[#000000]" />}>
      <AccessClient />
    </Suspense>
  )
}