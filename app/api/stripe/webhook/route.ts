import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-02-25.clover',
})

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature') || ''

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET || '')
  } catch (err) {
    console.error('Webhook signature error:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const checkoutSession = event.data.object as Stripe.Checkout.Session
        const userId = checkoutSession.metadata?.userId
        if (userId && checkoutSession.customer) {
          await prisma.subscription.update({
            where: { userId },
            data: {
              stripeCustomerId: checkoutSession.customer as string,
              stripeSubscriptionId: checkoutSession.subscription as string,
              status: 'ACTIVE',
              plan: 'STARTER', // Will be updated by subscription event
            },
          })
        }
        break
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.created': {
        const sub = event.data.object as Stripe.Subscription
        const dbSub = await prisma.subscription.findFirst({
          where: { stripeCustomerId: sub.customer as string },
        })
        if (dbSub) {
          await prisma.subscription.update({
            where: { id: dbSub.id },
            data: {
              stripeSubscriptionId: sub.id,
              stripePriceId: sub.items.data[0]?.price.id,
              status: sub.status.toUpperCase() as any,
              currentPeriodStart: (sub as any).current_period_start ? new Date((sub as any).current_period_start * 1000) : undefined,
              currentPeriodEnd: (sub as any).current_period_end ? new Date((sub as any).current_period_end * 1000) : undefined,
              cancelAtPeriodEnd: sub.cancel_at_period_end,
            },
          })
        }
        break
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        await prisma.subscription.updateMany({
          where: { stripeCustomerId: sub.customer as string },
          data: { status: 'CANCELED', plan: 'FREE' },
        })
        break
      }
    }
  } catch (error) {
    console.error('Webhook handling error:', error)
    return NextResponse.json({ error: 'Webhook handler error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
