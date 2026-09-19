# Subscriptions — setup and how it works

Unlimited sending, billed through PayPal Subscriptions. Everything is built and
compiles; the steps in **Setup** are the parts only you can do, and **none of
it works until they're done** — until then the Unlock button reports that
subscriptions are unavailable rather than pretending to take a payment.

---

## What is actually sold

**Unlimited messages.** Nothing else.

The time-capsule perk was deliberately left out. The lock is drawn in the
browser (`isLocked = openDate > new Date()` in the message component) and
`public_messages` allows `get, list: if true`, so a sealed message's text is
*already* readable by anyone who calls the Firestore REST API. Selling early
access would have meant charging for something free, and — if it meant other
people's capsules — breaking a promise the Terms and Privacy Policy now make to
senders.

Worth knowing either way: the free limit is enforced in `localStorage`, so a
private window resets it. The subscription sells convenience, not an
unbreakable wall. Don't market it as one.

---

## How it fits together

```
Send form, cooldown showing
   └─ "Unlock" → UpgradeDialog
        ├─ anonymous / signed out → /auth?next=/upgrade → back to /upgrade
        └─ has an account
             └─ POST /api/billing/create-subscription   (Firebase ID token)
                  → PayPal approval page
                       ├─ approved  → /billing/return
                       └─ cancelled → /billing/cancelled

PayPal ──webhook──▶ /api/paypal/webhook
                      ├─ verify signature with PayPal
                      ├─ re-read subscription from PayPal
                      └─ write subscribers/{uid}   (Admin SDK)

Browser ──onSnapshot──▶ subscribers/{uid} → useSubscription() → limit lifted
```

Two properties are load-bearing:

**Entitlements live in `subscribers/{uid}`, not `users/{uid}`.** The `users`
rule is `allow read, write: if isOwner(userId)` — an owner can write their own
document, so a flag there could be self-granted from the browser console.
`subscribers` is `allow get: if isOwner(uid)` with all writes denied, and only
the Admin SDK (which bypasses rules) can set it.

**The webhook verifies the signature and re-reads from PayPal.** The URL is
public, so an unverified handler would let anyone POST themselves a
subscription. Status comes from a fresh `GET /v1/billing/subscriptions/{id}`
rather than the event body, so a replayed event can't re-activate a cancelled
account.

---

## Setup

### 1. Firebase service account

Firebase Console → Project settings → Service accounts → **Generate new private
key**. Set the whole JSON as one line:

```
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"...", ...}
```

This is a full-admin credential. Server-side only — never `NEXT_PUBLIC_`.

### 2. PayPal app and plan

1. [PayPal Developer](https://developer.paypal.com/dashboard/) → **Apps &
   Credentials** → create a REST app → copy client ID and secret.
2. **Products** → create a product (type: *Digital*), then a **Plan** with your
   price and billing cycle. Copy the plan ID (`P-...`).
3. Start in **Sandbox**. Switch `PAYPAL_ENV=live` only after a sandbox run.

### 3. Webhook

In your PayPal app → **Webhooks** → Add:

- URL: `https://messageinabottle.sbs/api/paypal/webhook`
- Events: all four `BILLING.SUBSCRIPTION.*` — **ACTIVATED**, **CANCELLED**,
  **SUSPENDED**, **EXPIRED**

Copy the generated webhook ID into `PAYPAL_WEBHOOK_ID`. Without it every
webhook is rejected, by design.

### 4. Environment variables

Set all of these in Vercel → Settings → Environment Variables. See
`.env.example`.

```
PAYPAL_ENV, PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET,
PAYPAL_PLAN_ID, PAYPAL_WEBHOOK_ID, FIREBASE_SERVICE_ACCOUNT
```

### 5. Deploy the rules

The new `subscribers` block must be live or the app cannot read entitlements:

```bash
npx firebase deploy --only firestore:rules
```

### 6. Test in sandbox

Use a sandbox buyer account, subscribe, and confirm `subscribers/{uid}` appears
with `active: true`. Then cancel from PayPal and confirm it flips to `false`.

---

## Not yet verified

I could not run the payment flow — it needs your PayPal credentials and a
sandbox buyer account, which only you can create. What *is* verified: the
project builds, all routes compile and register, and the new code introduces no
type errors. The PayPal request/response shapes follow the v1 Subscriptions and
webhook-verification APIs, but **treat the first sandbox run as the real
test.**

Worth checking on that run:

- The approval redirect lands on `/billing/return` and it flips to "You're all
  set" on its own within a few seconds.
- `subscribers/{uid}.active` is `true`.
- The cooldown notice disappears from the send form.
- Cancelling in PayPal flips `active` to `false` and the limit returns.

---

## Things to decide

- **Price and cycle** live in the PayPal plan, not in this code. The dialog
  deliberately quotes no figure, so changing the plan needs no deploy — but it
  also means the price is only visible on PayPal's page. Tell me if you'd
  rather show it in the dialog.
- **Refunds and cancellation** are handled entirely in PayPal. Your Terms
  don't mention subscriptions yet; if you're charging, that section should say
  what happens on cancellation and whether refunds are offered. Consumer law in
  the EU and UK also expects a withdrawal period. Worth adding before going
  live.
- **A server-side send limit.** The cooldown is still client-side for everyone.
  If subscriptions get real uptake, enforcing it server-side is what makes the
  free tier meaningful.
