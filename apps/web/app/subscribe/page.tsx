'use client'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { getSupabase } from '@/lib/supabaseClient'
import Navbar from '@/components/Landing/Navbar'

function SubscribeInner() {
  const params = useSearchParams()
  const plan = useMemo(() => (params.get('plan') === 'pro' ? 'pro' : 'go'), [params])
  const status = params.get('status')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sessionEmail, setSessionEmail] = useState<string | null>(null)

  useEffect(() => {
    const s = getSupabase()
    if (!s) return
    s.auth.getSession().then(({ data }) => {
      setSessionEmail(data.session?.user.email ?? null)
    })
  }, [])

  const signIn = async () => {
    setLoading(true)
    setError(null)
    const s = getSupabase()
    if (!s) return
    const { error } = await s.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    const { data } = await s.auth.getSession()
    setSessionEmail(data.session?.user.email ?? null)
    setLoading(false)
  }

  const signUp = async () => {
    setLoading(true)
    setError(null)
    const s = getSupabase()
    if (!s) return
    const { error } = await s.auth.signUp({ email, password })
    if (error) setError(error.message)
    const { data } = await s.auth.getSession()
    setSessionEmail(data.session?.user.email ?? null)
    setLoading(false)
  }

  const checkout = async () => {
    if (!sessionEmail) return
    setLoading(true)
    setError(null)
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan, email: sessionEmail }),
    })
    const data = await res.json()
    if (data?.url) window.location.href = data.url as string
    else setError('Unable to start checkout')
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex-col flex items-center">
      <Navbar />
      <div className="w-full max-w-md mt-10 px-6">
        {status === 'success' ? (
          <div className="rounded-xl bg-green-50 border border-green-200 p-4 text-green-700">Payment successful</div>
        ) : null}
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="mb-4 font-serif italic text-2xl text-stone-900">Subscribe</div>
          <div className="mb-2 font-sans text-sm text-stone-500">Selected plan: {plan === 'pro' ? 'Pro' : 'Go'}</div>
          {sessionEmail ? (
            <div className="flex flex-col gap-3">
              <div className="font-sans text-sm text-stone-600">Signed in as {sessionEmail}</div>
              <button
                onClick={checkout}
                disabled={loading}
                className="w-full rounded-full bg-black text-white font-sans text-sm font-medium py-3 hover:bg-stone-800 transition-colors disabled:opacity-50"
              >
                Continue to Checkout
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full rounded-lg border border-stone-300 px-3 py-2 font-sans text-sm"
              />
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="Password"
                className="w-full rounded-lg border border-stone-300 px-3 py-2 font-sans text-sm"
              />
              <div className="flex gap-2">
                <button
                  onClick={signIn}
                  disabled={loading}
                  className="w-1/2 rounded-full bg-black text-white font-sans text-sm font-medium py-2 hover:bg-stone-800 transition-colors disabled:opacity-50"
                >
                  Sign In
                </button>
                <button
                  onClick={signUp}
                  disabled={loading}
                  className="w-1/2 rounded-full bg-stone-200 text-stone-900 font-sans text-sm font-medium py-2 hover:bg-stone-300 transition-colors disabled:opacity-50"
                >
                  Sign Up
                </button>
              </div>
            </div>
          )}
          {error ? <div className="mt-3 text-sm text-red-600">{error}</div> : null}
        </div>
      </div>
    </div>
  )
}

export default function SubscribePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-neutral-50" />}>
      <SubscribeInner />
    </Suspense>
  )
}
