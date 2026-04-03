'use client'
import { Suspense, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import Navbar from '@/components/Landing/Navbar'
import SubscribeAuth from '@/components/Auth/SubscribeAuth'
import Image from 'next/image'
import { Check } from 'lucide-react'

function SubscribeInner() {
  const params = useSearchParams()
  const plan = useMemo(() => (params.get('plan') === 'pro' ? 'pro' : 'go'), [params])
  const status = params.get('status')

  const checkout = async (email: string, userId: string) => {
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan, email, userId }),
    })
    const data = await res.json()
    if (data?.url) window.location.href = data.url as string
  }

  return (
    <div className="min-h-screen bg-white  w-full flex-col flex items-center">
      <Navbar />
      <div className="w-full max-w-7xl mt-40  px-6">
        {status === 'success' ? (
          <div className="rounded-full absolute top-20 left-1/2 -translate-x-1/2 w-80 bg-green-100 border border-green-300 p-2.5 text-center text-green-700 flex justify-center gap-3"> <Check/> Payment successful</div>
        ) : null}
        <div className='flex  shadow-md rounded-2xl w-full gap-5 justify-center'>
         <div className='relative'>
          <Image
          src={"/pricing/4.jpg"}
          width={960}
          height={640}
          alt='Subscribe Image'
          className='w-full hidden md:flex h-[600px] object-cover rounded-2xl'/>
           <p className='absolute hidden md:block bottom-5   font-serif text-[36px] w-2/3 text-end right-10 z-50 text-[#fdfcf9ba]'>Changing How You Stay Informed.</p>
          </div>

        <SubscribeAuth plan={plan} onCheckout={checkout} />
        </div>
      </div>
    </div>
  )
}

export default function SubscribePage() {
  return (
    <Suspense fallback={<div className="min-h-screen w-full bg-neutral-50" />}>
      <SubscribeInner />
    </Suspense>
  )
}
