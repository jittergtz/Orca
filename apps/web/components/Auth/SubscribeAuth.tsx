'use client'
import { useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabaseClient'
import { main } from 'framer-motion/client'

type Plan = 'go' | 'pro'

export default function SubscribeAuth({
  plan,
  onCheckout,
}: {
  plan: Plan
  onCheckout: (email: string, userId: string) => Promise<void> | void
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sessionEmail, setSessionEmail] = useState<string | null>(null)
  const [sessionUserId, setSessionUserId] = useState<string | null>(null)

  useEffect(() => {
    const s = getSupabase()
    if (!s) return
    s.auth.getSession().then(({ data }) => {
      setSessionEmail(data.session?.user.email ?? null)
      setSessionUserId(data.session?.user.id ?? null)
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
    setSessionUserId(data.session?.user.id ?? null)
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
    setSessionUserId(data.session?.user.id ?? null)
    setLoading(false)
  }

  const signInWithGoogle = async () => {
    setLoading(true)
    setError(null)
    const s = getSupabase()
    if (!s) return
    const redirectTo = `${window.location.origin}/subscribe?plan=${encodeURIComponent(plan)}`
    const { error } = await s.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  const continueToCheckout = async () => {
    if (!sessionEmail || !sessionUserId) return
    setLoading(true)
    setError(null)
    try {
      await onCheckout(sessionEmail, sessionUserId)
    } catch (e) {
      setError('Unable to start checkout')
      setLoading(false)
    }
  }

  return (
    <main className='0  flex pt-10 justify-center w-full'>
    <div className=" max-w-md  w-full p-6 ">
      <div className="mb-4 font-serif italic text-2xl text-stone-900">Orca Login</div>
      <div className="mb-2 font-sans text-sm text-stone-500">Selected plan: {plan === 'pro' ? 'Pro' : 'Go'}</div>
      {sessionEmail ? (
        <div className="flex flex-col gap-3">
          <div className="font-sans text-sm text-stone-600">Signed in as {sessionEmail}</div>
          <button
            onClick={continueToCheckout}
            disabled={loading}
            className="w-full rounded-full bg-black text-white font-sans text-sm font-medium py-3 hover:bg-stone-800 transition-colors disabled:opacity-50"
          >
            Continue to Checkout
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <button
            onClick={signInWithGoogle}
            disabled={loading}
            className="w-full mb-10 mt-5 rounded-full bg-stone-900 text-white font-sans text-sm font-medium py-3.5 hover:bg-stone-800 transition-colors disabled:opacity-50"
          >
            Continue with Google
          </button>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full rounded-full border border-stone-200 px-3 py-3 font-sans text-sm"
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Password"
            className="w-full rounded-full border border-stone-200 px-3 py-3 font-sans text-sm"
          />
          <div className="flex gap-2">
            <button
              onClick={signIn}
              disabled={loading}
              className="w-1/2 rounded-full bg-black text-white font-sans text-sm font-medium py-3 hover:bg-stone-800 transition-colors disabled:opacity-50"
            >
              Sign In
            </button>
            <button
              onClick={signUp}
              disabled={loading}
              className="w-1/2 rounded-full bg-stone-100 text-stone-900 font-sans text-sm font-medium py-3 hover:bg-stone-300 transition-colors disabled:opacity-50"
            >
              Sign Up
            </button>
          </div>
        </div>
      )}
      {error ? <div className="mt-3 text-sm text-red-600">{error}</div> : null}
    </div>
    </main>
  )
}
