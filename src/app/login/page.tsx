'use client'

import { useState, useEffect, Suspense } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
    </svg>
  )
}

function LoginForm() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<string | null>(null)
  const [showReset, setShowReset] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const { signIn, signUp, resetPassword, signInWithGoogle, signInWithGitHub } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const refCode = searchParams.get('ref')
  const planParam = searchParams.get('plan')

  useEffect(() => {
    if (refCode || planParam) setMode('signup')
  }, [refCode, planParam])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      if (mode === 'signup') {
        await signUp(email, password)
        if (refCode) {
          fetch('/api/referrals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ referrerId: refCode, referredEmail: email }),
          }).catch(() => {})
        }
        setSuccess('Account created! Check your email to confirm, then sign in.')
        setMode('signin')
        setPassword('')
      } else {
        await signIn(email, password)
        window.location.href = '/access'
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleOAuth = async (provider: 'google' | 'github') => {
    setOauthLoading(provider)
    setError('')
    try {
      if (provider === 'google') await signInWithGoogle()
      else await signInWithGitHub()
    } catch (err: any) {
      setError(err.message || `${provider} sign-in failed`)
      setOauthLoading(null)
    }
  }

  const handleReset = async () => {
    if (!email) { setError('Enter your email above first'); return }
    setLoading(true)
    try {
      await resetPassword(email)
      setResetSent(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Nav */}
      <div className="px-8 py-6 flex items-center justify-between">
        <a href="/" className="text-sm font-bold tracking-[0.18em] uppercase text-zinc-900">Projex</a>
        <a href="/" className="text-[12px] text-zinc-400 hover:text-zinc-900 transition-colors">← Back to home</a>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-6 pb-16">
        <div className="w-full max-w-[360px]">

          {/* Heading */}
          <div className="mb-10">
            <h1 className="text-[28px] font-bold text-zinc-900 tracking-tight mb-1.5">
              {mode === 'signup' ? 'Create your account' : 'Welcome back'}
            </h1>
            <p className="text-[14px] text-zinc-400">
              {mode === 'signup'
                ? '14-day free trial · No credit card required'
                : 'Sign in to your Projex workspace'}
            </p>
          </div>

          {/* OAuth buttons */}
          <div className="space-y-2.5 mb-8">
            <button
              onClick={() => handleOAuth('google')}
              disabled={!!oauthLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-zinc-200 rounded-xl text-[13px] font-medium text-zinc-800 hover:bg-zinc-50 hover:border-zinc-300 transition-all active:scale-[0.99] disabled:opacity-60"
            >
              {oauthLoading === 'google'
                ? <span className="w-4 h-4 border-2 border-zinc-300 border-t-zinc-700 rounded-full animate-spin" />
                : <GoogleIcon />}
              Continue with Google
            </button>
            <button
              onClick={() => handleOAuth('github')}
              disabled={!!oauthLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-zinc-200 rounded-xl text-[13px] font-medium text-zinc-800 hover:bg-zinc-50 hover:border-zinc-300 transition-all active:scale-[0.99] disabled:opacity-60"
            >
              {oauthLoading === 'github'
                ? <span className="w-4 h-4 border-2 border-zinc-300 border-t-zinc-700 rounded-full animate-spin" />
                : <GitHubIcon />}
              Continue with GitHub
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1 h-px bg-zinc-100" />
            <span className="text-[11px] text-zinc-400 tracking-wider uppercase">or</span>
            <div className="flex-1 h-px bg-zinc-100" />
          </div>

          {/* Feedback */}
          {error && (
            <div className="mb-5 px-3.5 py-2.5 bg-red-50 rounded-xl text-[12px] text-red-700 border border-red-100">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-5 px-3.5 py-2.5 bg-emerald-50 rounded-xl text-[12px] text-emerald-700 border border-emerald-100">
              {success}
            </div>
          )}

          {/* Email/password form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[12px] font-medium text-zinc-500 mb-2 tracking-wide uppercase">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@company.com"
                className="w-full px-4 py-3.5 bg-zinc-100 rounded-xl text-[14px] text-zinc-900 placeholder-zinc-400 outline-none focus:bg-zinc-200 transition-colors"
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium text-zinc-500 mb-2 tracking-wide uppercase">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  placeholder={mode === 'signup' ? 'Create a password' : '••••••••'}
                  className="w-full px-4 py-3.5 bg-zinc-100 rounded-xl text-[14px] text-zinc-900 placeholder-zinc-400 outline-none focus:bg-zinc-200 transition-colors pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 transition-colors"
                >
                  {showPassword
                    ? <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
              {mode === 'signup' && <p className="text-[11px] text-zinc-400 mt-1.5">Minimum 6 characters</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-zinc-900 text-white rounded-xl text-[14px] font-semibold hover:bg-zinc-700 transition-colors active:scale-[0.99] disabled:opacity-50 mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {mode === 'signup' ? 'Creating account...' : 'Signing in...'}
                </span>
              ) : (
                mode === 'signup' ? 'Create account →' : 'Sign in →'
              )}
            </button>
          </form>

          {/* Forgot password */}
          {mode === 'signin' && !showReset && (
            <button
              type="button"
              onClick={() => setShowReset(true)}
              className="w-full mt-4 text-[12px] text-zinc-400 hover:text-zinc-700 transition-colors text-center"
            >
              Forgot password?
            </button>
          )}

          {showReset && (
            <div className="mt-4 px-4 py-4 bg-zinc-50 rounded-xl">
              {resetSent ? (
                <p className="text-[12px] text-emerald-600 text-center">Reset link sent — check your email.</p>
              ) : (
                <div className="space-y-3">
                  <p className="text-[12px] text-zinc-500">We'll send a reset link to the email above.</p>
                  <button
                    onClick={handleReset}
                    disabled={loading || !email}
                    className="w-full py-2.5 bg-zinc-900 text-white rounded-lg text-[12px] font-medium disabled:opacity-50"
                  >
                    {loading ? 'Sending...' : 'Send reset link'}
                  </button>
                  <button onClick={() => setShowReset(false)} className="w-full text-[11px] text-zinc-400 hover:text-zinc-600">
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Toggle mode */}
          <p className="text-center text-[13px] text-zinc-400 mt-8">
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); setSuccess('') }}
              className="text-zinc-900 font-semibold hover:underline underline-offset-4"
            >
              {mode === 'signin' ? 'Sign up free' : 'Sign in'}
            </button>
          </p>

        </div>
      </div>

      {/* Footer */}
      <div className="px-8 py-5 border-t border-zinc-100 flex items-center justify-center gap-6 text-[11px] text-zinc-400">
        <a href="/privacy" className="hover:text-zinc-700 transition-colors">Privacy</a>
        <a href="/terms" className="hover:text-zinc-700 transition-colors">Terms</a>
        <a href="/docs" className="hover:text-zinc-700 transition-colors">Docs</a>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm font-bold tracking-[0.18em] uppercase text-zinc-900">Projex</p>
          <p className="text-zinc-400 text-xs mt-2">Loading...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
