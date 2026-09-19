import 'server-only';

/**
 * PayPal Subscriptions — server only.
 *
 * Environment:
 *   PAYPAL_ENV            'sandbox' (default) or 'live'
 *   PAYPAL_CLIENT_ID      REST app client id
 *   PAYPAL_CLIENT_SECRET  REST app secret
 *   PAYPAL_PLAN_ID        the billing plan the subscribe button uses
 *   PAYPAL_WEBHOOK_ID     id of the webhook registered in the PayPal dashboard
 *
 * These are all secrets except PAYPAL_ENV — none may be prefixed NEXT_PUBLIC_.
 */

const PAYPAL_ENV = process.env.PAYPAL_ENV === 'live' ? 'live' : 'sandbox';

export const PAYPAL_API_BASE =
  PAYPAL_ENV === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

export function isPaypalConfigured(): boolean {
  return Boolean(
    process.env.PAYPAL_CLIENT_ID &&
      process.env.PAYPAL_CLIENT_SECRET &&
      process.env.PAYPAL_PLAN_ID
  );
}

// ── Access token ─────────────────────────────────────────────────────────────

let accessToken: string | null = null;
let tokenExpiresAt = 0;

async function getAccessToken(): Promise<string> {
  if (accessToken && Date.now() < tokenExpiresAt) return accessToken;

  const id = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!id || !secret) {
    throw new Error('PayPal credentials are not configured.');
  }

  const res = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`,
    },
    body: 'grant_type=client_credentials',
    cache: 'no-store',
  });

  const data = await res.json();
  if (!res.ok) {
    console.error('PayPal token error:', data);
    throw new Error('Could not authenticate with PayPal.');
  }

  accessToken = data.access_token as string;
  // Refresh a minute early so a request never races the expiry.
  tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;
  return accessToken;
}

// ── Subscriptions ────────────────────────────────────────────────────────────

export interface CreatedSubscription {
  id: string;
  /** Where to send the buyer to approve the subscription. */
  approveUrl: string;
}

/**
 * Creates a subscription in APPROVAL_PENDING state.
 *
 * `custom_id` carries the Firebase uid so the webhook can attribute the
 * subscription back to an account without trusting anything the browser says.
 */
export async function createSubscription(opts: {
  uid: string;
  email: string | null;
  returnUrl: string;
  cancelUrl: string;
}): Promise<CreatedSubscription> {
  const token = await getAccessToken();

  const res = await fetch(`${PAYPAL_API_BASE}/v1/billing/subscriptions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      // Guards against a double-click creating two subscriptions.
      'PayPal-Request-Id': `sub-${opts.uid}-${Date.now()}`,
    },
    body: JSON.stringify({
      plan_id: process.env.PAYPAL_PLAN_ID,
      custom_id: opts.uid,
      ...(opts.email ? { subscriber: { email_address: opts.email } } : {}),
      application_context: {
        brand_name: 'Message in a Bottle',
        user_action: 'SUBSCRIBE_NOW',
        shipping_preference: 'NO_SHIPPING',
        return_url: opts.returnUrl,
        cancel_url: opts.cancelUrl,
      },
    }),
    cache: 'no-store',
  });

  const data = await res.json();
  if (!res.ok) {
    console.error('PayPal create-subscription error:', data);
    throw new Error('Could not start the subscription.');
  }

  const approveUrl = (data.links as Array<{ rel: string; href: string }>)?.find(
    (l) => l.rel === 'approve'
  )?.href;

  if (!approveUrl) {
    throw new Error('PayPal did not return an approval link.');
  }

  return { id: data.id as string, approveUrl };
}

/** Reads a subscription back from PayPal — the source of truth for status. */
export async function getSubscription(subscriptionId: string) {
  const token = await getAccessToken();
  const res = await fetch(
    `${PAYPAL_API_BASE}/v1/billing/subscriptions/${encodeURIComponent(subscriptionId)}`,
    { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }
  );

  const data = await res.json();
  if (!res.ok) {
    console.error('PayPal get-subscription error:', data);
    throw new Error('Could not read the subscription.');
  }
  return data as {
    id: string;
    status: string;
    custom_id?: string;
    billing_info?: { next_billing_time?: string };
  };
}

// ── Webhook verification ─────────────────────────────────────────────────────

/**
 * Asks PayPal whether a webhook really came from PayPal.
 *
 * This is not optional. The webhook route grants paid access, so without
 * signature verification anyone who found the URL could POST themselves a
 * subscription. Returns false when unverified or misconfigured — never throws
 * a "pass" on error.
 */
export async function verifyWebhookSignature(
  headers: Headers,
  rawBody: string
): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) {
    console.error('PAYPAL_WEBHOOK_ID is not set — rejecting webhook.');
    return false;
  }

  const required = {
    auth_algo: headers.get('paypal-auth-algo'),
    cert_url: headers.get('paypal-cert-url'),
    transmission_id: headers.get('paypal-transmission-id'),
    transmission_sig: headers.get('paypal-transmission-sig'),
    transmission_time: headers.get('paypal-transmission-time'),
  };

  if (Object.values(required).some((v) => !v)) return false;

  try {
    const token = await getAccessToken();
    const res = await fetch(
      `${PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...required,
          webhook_id: webhookId,
          // Must be the parsed body, but built from the exact bytes received.
          webhook_event: JSON.parse(rawBody),
        }),
        cache: 'no-store',
      }
    );

    const data = await res.json();
    return res.ok && data.verification_status === 'SUCCESS';
  } catch (err) {
    console.error('Webhook verification failed:', err);
    return false;
  }
}
