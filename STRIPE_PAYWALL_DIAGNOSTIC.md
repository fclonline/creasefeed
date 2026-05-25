# CreaseFeed — Stripe / Paywall Diagnostic Report

**Date:** April 22, 2026
**Scope:** Read-only map of the existing payment / subscription surface. No code was modified.
**Summary of failure mode under investigation:** The "Go Pro" flow returns `"Stripe price not configured"` from the backend and no user has ever completed a checkout.

---

## 1. Paywall UI — files that render the Go Pro screen and upgrade cards

There is no dedicated `Paywall.jsx` component. The paywall surface is spread across four files:

| Surface | File | Line(s) |
|---|---|---|
| Full "Go Pro" modal (the screen that hosts the "Start Pro — $9.99/month" CTA) | `src/components/shared.jsx` — `AuthModal` component, `view === 'pro'` branch | lines 472–627 (modal); pricing CTAs on lines 571–587 |
| Navbar "Go Pro" button (top right, signed-out state) and "Upgrade to Pro →" dropdown item (signed-in, non-Pro) | `src/components/shared.jsx` — `Navbar` component | lines 113–117 and 127 |
| "Following limit reached" / "N/2 free teams used" upgrade card in the My Feed sidebar | `src/pages/MyFeed.jsx` | lines 190–208 (conditional block gated by `!pro && user`) |
| In-page "Go Pro" sidebar widget on the Scores page ("Go Pro — $9.99 / month") | `src/pages/Scores.jsx` | lines 182–196 |
| Onboarding "You've reached the free limit of 2 teams" banner + the persistent "2/2 free teams used" footer note | `src/components/Onboarding.jsx` | lines 195–206 and 254–259 |

All of these CTAs call `onAuthClick('pro')`, which is threaded down from `src/App.jsx` (line 26, `openAuth`). That opens the same `<AuthModal mode="pro" />` from `shared.jsx`, so there is one canonical "Go Pro" screen with multiple entry points.

---

## 2. Feature gating logic — how Pro vs. Free is decided, and where the 2-team limit lives

**Source of truth:** a single boolean field `pro` on the user's Firestore doc at `users/{uid}`.

**How it's exposed to the app:** the `useAuth` hook in `src/hooks/useAuth.jsx` (79 lines, no separate `useSubscription` hook exists). It:

1. On sign-in, reads `users/{uid}` with `getDoc` (line 30) and sets local state with `setPro(data.pro === true)` (line 45).
2. Attaches a real-time Firestore listener via `onSnapshot(ref, ...)` on lines 50–55 that keeps `pro` in sync whenever the user doc changes. The inline comment on line 49 states the listener's purpose explicitly: *"Listen for real-time changes to user doc (pro status updates from Stripe webhook)"*.
3. Exposes `{ user, pro, isNewUser, ... }` via React context (`AuthContext`). Every consumer — `Navbar`, `MyFeed`, `Onboarding`, `TeamsProvider` — reads Pro status via `useAuth()`.

**There is no dedicated `useSubscription` hook and no dedicated subscription context.** There is also no server-side token/claim check — Pro status is purely a Firestore boolean the client observes.

**Where the 2-team follow limit is enforced:**

- **Server-authoritative enforcement: none.** `firestore.rules` (lines 5–7) allows the user to write anything under their own `users/{uid}` doc. There is no rule clamping `followedTeams` size or verifying `pro === true` before allowing a 3rd+ team.
- **Client enforcement — primary:** `src/hooks/useTeams.jsx`, inside `followTeam()` on lines 55–67:
  ```js
  const count = Object.keys(followedTeams).length
  if (!pro && count >= 2 && !followedTeams[teamId]) return { error: 'pro' }
  ```
  This returns `{ error: 'pro' }` which `src/pages/Teams.jsx` (line 55) uses to trigger `onAuthClick('pro')` — i.e., it opens the Go Pro modal instead of adding the team.
- **Client enforcement — onboarding:** `src/components/Onboarding.jsx` defines `const FREE_LIMIT = 2` (line 130) and computes `atLimit = !pro && selected.size >= FREE_LIMIT` (line 131). Lines 138–146 (`toggle`) prevent further selections once `atLimit` is true.
- **Client enforcement — alert level Pro gating:** `src/pages/MyFeed.jsx` lines 176–180 disable the `goals` and `live` alert options in the `<select>` when `!pro`.

**Net:** gating is entirely on the client. A motivated user could write to their own user doc and flip `pro: true` because the Firestore rules give them full write access to `users/{uid}`.

---

## 3. Checkout initiation — what happens when a user clicks "Start Pro — $9.99/month"

**Trace, in order:**

1. `src/components/shared.jsx` line 574 — button `onClick={() => handleCheckout('monthly')}`. (The annual button on line 582 calls `handleCheckout('annual')`.)
2. `handleCheckout(plan)` is defined on lines 491–516 in the same file. It:
   - Returns early and switches the modal to the sign-in view if `!user` (lines 492–495).
   - Sets `checkoutLoading` true, clears `error`.
   - Makes a `POST` to `${FUNCTIONS_BASE}/createCheckoutSession` with body `{ uid, email, plan }` (lines 500–504).
   - `FUNCTIONS_BASE` is a hard-coded string literal on line 480: `'https://us-east1-creasefeed.cloudfunctions.net'`.
   - On success, reads `data.url` from the JSON response and does `window.location.href = data.url` (line 507) — a full-page redirect to Stripe-hosted Checkout.
   - On failure, sets `error` to `data.error || 'Failed to start checkout'` (line 509). **This is the branch that currently surfaces `"Stripe price not configured"` to the user.**
3. The Cloud Function is exported from `functions/src/index.js` line 24 (`export { createCheckoutSession, stripeWebhook, createPortalSession } from './stripe.js'`) and defined in `functions/src/stripe.js` lines 32–98 as `createCheckoutSession`.

The function is an HTTP v2 Cloud Function, region `us-east1`, CORS enabled, invoker `'public'`. The URL the frontend builds matches the deployed function URL convention.

---

## 4. Stripe price configuration — where the error comes from

The exact code producing the `"Stripe price not configured"` error is `functions/src/stripe.js` lines 54–62:

```js
// Pick price based on plan
const priceId = plan === 'annual'
  ? process.env.STRIPE_PRICE_ANNUAL
  : process.env.STRIPE_PRICE_MONTHLY

if (!priceId) {
  res.status(500).json({ error: 'Stripe price not configured' })
  return
}
```

The app is reading price IDs from **Cloud Functions process environment variables**, not from a Firestore config doc, not from a constants file, not from a client-side config. The two variables it looks for are:

- `STRIPE_PRICE_MONTHLY` — expected to be a Stripe Price ID like `price_...` for the $9.99/month plan
- `STRIPE_PRICE_ANNUAL` — expected to be a Stripe Price ID like `price_...` for the $79.99/year plan

Neither is currently set in the Cloud Functions runtime. There is no `.env` file inside `functions/` (confirmed by directory listing — only `node_modules`, `package-lock.json`, `package.json`, `src`). There is no `defineSecret(...)` call in the codebase (the only `defineSecret` hits in grep are inside `functions/node_modules/firebase-functions/` — library internals, not app usage). There is also no binding of secrets via the `secrets: [...]` option in the `onRequest({...})` config for `createCheckoutSession`.

So when Firebase deploys this function, `process.env.STRIPE_PRICE_MONTHLY` and `process.env.STRIPE_PRICE_ANNUAL` are both `undefined`, the `if (!priceId)` branch hits, and the user sees the error.

---

## 5. Webhook handler — what `stripeWebhook` does per event

The webhook handler lives in `functions/src/stripe.js` lines 104–204 and is exported via `functions/src/index.js` line 24. It's an HTTP v2 function, `us-east1`, `invoker: 'public'`.

**Flow:**
1. Lazy-imports `stripe` (line 110) and instantiates it with `process.env.STRIPE_SECRET_KEY` (line 111).
2. Reads the `stripe-signature` header (line 113) and `process.env.STRIPE_WEBHOOK_SECRET` (line 114).
3. Verifies the event with `stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret)` (line 118). If verification fails, returns 400.
4. Switches on `event.type` and updates the user's Firestore doc:

| Event | What it does (lines 130–193) |
|---|---|
| `checkout.session.completed` | Reads `session.metadata.firebaseUid`. Updates `users/{uid}` with `{ pro: true, stripeSubscriptionId, stripeCustomerId, proPlan: session.amount_total === 7999 ? 'annual' : 'monthly', proSince: <ISO timestamp> }`. |
| `customer.subscription.updated` | Reads `sub.metadata.firebaseUid`. Sets `pro` to `true` iff status is `active` or `trialing`, else `false`. Also writes `stripeSubscriptionStatus: sub.status`. |
| `customer.subscription.deleted` | Reads `sub.metadata.firebaseUid`. Sets `{ pro: false, stripeSubscriptionStatus: 'cancelled', proCancelledAt: <ISO timestamp> }`. |
| `invoice.payment_failed` | Looks up the user by `stripeCustomerId` (`.where('stripeCustomerId', '==', customerId)`). If found, writes `{ stripePaymentFailed: true }`. Note: does **not** flip `pro` to `false` — only records the flag. |
| default | `console.log` of "Unhandled event type" and continues. |

**Things the webhook code is missing:**
- It never downgrades `pro` on `invoice.payment_failed` — the user keeps Pro access until the subscription actually transitions to `past_due`/`cancelled` through a separate `customer.subscription.updated` or `.deleted` event.
- It does not handle `invoice.paid`, `customer.subscription.created` (relies solely on `checkout.session.completed` for the initial upgrade, which is fine for Checkout but not for portal/Billing-initiated flows).
- `req.rawBody` assumes Firebase's v2 https wrapper preserves the raw bytes. Firebase Functions v2 `onRequest` does preserve `req.rawBody`, so this is correct, but it relies on Stripe hitting the function directly (no Express body-parser in front of it).

The webhook itself is fully wired in code — what is **not** in place is a `STRIPE_WEBHOOK_SECRET` env var in the deployed runtime, so even if Stripe started posting events, signature verification would throw.

---

## 6. Firestore user doc schema for subscription state

There is **no separate `subscriptions/{uid}` collection**. All subscription state is denormalized onto the user doc at `users/{uid}`.

**Initial schema written at sign-up** (`src/hooks/useAuth.jsx` lines 32–40):
```js
{
  email,
  name,
  photoURL,
  pro: false,
  onboardingDone: false,
  followedTeams: {},
  createdAt: <serverTimestamp>,
}
```

**Additional fields the Stripe paths read or write** (from `functions/src/stripe.js`):

| Field | Written by | Purpose |
|---|---|---|
| `pro` (boolean) | Webhook on `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted` | Single source of truth for entitlement. |
| `stripeCustomerId` (string) | `createCheckoutSession` on first checkout (line 76); re-confirmed by webhook on line 137 | Used both by `createPortalSession` (line 233) and for `invoice.payment_failed` lookups (line 182). |
| `stripeSubscriptionId` (string) | Webhook on `checkout.session.completed` (line 136) | Not read anywhere else in the codebase — written but unused. |
| `stripeSubscriptionStatus` (string) | Webhook on `customer.subscription.updated` (line 154) and `.deleted` (line 168; hard-coded to `'cancelled'`) | Not read anywhere else — informational. |
| `proPlan` ('monthly' \| 'annual') | Webhook on `checkout.session.completed` (line 138; inferred from `session.amount_total === 7999`) | Not read anywhere else. |
| `proSince` (ISO string) | Webhook on `checkout.session.completed` (line 139) | Not read anywhere else. |
| `proCancelledAt` (ISO string) | Webhook on `customer.subscription.deleted` (line 169) | Not read anywhere else. |
| `stripePaymentFailed` (boolean) | Webhook on `invoice.payment_failed` (line 188) | Not read anywhere else — no dunning UI is driven off this yet. |

**Fields the user doc does NOT have** that are commonly useful: `subscriptionTier` (only the binary `pro` exists), `currentPeriodEnd`, `cancelAtPeriodEnd`, `trialEnd`, `paymentMethodBrand`/`last4`. None of these are written or read.

**A quick consistency note:** `useAuth.jsx` sets the initial doc with `setDoc` (non-merging) when the doc doesn't exist, but never re-initializes Stripe-related fields. This is fine — those fields only appear after a successful checkout. However, `useAuth` uses `setDoc(ref, {...})` (line 32) rather than `setDoc(..., { merge: true })`, so a race in which the webhook writes first and then the auth listener creates the user doc could theoretically clobber Stripe fields. Very unlikely but worth flagging.

---

## 7. Stripe Customer Portal — manage subscription

Yes, the portal is wired up on both ends.

**UI:** `src/components/shared.jsx` lines 545–557 render a "Manage Subscription" button inside the Go Pro modal when `pro === true`. It calls `handleManageSubscription` defined on lines 518–536.

**Backend:** `createPortalSession` Cloud Function in `functions/src/stripe.js` lines 210–249. It:
1. Requires POST (405 otherwise).
2. Reads `{ uid }` from the body.
3. Looks up `users/{uid}.stripeCustomerId`. If the user has no `stripeCustomerId`, returns 400 `"No Stripe customer found for this user"`.
4. Calls `stripe.billingPortal.sessions.create({ customer: customerId, return_url: APP_URL })` and returns `{ url }`.

`APP_URL` is hard-coded to `'https://creasefeed.web.app'` at the top of the file (line 26). That means even though the app may be served from `creasefeed.com`, the portal return URL sends users back to the `*.web.app` hostname.

---

## 8. Dependencies

**Backend (`functions/package.json`):**
- `stripe`: `^14.0.0` — present. The installed version (per `functions/node_modules/stripe/package.json` / package-lock) resolves to `14.25.0`.
- No `firebase-functions/secrets` helper is imported; the code just reads `process.env.*`.

**Frontend (`package.json`):**
- No `@stripe/stripe-js`.
- No `stripe` of any kind.
- No Stripe Elements library.

This is actually fine given the chosen architecture — the frontend only does a full-page redirect to `data.url` (Stripe-hosted Checkout) rather than mounting Stripe Elements in-app, so it doesn't need a client SDK. It does mean that if you ever want embedded Checkout, an in-page payment form, Apple Pay express, or Stripe.js tokenization, you'd need to add `@stripe/stripe-js`.

Confirmed by directory check: `node_modules/@stripe` does not exist in the frontend project.

---

## 9. Stripe keys / secrets — references and expected storage

**References in the codebase (excluding node_modules):**

- `functions/src/stripe.js` line 45: `new Stripe(process.env.STRIPE_SECRET_KEY, ...)`
- `functions/src/stripe.js` line 111: same, in `stripeWebhook`
- `functions/src/stripe.js` line 114: `process.env.STRIPE_WEBHOOK_SECRET`
- `functions/src/stripe.js` line 223: `new Stripe(process.env.STRIPE_SECRET_KEY, ...)` in `createPortalSession`
- `functions/src/stripe.js` lines 56–57: `STRIPE_PRICE_ANNUAL` / `STRIPE_PRICE_MONTHLY`
- The header comment at `functions/src/stripe.js` lines 11–15 documents them and explicitly says *"Environment variables (set via Firebase secrets)"*.

**`STRIPE_PUBLISHABLE_KEY` is not referenced anywhere in the code** — grep returns zero hits outside of vendor directories. There is no `VITE_STRIPE_PUBLISHABLE_KEY` in `.env` or `.env.example` either. Because the checkout flow is a server-side redirect, no publishable key is strictly required today; it would only be needed if you added Stripe.js on the frontend.

**Where they are expected to live:**
The comment says "set via Firebase secrets" — i.e., the intent is Google Secret Manager, surfaced into functions via the `secrets:` option or `defineSecret`. However, the actual `onRequest({...})` config blocks for `createCheckoutSession`, `stripeWebhook`, and `createPortalSession` do NOT include a `secrets: [...]` array. They rely on Firebase's ambient `process.env.*`, which is how `firebase functions:config:set` used to work in v1, or how `.env` files in the functions directory work in v2. There is no `.env` in `functions/`, no `firebase functions:secrets:set` has been run (there's no way to prove this from the code, but the absence of `defineSecret` / `secrets:` means even if you ran the command, the function would not be allowed to read it).

**Net:** the intended storage mechanism is ambiguous in the code itself. To make any of these values actually reach the runtime, you'll need either `firebase functions:secrets:set STRIPE_SECRET_KEY` plus wiring through `defineSecret` + the `secrets:` option in each `onRequest`, or a `functions/.env` file with the four keys (simpler, works with `process.env` directly).

---

## 10. Environment variable names for Monthly and Annual prices

From `functions/src/stripe.js` lines 54–57:

- Monthly → `STRIPE_PRICE_MONTHLY`
- Annual → `STRIPE_PRICE_ANNUAL`

And the full set the backend expects (same file, comment on lines 11–15):

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_MONTHLY`
- `STRIPE_PRICE_ANNUAL`

No other config keys, no constants-file alternative, no Firestore config doc — these four env vars are the only configuration surface.

---

## Summary

Of the full Stripe integration (products → checkout → webhooks → subscription state → portal), here's what exists, here's what's stubbed, and here's what's missing entirely. **What exists and is fully written in code:** the Go Pro UI (auth modal, navbar CTAs, My Feed upgrade card, Scores page sidebar, onboarding limit banner), the client-side 2-team follow gate, a live Firestore `onSnapshot` listener that pushes `pro` changes to the UI instantly, the `createCheckoutSession` Cloud Function with Stripe Customer auto-creation and a `firebaseUid` metadata tag, the `stripeWebhook` function with handlers for `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, and `invoice.payment_failed`, and the `createPortalSession` function plus its "Manage Subscription" UI button. The `stripe@^14.0.0` npm package is installed in `functions/`. **What is stubbed / half-done:** the user doc has denormalized Stripe fields (`stripeCustomerId`, `stripeSubscriptionId`, `stripeSubscriptionStatus`, `proPlan`, `proSince`, `proCancelledAt`, `stripePaymentFailed`) that are written by the webhook but not read by any UI — no billing details screen, no "Payment failed, please update your card" dunning UI; `invoice.payment_failed` records a flag but does not revoke Pro; there's no server-side enforcement of the 2-team limit in `firestore.rules`; the onboarding "Upgrade" call-to-action text is a static `<span>` (line 202–204) rather than a button wired to `onAuthClick('pro')`. **What is missing entirely:** no Stripe Products/Prices have been created in the Stripe Dashboard (or if they have, their IDs aren't configured); `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_MONTHLY`, and `STRIPE_PRICE_ANNUAL` are not present in any runtime (no `functions/.env`, no `defineSecret` wiring, no `secrets:` option on the function declarations) — this is the direct cause of the `"Stripe price not configured"` error; the Stripe webhook endpoint has not been registered in the Stripe Dashboard (no way to verify from code, but its secret would be unusable anyway); there is no frontend `@stripe/stripe-js` (fine for server-redirect Checkout, required only if embedded Elements are ever added); and there is no `STRIPE_PUBLISHABLE_KEY` anywhere in the codebase. In practical terms the plumbing is fully built end-to-end, and the single blocking gap before a real payment can flow is creating the Products/Prices in Stripe, adding the four environment variables to the Cloud Functions runtime, and registering the webhook endpoint with Stripe.
