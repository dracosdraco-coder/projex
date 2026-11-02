'use client'

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'

type State = 'open' | 'invalid' | 'expired' | 'revoked' | 'used'

interface Props {
  token: string
  state: State
  email?: string
  role?: string
  orgName?: string
  inviterName?: string
}

const DEAD_ENDS: Record<Exclude<State, 'open'>, { title: string; body: string }> = {
  invalid: { title: 'Invite not found', body: 'This invite link is not valid. Check the link in your email, or ask your admin to send a new one.' },
  expired: { title: 'Invite expired', body: 'This invite has expired. Ask your admin to resend it from Team → Members.' },
  revoked: { title: 'Invite revoked', body: 'This invite is no longer active. Ask your admin if you still need access.' },
  used: { title: 'Invite already used', body: 'This invite has already been accepted. Sign in to continue.' },
}

export default function InviteClient({ token, state, email, role, orgName, inviterName }: Props) {
  const { user, loading, signOut } = useAuth()
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const accept = async () => {
    setAccepting(true)
    setError(null)
    try {
      const res = await fetch('/api/invite/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Could not accept the invite')
      window.location.href = '/access'
    } catch (err: any) {
      setError(err.message)
      setAccepting(false)
    }
  }

  const loginHref = (mode: 'signin' | 'signup') => {
    const q = new URLSearchParams({ invite: token, ...(email ? { email } : {}), ...(mode === 'signup' ? { mode: 'signup' } : {}) })
    return `/login?${q}`
  }

  const emailMismatch = user?.email && email && user.email.toLowerCase() !== email.toLowerCase()

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="px-8 py-6">
        <a href="/" className="text-sm font-bold tracking-[0.18em] uppercase text-zinc-900">Projex</a>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 pb-16">
        <div className="w-full max-w-[400px]">
          {state !== 'open' ? (
            <div>
              <h1 className="text-[26px] font-bold text-zinc-900 tracking-tight mb-2">{DEAD_ENDS[state].title}</h1>
              <p className="text-[14px] text-zinc-500 leading-relaxed mb-8">{DEAD_ENDS[state].body}</p>
              <a href={user ? '/access' : '/login'} className="inline-block px-5 py-2.5 bg-zinc-900 text-white rounded-full text-[13px] font-medium">
                {user ? 'Go to Projex' : 'Sign in'}
              </a>
            </div>
          ) : (
            <div>
              <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-zinc-400 mb-3">Team invite</p>
              <h1 className="text-[26px] font-bold text-zinc-900 tracking-tight mb-2">Join {orgName}</h1>
              <p className="text-[14px] text-zinc-500 leading-relaxed mb-8">
                {inviterName} invited you to join <strong className="text-zinc-800">{orgName}</strong> on Projex
                as a <strong className="text-zinc-800 capitalize">{role}</strong>.
              </p>

              {loading ? (
                <div className="h-11" />
              ) : user ? (
                <div className="space-y-4">
                  <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-[13px] text-zinc-600">
                    Signed in as <strong className="text-zinc-900">{user.email}</strong>
                    {emailMismatch && (
                      <p className="mt-1 text-[12px] text-zinc-500">
                        This invite was sent to {email}. You can still accept it with this account.
                      </p>
                    )}
                  </div>
                  <p className="text-[12px] text-zinc-500">
                    {orgName} becomes your active workspace. If you belong to other teams, switch any time from your profile menu.
                  </p>
                  {error && <p className="text-[13px] text-red-600">{error}</p>}
                  <button onClick={accept} disabled={accepting}
                    className="w-full py-3 bg-zinc-900 text-white rounded-xl text-[13px] font-medium disabled:opacity-60">
                    {accepting ? 'Joining…' : `Accept and join ${orgName}`}
                  </button>
                  <button onClick={async () => { await signOut().catch(() => {}); window.location.href = loginHref('signin') }} className="w-full text-[12px] text-zinc-400 hover:text-zinc-700">
                    Use a different account
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <a href={loginHref('signup')} className="block w-full py-3 text-center bg-zinc-900 text-white rounded-xl text-[13px] font-medium">
                    Create an account
                  </a>
                  <a href={loginHref('signin')} className="block w-full py-3 text-center border border-zinc-200 text-zinc-800 rounded-xl text-[13px] font-medium hover:bg-zinc-50">
                    I already have an account
                  </a>
                  <p className="text-[12px] text-zinc-400 pt-2">No subscription needed. Your team covers it.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
