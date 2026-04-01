'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabase } from '@/lib/supabaseClient'

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
  const [checkingAccess, setCheckingAccess] = useState(true)
  const [hasActiveAccess, setHasActiveAccess] = useState(false)
  const router = useRouter()

  const refreshAuthAndAccess = async () => {
    const s = getSupabase()
    if (!s) {
      setSessionEmail(null)
      setSessionUserId(null)
      setHasActiveAccess(false)
      setCheckingAccess(false)
      return
    }

    const { data } = await s.auth.getSession()
    const session = data.session
    setSessionEmail(session?.user.email ?? null)
    setSessionUserId(session?.user.id ?? null)

    if (!session?.user.id) {
      setHasActiveAccess(false)
      setCheckingAccess(false)
      return
    }

    const result = (await s
      .from('billing_subscriptions')
      .select('status')
      .eq('user_id', session.user.id)
      .maybeSingle()) as any

    const status = String(result?.data?.status ?? '').toLowerCase()
    const activeStates = ['active', 'trialing', 'canceling']
    const isActive = !!result?.data && activeStates.includes(status)

    setHasActiveAccess(isActive)
    setCheckingAccess(false)
  }

  useEffect(() => {
    refreshAuthAndAccess()
    const s = getSupabase()
    if (!s) return
    const { data } = s.auth.onAuthStateChange(() => {
      setCheckingAccess(true)
      refreshAuthAndAccess()
    })
    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!checkingAccess && sessionUserId && hasActiveAccess) {
      router.replace('/dashboard')
    }
  }, [checkingAccess, sessionUserId, hasActiveAccess, router])

  const signIn = async () => {
    setLoading(true)
    setError(null)
    const s = getSupabase()
    if (!s) {
      setLoading(false)
      return
    }
    const { error } = await s.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    setCheckingAccess(true)
    await refreshAuthAndAccess()
    setLoading(false)
  }

  const signUp = async () => {
    setLoading(true)
    setError(null)
    const s = getSupabase()
    if (!s) {
      setLoading(false)
      return
    }
    const { error } = await s.auth.signUp({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    setCheckingAccess(true)
    await refreshAuthAndAccess()
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
      {checkingAccess ? (
        <div className="flex flex-col gap-3">
          <div className="font-sans text-sm text-stone-600">Checking your subscription...</div>
          <div className="w-full rounded-full bg-stone-100 text-stone-400 font-sans text-sm font-medium py-3 text-center">
            Loading
          </div>
        </div>
      ) : sessionEmail ? (
        <div className="flex flex-col gap-3">
          <div className="font-sans text-sm text-stone-600">Signed in as {sessionEmail}</div>
          {hasActiveAccess ? (
            <button
              onClick={() => router.replace('/dashboard')}
              disabled={loading}
              className="w-full rounded-full bg-black text-white font-sans text-sm font-medium py-3 hover:bg-stone-800 transition-colors disabled:opacity-50"
            >
              Go to Dashboard
            </button>
          ) : (
            <button
              onClick={continueToCheckout}
              disabled={loading}
              className="w-full rounded-full bg-black text-white font-sans text-sm font-medium py-3 hover:bg-stone-800 transition-colors disabled:opacity-50"
            >
              Continue to Checkout
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <button
            onClick={signInWithGoogle}
            disabled={loading}
            className="w-full mb-10 flex justify-center gap-2 items-center mt-5 rounded-full bg-stone-900 text-white font-sans text-sm font-medium py-3.5 hover:bg-stone-800 transition-colors disabled:opacity-50"
          >
                <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
                  <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.653 32.657 29.23 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.846 1.154 7.961 3.039l5.657-5.657C34.053 6.053 29.277 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
                  <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.846 1.154 7.961 3.039l5.657-5.657C34.053 6.053 29.277 4 24 4c-7.681 0-14.417 4.337-17.694 10.691z" />
                  <path fill="#4CAF50" d="M24 44c5.176 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.137 35.091 26.715 36 24 36c-5.21 0-9.62-3.318-11.283-7.946l-6.522 5.025C9.436 39.556 16.227 44 24 44z" />
                  <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.056 12.056 0 0 1-4.084 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
                </svg>
          
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
