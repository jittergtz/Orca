import type Stripe from 'stripe'

export type BillingPlanCode = 'go' | 'pro'

export type BillingSubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'incomplete'
  | 'incomplete_expired'
  | 'paused'

export type BillingSubscriptionRecord = {
  user_id: string
  provider: 'stripe'
  stripe_customer_id: string
  stripe_subscription_id: string
  stripe_price_id: string
  plan_code: BillingPlanCode
  status: BillingSubscriptionStatus
  current_period_start: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  canceled_at: string | null
  created_at?: string
  updated_at?: string
}

const billingSubscriptionColumns = `
  user_id,
  provider,
  stripe_customer_id,
  stripe_subscription_id,
  stripe_price_id,
  plan_code,
  status,
  current_period_start,
  current_period_end,
  cancel_at_period_end,
  canceled_at,
  created_at,
  updated_at
`

const activeStatuses = new Set(['active', 'trialing'])

const supportedStatuses = new Set<BillingSubscriptionStatus>([
  'trialing',
  'active',
  'past_due',
  'canceled',
  'unpaid',
  'incomplete',
  'incomplete_expired',
  'paused',
])

const statusRank: Record<BillingSubscriptionStatus, number> = {
  active: 0,
  trialing: 0,
  past_due: 1,
  unpaid: 2,
  incomplete: 3,
  paused: 4,
  canceled: 5,
  incomplete_expired: 6,
}

export function toStripeTimestampISO(timestamp: number | null | undefined) {
  if (!timestamp || Number.isNaN(Number(timestamp))) return null
  return new Date(Number(timestamp) * 1000).toISOString()
}

export function isActiveBillingStatus(status: string | null | undefined) {
  return activeStatuses.has(String(status ?? '').toLowerCase())
}

function normalizeStripeStatus(status: Stripe.Subscription.Status): BillingSubscriptionStatus {
  const normalized = String(status).toLowerCase() as BillingSubscriptionStatus
  return supportedStatuses.has(normalized) ? normalized : 'canceled'
}

function getSubscriptionCustomerId(subscription: Stripe.Subscription) {
  return typeof subscription.customer === 'string'
    ? subscription.customer
    : subscription.customer.id
}

export function getPlanCodeFromPriceId(priceId: string | null | undefined): BillingPlanCode {
  const goPriceId = process.env.STRIPE_PRICE_GO
  const proPriceId = process.env.STRIPE_PRICE_PRO ?? process.env.STRIPE_PRICE_Pro

  if (priceId && proPriceId && priceId === proPriceId) return 'pro'
  if (priceId && goPriceId && priceId === goPriceId) return 'go'

  return 'go'
}

export function stripeSubscriptionToBillingRecord(
  subscription: Stripe.Subscription,
  userId: string
): BillingSubscriptionRecord | null {
  const priceId = subscription.items.data[0]?.price?.id
  if (!priceId) return null

  return {
    user_id: userId,
    provider: 'stripe',
    stripe_customer_id: getSubscriptionCustomerId(subscription),
    stripe_subscription_id: subscription.id,
    stripe_price_id: priceId,
    plan_code: getPlanCodeFromPriceId(priceId),
    status: normalizeStripeStatus(subscription.status),
    current_period_start: toStripeTimestampISO(subscription.current_period_start),
    current_period_end: toStripeTimestampISO(subscription.current_period_end),
    cancel_at_period_end: subscription.cancel_at_period_end,
    canceled_at: toStripeTimestampISO(subscription.canceled_at),
    updated_at: new Date().toISOString(),
  }
}

export function chooseBestStripeSubscription(subscriptions: Stripe.Subscription[]) {
  return [...subscriptions].sort((a, b) => {
    const aStatus = normalizeStripeStatus(a.status)
    const bStatus = normalizeStripeStatus(b.status)
    const rankDelta = statusRank[aStatus] - statusRank[bStatus]
    if (rankDelta !== 0) return rankDelta

    const aEnd = a.current_period_end ?? 0
    const bEnd = b.current_period_end ?? 0
    if (aEnd !== bEnd) return bEnd - aEnd

    return (b.created ?? 0) - (a.created ?? 0)
  })[0] ?? null
}

function getLegacyUserStatus(status: BillingSubscriptionStatus) {
  if (status === 'active' || status === 'trialing' || status === 'past_due') {
    return status
  }

  return 'canceled'
}

export async function upsertBillingSubscription(
  supabase: any,
  record: BillingSubscriptionRecord
) {
  const { data, error } = await supabase
    .from('billing_subscriptions')
    .upsert(record, { onConflict: 'user_id' })
    .select(billingSubscriptionColumns)
    .single()

  if (error) throw error

  const { error: userError } = await supabase
    .from('users')
    .update({
      stripe_customer_id: record.stripe_customer_id,
      subscription_status: getLegacyUserStatus(record.status),
      subscription_expires_at: record.current_period_end,
    })
    .eq('id', record.user_id)

  if (userError) {
    console.error('Unable to update legacy user billing fields:', userError)
  }

  return data as BillingSubscriptionRecord
}

export const billingSubscriptionSelect = billingSubscriptionColumns
