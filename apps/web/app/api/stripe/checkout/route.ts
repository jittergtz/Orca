import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: '2024-04-10' })

function getPriceId(plan: string) {
  if (plan === 'go') return process.env.STRIPE_PRICE_GO as string
  if (plan === 'pro') return ((process.env.STRIPE_PRICE_PRO ?? process.env.STRIPE_PRICE_Pro) as string)
  return ''
}

export async function POST(req: Request) {
  try {
    const origin = new URL(req.url).origin
    const { plan, email, userId } = await req.json()
    const priceId = getPriceId(plan)
    if (!priceId || !email || !userId) return NextResponse.json({ error: 'invalid_request' }, { status: 400 })

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: email,
      client_reference_id: userId,
      subscription_data: {
        metadata: { supabase_user_id: userId }
      },
      metadata: { supabase_user_id: userId },
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/subscribe?status=success`,
      cancel_url: `${origin}/pricing`,
      allow_promotion_codes: true,
    })

    return NextResponse.json({ url: session.url })
  } catch (e) {
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
