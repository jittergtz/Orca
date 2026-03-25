'use client'
import { Suspense, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import Navbar from '@/components/Landing/Navbar'
import SubscribeAuth from '@/components/Auth/SubscribeAuth'

function SubscribeInner() {
  const params = useSearchParams()
  const plan = useMemo(() => (params.get('plan') === 'pro' ? 'pro' : 'go'), [params])
  const status = params.get('status')

  const checkout = async (email: string) => {
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan, email }),
    })
    const data = await res.json()
    if (data?.url) window.location.href = data.url as string
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex-col flex items-center">
      <Navbar />
      <div className="w-full max-w-md mt-10 px-6">
        {status === 'success' ? (
          <div className="rounded-xl bg-green-50 border border-green-200 p-4 text-green-700">Payment successful</div>
        ) : null}
        <SubscribeAuth plan={plan} onCheckout={checkout} />
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
