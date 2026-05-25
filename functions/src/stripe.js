// ============================================================================
// functions/src/stripe.js
//
// Stripe integration for CreaseFeed Pro subscriptions.
//
// Cloud Functions:
//   createCheckoutSession  — creates a Stripe Checkout session for Pro signup
//   stripeWebhook          — handles Stripe webhook events (subscription lifecycle)
//   createPortalSession    — creates a Stripe Customer Portal session for managing subscriptions
//
// Environment variables (set via Firebase secrets):
//   STRIPE_SECRET_KEY      — Stripe secret key (sk_test_... or sk_live_...)
//   STRIPE_WEBHOOK_SECRET  — Stripe webhook signing secret (whsec_...)
//   STRIPE_PRICE_MONTHLY   — Stripe Price ID for $9.99/mo plan
//   STRIPE_PRICE_ANNUAL    — Stripe Price ID for $79.99/yr plan
// ============================================================================

import { onRequest } from 'firebase-functions/v2/https'
import { defineSecret } from 'firebase-functions/params'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'
import { initializeApp, getApps } from 'firebase-admin/app'

const stripeSecretKey     = defineSecret('STRIPE_SECRET_KEY')
const stripeWebhookSecret = defineSecret('STRIPE_WEBHOOK_SECRET')
const stripePriceMonthly  = defineSecret('STRIPE_PRICE_MONTHLY')
const stripePriceAnnual   = defineSecret('STRIPE_PRICE_ANNUAL')

if (getApps().length === 0) initializeApp()
const db = getFirestore()

const APP_URL = 'https://creasefeed.web.app'

// ── Create Checkout Session ──────────────────────────────────────────────────
// POST /createCheckoutSession
// Body: { uid, email, plan: 'monthly' | 'annual' }
// Returns: { url } — the Stripe Checkout URL to redirect to
export const createCheckoutSession = onRequest({
  region: 'us-east1',
  memory: '256MiB',
  timeoutSeconds: 30,
  cors: true,
  invoker: 'public',
  secrets: [stripeSecretKey, stripePriceMonthly, stripePriceAnnual],
}, async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const Stripe = (await import('stripe')).default
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' })

  const { uid, email, plan } = req.body

  if (!uid || !email) {
    res.status(400).json({ error: 'Missing uid or email' })
    return
  }

  // Pick price based on plan
  const priceId = plan === 'annual'
    ? process.env.STRIPE_PRICE_ANNUAL
    : process.env.STRIPE_PRICE_MONTHLY

  if (!priceId) {
    res.status(500).json({ error: 'Stripe price not configured' })
    return
  }

  try {
    // Check if user already has a Stripe customer ID
    const userDoc = await db.collection('users').doc(uid).get()
    let customerId = userDoc.data()?.stripeCustomerId || null

    // Create Stripe customer if they don't have one
    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        metadata: { firebaseUid: uid },
      })
      customerId = customer.id
      await db.collection('users').doc(uid).update({ stripeCustomerId: customerId })
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${APP_URL}?checkout=success`,
      cancel_url: `${APP_URL}?checkout=cancel`,
      metadata: { firebaseUid: uid },
      subscription_data: {
        metadata: { firebaseUid: uid },
      },
    })

    res.json({ url: session.url })
  } catch (err) {
    console.error('[createCheckoutSession] Error:', err.message)
    res.status(500).json({ error: 'Failed to create checkout session', detail: err.message })
  }
})

// ── Stripe Webhook ───────────────────────────────────────────────────────────
// POST /stripeWebhook
// Stripe sends events here when subscription status changes.
// Must verify webhook signature for security.
export const stripeWebhook = onRequest({
  region: 'us-east1',
  memory: '256MiB',
  timeoutSeconds: 60,
  invoker: 'public',
  secrets: [stripeSecretKey, stripeWebhookSecret],
}, async (req, res) => {
  const Stripe = (await import('stripe')).default
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' })

  const sig = req.headers['stripe-signature']
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  let event
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret)
  } catch (err) {
    console.error('[stripeWebhook] Signature verification failed:', err.message)
    res.status(400).send(`Webhook Error: ${err.message}`)
    return
  }

  console.log(`[stripeWebhook] Event: ${event.type}`)

  try {
    switch (event.type) {
      // ── Checkout completed — user just subscribed ──
      case 'checkout.session.completed': {
        const session = event.data.object
        const uid = session.metadata?.firebaseUid
        if (uid) {
          await db.collection('users').doc(uid).update({
            pro: true,
            stripeSubscriptionId: session.subscription,
            stripeCustomerId: session.customer,
            proPlan: session.amount_total === 7999 ? 'annual' : 'monthly',
            proSince: new Date().toISOString(),
          })
          console.log(`[stripeWebhook] User ${uid} upgraded to Pro`)
        }
        break
      }

      // ── Subscription renewed / updated ──
      case 'customer.subscription.updated': {
        const sub = event.data.object
        const uid = sub.metadata?.firebaseUid
        if (uid) {
          const isActive = ['active', 'trialing'].includes(sub.status)
          await db.collection('users').doc(uid).update({
            pro: isActive,
            stripeSubscriptionStatus: sub.status,
          })
          console.log(`[stripeWebhook] User ${uid} subscription updated: ${sub.status}`)
        }
        break
      }

      // ── Subscription cancelled or expired ──
      case 'customer.subscription.deleted': {
        const sub = event.data.object
        const uid = sub.metadata?.firebaseUid
        if (uid) {
          await db.collection('users').doc(uid).update({
            pro: false,
            stripeSubscriptionStatus: 'cancelled',
            proCancelledAt: new Date().toISOString(),
          })
          console.log(`[stripeWebhook] User ${uid} subscription cancelled`)
        }
        break
      }

      // ── Payment failed ──
      case 'invoice.payment_failed': {
        const invoice = event.data.object
        const customerId = invoice.customer
        // Find user by Stripe customer ID
        const snap = await db.collection('users')
          .where('stripeCustomerId', '==', customerId)
          .limit(1)
          .get()
        if (!snap.empty) {
          const uid = snap.docs[0].id
          await db.collection('users').doc(uid).update({
            stripePaymentFailed: true,
          })
          console.log(`[stripeWebhook] Payment failed for user ${uid}`)
        }
        break
      }

      default:
        console.log(`[stripeWebhook] Unhandled event type: ${event.type}`)
    }

    res.json({ received: true })
  } catch (err) {
    console.error('[stripeWebhook] Processing error:', err.message)
    res.status(500).json({ error: 'Webhook processing failed' })
  }
})

// ── Create Customer Portal Session ───────────────────────────────────────────
// POST /createPortalSession
// Body: { uid }
// Returns: { url } — the Stripe Customer Portal URL (manage subscription, cancel, etc.)
export const createPortalSession = onRequest({
  region: 'us-east1',
  memory: '256MiB',
  timeoutSeconds: 30,
  cors: true,
  invoker: 'public',
  secrets: [stripeSecretKey],
}, async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const Stripe = (await import('stripe')).default
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' })

  const { uid } = req.body
  if (!uid) {
    res.status(400).json({ error: 'Missing uid' })
    return
  }

  try {
    const userDoc = await db.collection('users').doc(uid).get()
    const customerId = userDoc.data()?.stripeCustomerId
    if (!customerId) {
      res.status(400).json({ error: 'No Stripe customer found for this user' })
      return
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: APP_URL,
    })

    res.json({ url: session.url })
  } catch (err) {
    console.error('[createPortalSession] Error:', err.message)
    res.status(500).json({ error: 'Failed to create portal session', detail: err.message })
  }
})
