import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import {
  billingSubscriptionSelect,
  chooseBestStripeSubscription,
  stripeSubscriptionToBillingRecord,
  upsertBillingSubscription,
  type BillingSubscriptionRecord,
} from '@/lib/stripeBilling'

export const runtime = 'nodejs'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Cache-Control': 'no-store',
}

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: corsHeaders })
}

function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) return null
  return new Stripe(secretKey, { apiVersion: '2024-04-10' })
}

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase server env vars')
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

function getBearerToken(req: Request) {
  const authorization = req.headers.get('authorization') ?? ''
  const match = authorization.match(/^Bearer\s+(.+)$/i)
  return match?.[1] ?? null
}

function publicSubscription(subscription: BillingSubscriptionRecord | null) {
  if (!subscription) return null

  return {
    plan_code: subscription.plan_code,
    status: subscription.status,
    current_period_end: subscription.current_period_end,
    cancel_at_period_end: subscription.cancel_at_period_end,
  }
}

async function getExistingSubscription(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from('billing_subscriptions')
    .select(billingSubscriptionSelect)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return (data as BillingSubscriptionRecord | null) ?? null
}

async function syncSubscriptionFromStripe({
  stripe,
  supabase,
  userId,
  email,
  existingSubscription,
}: {
  stripe: Stripe
  supabase: any
  userId: string
  email: string | null
  existingSubscription: BillingSubscriptionRecord | null
}) {
  const customerIds = new Set<string>()
  const subscriptions = new Map<string, Stripe.Subscription>()

  if (existingSubscription?.stripe_customer_id) {
    customerIds.add(existingSubscription.stripe_customer_id)
  }

  if (existingSubscription?.stripe_subscription_id) {
    try {
      const subscription = await stripe.subscriptions.retrieve(existingSubscription.stripe_subscription_id)
      subscriptions.set(subscription.id, subscription)
      customerIds.add(typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id)
    } catch (error: any) {
      if (error?.code !== 'resource_missing') throw error
    }
  }

  if (email) {
    const customers = await stripe.customers.list({ email, limit: 10 })
    customers.data.forEach((customer) => customerIds.add(customer.id))
  }

  for (const customerId of Array.from(customerIds)) {
    const customerSubscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 100,
    })

    customerSubscriptions.data.forEach((subscription) => {
      subscriptions.set(subscription.id, subscription)
    })
  }

  const bestSubscription = chooseBestStripeSubscription(Array.from(subscriptions.values()))
  if (!bestSubscription) return existingSubscription

  const record = stripeSubscriptionToBillingRecord(bestSubscription, userId)
  if (!record) return existingSubscription

  return upsertBillingSubscription(supabase, record)
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders })
}

export async function GET(req: Request) {
  const token = getBearerToken(req)
  if (!token) return json({ error: 'missing_token' }, 401)

  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase.auth.getUser(token)

    if (error || !data.user) {
      return json({ error: 'invalid_token' }, 401)
    }

    const existingSubscription = await getExistingSubscription(supabase, data.user.id)
    const stripe = getStripeClient()
    let subscription = existingSubscription
    let source: 'stripe' | 'database' | 'none' = existingSubscription ? 'database' : 'none'

    if (stripe) {
      try {
        subscription = await syncSubscriptionFromStripe({
          stripe,
          supabase,
          userId: data.user.id,
          email: data.user.email ?? null,
          existingSubscription,
        })
        source = subscription ? 'stripe' : source
      } catch (error) {
        console.error('Stripe billing sync failed:', error)
      }
    }

    return json({
      subscription: publicSubscription(subscription),
      source,
    })
  } catch (error) {
    console.error('Billing status route failed:', error)
    return json({ error: 'server_error' }, 500)
  }
}
