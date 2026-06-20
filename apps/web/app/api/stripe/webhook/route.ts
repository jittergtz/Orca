import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { appendFileSync } from 'fs'
import { sendWelcomeEmail, sendPaymentEmail } from '@/lib/email'
import {
  getPlanCodeFromPriceId,
  stripeSubscriptionToBillingRecord,
  toStripeTimestampISO,
  upsertBillingSubscription,
} from '@/lib/stripeBilling'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: '2024-04-10' })
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET as string

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature') as string

  let event: Stripe.Event
  const log = (msg: string) => {
    const timestamp = new Date().toISOString()
    appendFileSync('/tmp/webhook_logs.txt', `[${timestamp}] ${msg}\n`)
  }

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret)
  } catch (err: any) {
    log(`Webhook Error: ${err.message}`)
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string
  )

  try {
    log(`Received Event: ${event.type}`)
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.supabase_user_id || session.client_reference_id
        
        if (!userId) {
          log(`No userId attached to session metadata!`)
          break
        }

        const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
        const priceId = subscription.items.data[0].price.id
        const planCode = getPlanCodeFromPriceId(priceId)

        log(`Inserting sub ${subscription.id} for user ${userId}. End Date: ${toStripeTimestampISO(subscription.current_period_end)}`)
        const record = stripeSubscriptionToBillingRecord(subscription, userId)
        if (!record) {
          log(`Insert skipped: subscription ${subscription.id} has no price item`)
          break
        }

        try {
          await upsertBillingSubscription(supabase, record)
          log(`Insert Success!`)
        } catch (insertError: any) {
          log(`Insert Error: ${JSON.stringify(insertError)}`)
        }

        // Send welcome + payment confirmation emails
        try {
          const { data: userData } = await supabase
            .from('users')
            .select('email')
            .eq('id', userId)
            .single()

          if (userData?.email) {
            const planLabel = planCode === 'pro' ? 'Pro' : 'Go'
            const amount = planCode === 'pro' ? '$12/mo' : '$5/mo'
            const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

            await Promise.all([
              sendWelcomeEmail(userData.email, planCode),
              sendPaymentEmail(userData.email, planLabel, amount, date),
            ])
            log(`Emails sent to ${userData.email}`)
          }
        } catch (err: any) {
          log(`Email send error (non-fatal): ${err.message}`)
        }

        break
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const eventSubscription = event.data.object as Stripe.Subscription
        
        // IMPORTANT: Always retrieve full object from Stripe to ensure all fields like current_period_end are present and correctly formatted
        const subscription = await stripe.subscriptions.retrieve(eventSubscription.id)
        const userId = subscription.metadata?.supabase_user_id || eventSubscription.metadata?.supabase_user_id

        const start = toStripeTimestampISO(subscription.current_period_start)
        const end = toStripeTimestampISO(subscription.current_period_end)
        log(`Updating sub ${subscription.id} (status: ${subscription.status}, canceling: ${subscription.cancel_at_period_end}, end: ${end})`)

        if (userId) {
          const record = stripeSubscriptionToBillingRecord(subscription, userId)
          if (record) {
            try {
              await upsertBillingSubscription(supabase, record)
              log(`Upsert Success from subscription event!`)
              break
            } catch (upsertError: any) {
              log(`Upsert DB error: ${JSON.stringify(upsertError)}`)
            }
          }
        }

        const { data: updatedData, error: updateError } = await supabase.from('billing_subscriptions')
          .update({
            status: subscription.status,
            current_period_start: start,
            current_period_end: end,
            cancel_at_period_end: subscription.cancel_at_period_end,
            canceled_at: toStripeTimestampISO(subscription.canceled_at),
            updated_at: new Date().toISOString()
          })
          .eq('stripe_subscription_id', subscription.id)
          .select()

        if (updateError) {
          log(`Update DB error: ${JSON.stringify(updateError)}`)
        } else {
          log(`Update Success! New Data Rows: ${updatedData?.length || 0}`)
        }
        break
      }
    }
  } catch (err: any) {
    log(`Critical Fail: ${err.message}`)
  }

  return NextResponse.json({ ok: true })
}
