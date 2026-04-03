'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabase } from '@/lib/supabaseClient'
import { NavbarDashboard } from '@/components/Landing/Navbar'
import ProfileInfoCard from '@/components/Dashboard/ProfileInfoCard'
import { LogOut, CreditCard, Zap } from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [createdAt, setCreatedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [portalLoading, setPortalLoading] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [plan, setPlan] = useState<string>('Go')
  const [status, setStatus] = useState<string>('Inactive')
  const [nextPayment, setNextPayment] = useState<string>('N/A')
  const [willCancel, setWillCancel] = useState(false)

  useEffect(() => {
    const s = getSupabase()
    if (!s) return
    s.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.push('/')
      } else {
        setEmail(data.session.user.email ?? null)
        setUserId(data.session.user.id ?? null)
        
        // @ts-ignore - Types for users may not be generated yet
        const userQuery = s.from('users')
          .select('created_at')
          .eq('id', data.session.user.id)
          .maybeSingle() as Promise<any>;

        userQuery.then((res: any) => {
          const { data: userData, error } = res;
          if (error) {
            console.error("Supabase Error fetching user created_at:", error);
            return;
          }
          setCreatedAt(userData?.created_at ?? null)
        }).catch((err: any) => {
          console.error("Network Error fetching user created_at:", err);
        })
        
        // @ts-ignore - Types for billing_subscriptions may not be generated yet
        const query = s.from('billing_subscriptions')
          .select('plan_code, status, current_period_end, cancel_at_period_end')
          .eq('user_id', data.session.user.id)
          .maybeSingle() as Promise<any>;

        query.then((res: any) => {
            const { data: sub, error } = res;
            if (error) {
              console.error("Supabase Error fetching plan:", error);
            }
            if (!error && sub) {
              const pc = sub.plan_code ? String(sub.plan_code).trim().toLowerCase() : 'go';
              const currentStatus = String(sub.status).toLowerCase();
              setPlan(pc === 'pro' && currentStatus !== 'canceled' ? 'Pro' : 'Go')
              
              if (currentStatus === 'canceled' || currentStatus === 'past_due') {
                 setStatus(currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1))
                 setWillCancel(false)
              } else if (sub.cancel_at_period_end) {
                 setStatus('Canceling')
                 setWillCancel(true)
              } else {
                 setStatus('Active')
                 setWillCancel(false)
              }

              if (sub.current_period_end) {
                setNextPayment(new Date(sub.current_period_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }))
              }
            } else {
              setPlan('Go')
              setStatus('Inactive')
              setWillCancel(false)
            }
            setLoading(false)
          })
          .catch((err: any) => {
            console.error("Network Error fetching plan:", err);
            setLoading(false)
          })
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
    if (!email || !userId) return
    setCheckoutLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'pro', email, userId }),
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
      <NavbarDashboard />

      <main className="w-full max-w-4xl pt-24 pb-12 flex flex-col gap-8">
        {/* Header */}
        <div className="flex items-end justify-between border-b border-stone-200 pb-6">
          <div>
            <div className='w-full flex  justify-between'>
            <h1 className="font-serif italic text-4xl text-stone-900 mb-2">Dashboard</h1>
            <button 
            onClick={handleSignOut}
            className="flex sm:hidden items-center gap-2 text-sm font-sans font-medium text-stone-500 hover:text-stone-900 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
          </div>
            <p className="font-sans text-stone-500">Welcome back, {email}</p>
          </div>
          <button 
            onClick={handleSignOut}
            className="sm:flex hidden items-center gap-2 text-sm font-sans font-medium text-stone-500 hover:text-stone-900 transition-colors"
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
                  <span>Requests</span>
                  <span className="font-medium text-stone-900">47% used</span>
                </div>
                {/* Usage Bar */}
                <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-orange-600 to-orange-200 rounded-full" style={{ width: '47%' }} />
                </div>
              </div>
            </div>
          {plan !== 'Pro' ? (
            <div className="bg-gradient-to-tl from-stone-200 border border-black/10 rounded-xl p-4   flex flex-col items-center justify-between">
             
            <div className='flex w-full items-center justify-between'>
              <span className="font-sans text-sm text-stone-600">Current Plan: <strong>{plan}</strong></span>
            
                <div className='flex flex-col gap-1'>
                <button 
                  onClick={handleUpgradeToPro}
                  disabled={checkoutLoading}
                  className="bg-stone-900 text-white font-sans text-sm px-4 py-2 rounded-full font-medium hover:bg-stone-800 transition-colors disabled:opacity-50"
                >
                  {checkoutLoading ? 'Loading...' : 'Upgrade to Pro'}
                </button>
              
                </div>
                  
            </div>
              <p className='text-black mt-3 text-xs w-full text-start font-'>
                Pro will give you 15 active subscriped topics and up to 4x higher limits.
               </p>
                </div>  
                      ):(
            <div className="bg-gradient-to-tl from-stone-500 border border-black/10 rounded-xl p-4   flex flex-col items-center justify-between">
             
            <div className='flex w-full items-center justify-between'>
              <span className="font-sans text-sm text-stone-600">Current Plan: <strong>{plan}</strong></span>
            
                <div className='flex flex-col gap-1'>             
                </div>      
        
            </div>
              <p className='text-black mt-3 text-xs w-full text-start font-'>
             Thanks for subscribing to Orca Pro.
               </p>
                </div>  
                      )}
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
                <span className="font-sans text-sm text-stone-500">{willCancel ? 'Access Until' : 'Next Payment'}</span>
                <span className="font-sans text-sm font-medium text-stone-900">{nextPayment}</span>
              </div>
              <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-6">
                <span className="font-sans text-sm text-stone-500">Status</span>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
                  status === 'Active' ? 'bg-green-50 text-green-700 ring-green-600/20' : 
                  status === 'Canceling' ? 'bg-amber-50 text-amber-700 ring-amber-600/20' : 
                  'bg-stone-50 text-stone-700 ring-stone-600/20'
                }`}>
                  {status}
                </span>
              </div>

              <button 
                onClick={handleManageBilling}
                disabled={portalLoading}
                className="w-full bg-white text-stone-900 border border-stone-200 font-sans text-sm px-4 py-3 rounded-full font-medium hover:bg-stone-50 hover:border-stone-300 transition-all disabled:opacity-50 shadow-sm"
              >
                {portalLoading ? 'loading...' : 'Mange subscription'}
              </button>
            </div>
          </div>

          <ProfileInfoCard email={email} createdAt={createdAt} />
        </div>
      </main>
    </div>
  )
}
