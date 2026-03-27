import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: '2024-04-10' })

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
    const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY as string
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string
    if (!supabaseUrl || !publishableKey || !serviceRoleKey) {
      return NextResponse.json({ error: 'missing_env' }, { status: 500 })
    }

    const supabaseAuthClient = createClient(supabaseUrl, publishableKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    })
    const { data: userData, error: userError } = await supabaseAuthClient.auth.getUser()
    if (userError || !userData.user) {
      return NextResponse.json({ error: 'invalid_session' }, { status: 401 })
    }

    const user = userData.user
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    const { data: subData } = await supabaseAdmin
      .from('billing_subscriptions')
      .select('stripe_subscription_id, status')
      .eq('user_id', user.id)
      .maybeSingle()

    if (subData?.stripe_subscription_id && subData.status !== 'canceled') {
      try {
        await stripe.subscriptions.cancel(subData.stripe_subscription_id)
      } catch (stripeErr: any) {
        if (stripeErr?.code !== 'resource_missing') {
          return NextResponse.json({ error: 'stripe_cancel_failed' }, { status: 500 })
        }
      }
    }

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id)
    if (deleteError) {
      return NextResponse.json({ error: 'account_delete_failed' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Account delete error:', e)
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
