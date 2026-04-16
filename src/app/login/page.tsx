'use client'

import { useState, useEffect, Suspense } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'

const DEMO_EMAIL = process.env.NEXT_PUBLIC_DEMO_EMAIL || ''
const DEMO_PASSWORD = process.env.NEXT_PUBLIC_DEMO_PASSWORD || ''

function LoginForm() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [demoLoading, setDemoLoading] = useState(false)
  const { signIn, signUp, resetPassword } = useAuth()
  const [showReset, setShowReset] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const refCode = searchParams.get('ref')

  useEffect(() => {
    if (refCode) setIsSignUp(true)
  }, [refCode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')
    setLoading(true)

    try {
      if (isSignUp) {
        await signUp(email, password)
        if (refCode) {
          try {
            await fetch('/api/referrals', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ referrerId: refCode, referredEmail: email }),
            })
          } catch {}
        }
        setSuccessMessage('Account created! Check your email to confirm, then sign in.')
        setIsSignUp(false)
        setPassword('')
      } else {
        await signIn(email, password)
        window.location.href = '/access'
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = async () => {
    if (!DEMO_EMAIL || !DEMO_PASSWORD) return
    setDemoLoading(true)
    setError('')
    setSuccessMessage('')
    try {
      await signIn(DEMO_EMAIL, DEMO_PASSWORD)
      window.location.href = '/access'
    } catch (err: any) {
      setError('Demo account unavailable. Please try again later.')
    } finally {
      setDemoLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#000000] px-4 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">Projex</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Business Management for Service Contractors</p>
        </div>

        <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-lg p-8 border border-gray-200 dark:border-[#2c2c2e]">

          {/* Tab toggle */}
          <div className="flex bg-gray-100 dark:bg-[#111] rounded-xl p-1 mb-6">
            <button
              type="button"
              onClick={() => { setIsSignUp(false); setError(''); setSuccessMessage('') }}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                !isSignUp ? 'bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsSignUp(true); setError(''); setSuccessMessage('') }}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                isSignUp ? 'bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* 7-day trial badge on sign-up */}
          {isSignUp && (
            <div className="mb-5 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/40 rounded-xl flex items-center gap-2.5">
              <span className="text-xl">🎉</span>
              <div>
                <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">7-day free trial</p>
                <p className="text-xs text-blue-600 dark:text-blue-400">No credit card required. Full access to all Team features.</p>
              </div>
            </div>
          )}

          {/* Referral banner */}
          {refCode && isSignUp && (
            <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">You've been referred! Sign up and you'll both get 1 month free when you subscribe.</p>
            </div>
          )}

          {/* Success message */}
          {successMessage && (
            <div className="mb-4 p-3 rounded-lg text-sm bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800/40">
              {successMessage}
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800/40">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#2c2c2e] rounded-xl text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white placeholder-gray-400 dark:placeholder-gray-600"
                placeholder="you@company.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#2c2c2e] rounded-xl text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white placeholder-gray-400 dark:placeholder-gray-600"
                placeholder="••••••••"
              />
              {isSignUp && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Minimum 6 characters</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-medium text-sm hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : isSignUp ? 'Create Account — Free' : 'Sign In'}
            </button>

            {!isSignUp && !showReset && (
              <button
                type="button"
                onClick={() => setShowReset(true)}
                className="w-full text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                Forgot your password?
              </button>
            )}

            {showReset && (
              <div className="p-4 bg-gray-50 dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#2c2c2e]">
                {resetSent ? (
                  <p className="text-xs text-green-600 dark:text-green-400 text-center">Reset link sent — check your email.</p>
                ) : (
                  <>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Enter your email to receive a reset link.</p>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!email) { setError('Enter your email first'); return }
                        setLoading(true)
                        try { await resetPassword(email); setResetSent(true) }
                        catch (err: any) { setError(err.message) }
                        finally { setLoading(false) }
                      }}
                      disabled={loading || !email}
                      className="w-full py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-sm font-medium disabled:opacity-50"
                    >
                      {loading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                    <button type="button" onClick={() => setShowReset(false)} className="w-full mt-1 text-[10px] text-gray-400 hover:text-gray-600">Cancel</button>
                  </>
                )}
              </div>
            )}
          </form>

          {/* Demo account button */}
          {DEMO_EMAIL && DEMO_PASSWORD && (
            <div className="mt-4">
              <div className="relative flex items-center gap-3 my-1">
                <div className="flex-1 border-t border-gray-200 dark:border-[#2c2c2e]" />
                <span className="text-xs text-gray-400 dark:text-gray-600">or</span>
                <div className="flex-1 border-t border-gray-200 dark:border-[#2c2c2e]" />
              </div>
              <button
                type="button"
                onClick={handleDemoLogin}
                disabled={demoLoading}
                className="w-full mt-3 py-3 bg-gray-100 dark:bg-[#222] text-gray-700 dark:text-gray-300 rounded-xl font-medium text-sm hover:bg-gray-200 dark:hover:bg-[#2a2a2a] transition-colors disabled:opacity-50 border border-gray-200 dark:border-[#2c2c2e] flex items-center justify-center gap-2"
              >
                <span>👀</span>
                {demoLoading ? 'Loading demo...' : 'Try Demo — No Sign Up'}
              </button>
              <p className="text-center text-[10px] text-gray-400 dark:text-gray-600 mt-1.5">Pre-loaded with sample project data</p>
            </div>
          )}
        </div>

        <div className="mt-5 text-center text-xs text-gray-500 dark:text-gray-500">
          ✅ 7-day free trial &nbsp;·&nbsp; No credit card required
        </div>
        <div className="mt-3 text-center flex items-center justify-center gap-4 text-xs text-gray-400 dark:text-gray-600">
          <a href="/terms" className="hover:text-gray-900 dark:hover:text-white transition-colors">Terms</a>
          <span>·</span>
          <a href="/privacy" className="hover:text-gray-900 dark:hover:text-white transition-colors">Privacy</a>
          <span>·</span>
          <a href="/docs" className="hover:text-gray-900 dark:hover:text-white transition-colors">Docs</a>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#000000]">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Projex</h1>
          <p className="text-gray-400 text-sm">Loading...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
