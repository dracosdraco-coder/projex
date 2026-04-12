'use client'

import { useState, useEffect, Suspense } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'

function LoginForm() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, signUp, resetPassword } = useAuth()
  const [showReset, setShowReset] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const refCode = searchParams.get('ref')

  // If ref param exists, default to signup
  useEffect(() => {
    if (refCode) setIsSignUp(true)
  }, [refCode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
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
        setError('Check your email to confirm your account!')
      } else {
        await signIn(email, password)
        window.location.href = "/access"
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#000000] px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Projex</h1>
          <p className="text-gray-600 dark:text-gray-400">Business Management for Service Contractors</p>
        </div>

        <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-lg p-8 border border-gray-200 dark:border-[#2c2c2e]">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </h2>

          {refCode && isSignUp && (
            <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">You've been referred! Sign up and you'll both get 1 month free when you subscribe.</p>
            </div>
          )}

          {error && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${
              error.includes('Check your email') 
                ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
            }`}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="w-full px-4 py-3 bg-gray-50 dark:bg-[#000000] border border-gray-300 dark:border-[#2c2c2e] rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
                placeholder="you@company.com" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-[#000000] border border-gray-300 dark:border-[#2c2c2e] rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
                placeholder="••••••••" />
              {isSignUp && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Minimum 6 characters</p>}
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Loading...' : isSignUp ? 'Create Account' : 'Sign In'}
            </button>

            {!isSignUp && !showReset && (
              <button type="button" onClick={() => setShowReset(true)}
                className="w-full mt-2 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                Forgot your password?
              </button>
            )}

            {showReset && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-[#222] rounded-xl">
                {resetSent ? (
                  <p className="text-xs text-green-600 dark:text-green-400 text-center">Reset link sent! Check your email.</p>
                ) : (
                  <>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Enter your email to receive a password reset link.</p>
                    <button type="button" onClick={async () => {
                      if (!email) { setError('Enter your email first'); return }
                      setLoading(true)
                      try { await resetPassword(email); setResetSent(true) }
                      catch (err: any) { setError(err.message) }
                      finally { setLoading(false) }
                    }}
                      disabled={loading || !email}
                      className="w-full py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-sm font-medium disabled:opacity-50">
                      {loading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                    <button type="button" onClick={() => setShowReset(false)}
                      className="w-full mt-1 text-[10px] text-gray-400 hover:text-gray-600">Cancel</button>
                  </>
                )}
              </div>
            )}
          </form>

          <div className="mt-6 text-center">
            <button onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          🚀 Beta Access - Free 3-month trial
        </div>
        <div className="mt-4 text-center flex items-center justify-center gap-4 text-xs text-gray-500 dark:text-gray-600">
          <a href="/terms" className="hover:text-gray-900 dark:hover:text-white transition-colors">Terms of Service</a>
          <span>·</span>
          <a href="/privacy" className="hover:text-gray-900 dark:hover:text-white transition-colors">Privacy Policy</a>
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
