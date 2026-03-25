'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabase } from '@/lib/supabaseClient'
import Navbar from '@/components/Landing/Navbar'
import { LogOut, CreditCard, Zap } from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [portalLoading, setPortalLoading] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  useEffect(() => {
    const s = getSupabase()
    if (!s) return
    s.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.push('/')
      } else {
        setEmail(data.session.user.email ?? null)
        setLoading(false)
      }
    })
  }, [router])

  const handleSignOut = async () => {
    const s = getSupabase()
    if (s) {
      await s.auth.signOut()
      router.push('/')
    }
  }

  const handleManageBilling = async () => {
    if (!email) return
    setPortalLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert('Could not open billing portal. You might not have an active subscription.')
      }
    } catch (e) {
      console.error(e)
    } finally {
      setPortalLoading(false)
    }
  }

  const handleUpgradeToPro = async () => {
    if (!email) return
    setCheckoutLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'pro', email }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (e) {
      console.error(e)
    } finally {
      setCheckoutLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen px-4 flex-col bg-neutral-50 items-center justify-center">
        <div className="font-serif italic text-2xl text-stone-500 animate-pulse">Loading Dashboard...</div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen px-4 flex-col bg-neutral-50 items-center">
      <Navbar />

      <main className="w-full max-w-4xl pt-24 pb-12 flex flex-col gap-8">
        {/* Header */}
        <div className="flex items-end justify-between border-b border-stone-200 pb-6">
          <div>
            <h1 className="font-serif italic text-4xl text-stone-900 mb-2">Dashboard</h1>
            <p className="font-sans text-stone-500">Welcome back, {email}</p>
          </div>
          <button 
            onClick={handleSignOut}
            className="flex items-center gap-2 text-sm font-sans font-medium text-stone-500 hover:text-stone-900 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Usage Stats Box */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <Zap className="w-5 h-5 text-stone-900" />
                <h2 className="font-serif text-xl text-stone-900">Monthly Usage</h2>
              </div>

              <div className="space-y-2 mb-8">
                <div className="flex justify-between font-sans text-sm text-stone-600">
                  <span>Fast Requests</span>
                  <span className="font-medium text-stone-900">235 / 500</span>
                </div>
                {/* Usage Bar */}
                <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                  <div className="h-full bg-stone-900 rounded-full" style={{ width: '47%' }} />
                </div>
              </div>
            </div>

            <div className="bg-stone-50 rounded-xl p-4 border border-stone-100 flex items-center justify-between">
              <span className="font-sans text-sm text-stone-600">Current Plan: <strong>Go</strong></span>
              <button 
                onClick={handleUpgradeToPro}
                disabled={checkoutLoading}
                className="bg-stone-900 text-white font-sans text-sm px-4 py-2 rounded-full font-medium hover:bg-stone-800 transition-colors disabled:opacity-50"
              >
                {checkoutLoading ? 'Loading...' : 'Upgrade to Pro'}
              </button>
            </div>
          </div>

          {/* Subscription Box */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <CreditCard className="w-5 h-5 text-stone-900" />
              <h2 className="font-serif text-xl text-stone-900">Subscription Setup</h2>
            </div>
            
            <p className="font-sans text-sm text-stone-600 mb-6 leading-relaxed">
              Manage your payment methods, download invoices, or cancel your subscription at any time securely via Stripe.
            </p>

            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <span className="font-sans text-sm text-stone-500">Next Payment</span>
                <span className="font-sans text-sm font-medium text-stone-900">Apr 21, 2026</span>
              </div>
              <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-6">
                <span className="font-sans text-sm text-stone-500">Status</span>
                <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                  Active
                </span>
              </div>

              <button 
                onClick={handleManageBilling}
                disabled={portalLoading}
                className="w-full bg-white text-stone-900 border border-stone-200 font-sans text-sm px-4 py-3 rounded-full font-medium hover:bg-stone-50 hover:border-stone-300 transition-all disabled:opacity-50 shadow-sm"
              >
                {portalLoading ? 'Redirecting...' : 'Manage Payment / Cancel'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
