import { NextResponse } from 'next/server';
import {
  isAdminConfigured,
  verifyCaller,
} from '@/lib/server/firebase-admin';
import { createSubscription, isPaypalConfigured } from '@/lib/server/paypal';
import { siteConfig } from '@/lib/site-config';

export const dynamic = 'force-dynamic';

/**
 * POST /api/billing/create-subscription
 *
 * Starts a PayPal subscription for the signed-in account and returns the URL
 * to send them to for approval.
 *
 * The caller is identified from a verified Firebase ID token, never from the
 * request body — the uid ends up in PayPal's `custom_id`, and the webhook
 * trusts it to decide who gets access.
 */
export async function POST(request: Request) {
  if (!isAdminConfigured() || !isPaypalConfigured()) {
    return NextResponse.json(
      { error: 'Subscriptions are not available right now.' },
      { status: 503 }
    );
  }

  const caller = await verifyCaller(request);
  if (!caller) {
    return NextResponse.json({ error: 'Please sign in first.' }, { status: 401 });
  }

  // Every visitor is signed in anonymously, so a token alone is not an
  // account. A subscription has to attach to something they can sign back
  // into, or they lose it the moment they clear their browser.
  if (caller.isAnonymous) {
    return NextResponse.json(
      { error: 'Create an account before subscribing.', code: 'needs-account' },
      { status: 403 }
    );
  }

  try {
    const { approveUrl, id } = await createSubscription({
      uid: caller.uid,
      email: caller.email,
      returnUrl: `${siteConfig.url}/billing/return`,
      cancelUrl: `${siteConfig.url}/billing/cancelled`,
    });

    return NextResponse.json(
      { approveUrl, subscriptionId: id },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err) {
    console.error('create-subscription failed:', err);
    // Deliberately generic — PayPal errors can carry account details.
    return NextResponse.json(
      { error: 'Could not start the subscription. Please try again.' },
      { status: 502 }
    );
  }
}
