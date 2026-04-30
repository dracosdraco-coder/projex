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
  const [oauthLoading, setOauthLoading] = useState<'google' | 'github' | null>(null)
  const { signIn, signUp, resetPassword, signInWithGoogle, signInWithGithub } = useAuth()
  const [showReset, setShowReset] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetSent, setResetSent] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
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

  const handleOAuth = async (provider: 'google' | 'github') => {
    setOauthLoading(provider)
    setError('')
    try {
      if (provider === 'google') await signInWithGoogle()
      else await signInWithGithub()
    } catch (err: any) {
      setError(err.message || `${provider} sign-in failed`)
      setOauthLoading(null)
    }
  }

  const handleResetPassword = async () => {
    const target = resetEmail || email
    if (!target) { setError('Enter your email address to receive a reset link'); return }
    setResetLoading(true)
    setError('')
    try {
      await resetPassword(target)
      setResetSent(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setResetLoading(false)
    }
  }

  const switchTab = (toSignUp: boolean) => {
    setIsSignUp(toSignUp)
    setError('')
    setSuccessMessage('')
    setShowReset(false)
    setResetSent(false)
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
              onClick={() => switchTab(false)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                !isSignUp ? 'bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchTab(true)}
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

          {/* OAuth buttons */}
          <div className="space-y-2 mb-5">
            <button
              type="button"
              onClick={() => handleOAuth('google')}
              disabled={!!oauthLoading}
              className="w-full py-2.5 flex items-center justify-center gap-2.5 border border-gray-200 dark:border-[#2c2c2e] rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#222] transition-colors disabled:opacity-50"
            >
              {oauthLoading === 'google' ? (
                <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              )}
              Continue with Google
            </button>

            <button
              type="button"
              onClick={() => handleOAuth('github')}
              disabled={!!oauthLoading}
              className="w-full py-2.5 flex items-center justify-center gap-2.5 border border-gray-200 dark:border-[#2c2c2e] rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#222] transition-colors disabled:opacity-50"
            >
              {oauthLoading === 'github' ? (
                <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
              )}
              Continue with GitHub
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex items-center gap-3 mb-5">
            <div className="flex-1 border-t border-gray-200 dark:border-[#2c2c2e]" />
            <span className="text-xs text-gray-400 dark:text-gray-600">or</span>
            <div className="flex-1 border-t border-gray-200 dark:border-[#2c2c2e]" />
          </div>

          {/* Email/Password form */}
          {!showReset ? (
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

              {!isSignUp && (
                <button
                  type="button"
                  onClick={() => { setShowReset(true); setResetEmail(email); setError('') }}
                  className="w-full text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  Forgot your password?
                </button>
              )}
            </form>
          ) : (
            /* Forgot password panel */
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Reset your password</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">We'll send a reset link to your email.</p>
              </div>

              {resetSent ? (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/40 rounded-xl text-center">
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">Reset link sent!</p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">Check your inbox and follow the link.</p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#2c2c2e] rounded-xl text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white placeholder-gray-400 dark:placeholder-gray-600"
                      placeholder="you@company.com"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    disabled={resetLoading || !resetEmail}
                    className="w-full py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-medium text-sm hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50"
                  >
                    {resetLoading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => { setShowReset(false); setResetSent(false); setError('') }}
                className="w-full text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                Back to sign in
              </button>
            </div>
          )}

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
