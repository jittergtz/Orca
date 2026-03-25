import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: '2024-04-10' })

export async function POST(req: Request) {
  try {
    const origin = new URL(req.url).origin
    const { email } = await req.json()
    if (!email) return NextResponse.json({ error: 'invalid_request' }, { status: 400 })

    const customers = await stripe.customers.list({ email, limit: 1 })
    if (!customers.data.length) {
      return NextResponse.json({ error: 'customer_not_found' }, { status: 404 })
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customers.data[0].id,
      return_url: `${origin}/dashboard`,
    })

    return NextResponse.json({ url: session.url })
  } catch (e: any) {
    console.error('Stripe portal err:', e)
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
