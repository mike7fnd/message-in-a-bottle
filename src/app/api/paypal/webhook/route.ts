import { NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { adminDb, isAdminConfigured } from '@/lib/server/firebase-admin';
import {
  getSubscription,
  isPaypalConfigured,
  verifyWebhookSignature,
} from '@/lib/server/paypal';

export const dynamic = 'force-dynamic';

/**
 * POST /api/paypal/webhook
 *
 * The only thing that grants or revokes paid access.
 *
 * Two rules it follows, both load-bearing:
 *  1. Nothing is trusted until PayPal confirms the signature. This URL is
 *     public, so without that check anyone could POST themselves a
 *     subscription.
 *  2. Status is read back from PayPal rather than taken from the payload, so
 *     a replayed or stale event cannot re-activate a cancelled account.
 */

/** PayPal subscription states that should unlock unlimited sending. */
const ACTIVE_STATES = new Set(['ACTIVE']);

export async function POST(request: Request) {
  if (!isAdminConfigured() || !isPaypalConfigured()) {
    // 503 rather than 200: PayPal will retry once configuration is fixed.
    return NextResponse.json({ error: 'Not configured' }, { status: 503 });
  }

  // Must read the raw text: verification runs over the bytes as received.
  const raw = await request.text();

  const verified = await verifyWebhookSignature(request.headers, raw);
  if (!verified) {
    console.warn('Rejected an unverified PayPal webhook.');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let event: {
    event_type?: string;
    resource?: { id?: string; custom_id?: string; status?: string };
  };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'Malformed body' }, { status: 400 });
  }

  const eventType = event.event_type ?? '';
  if (!eventType.startsWith('BILLING.SUBSCRIPTION.')) {
    // Acknowledge anything we don't act on, so PayPal stops retrying it.
    return NextResponse.json({ ok: true, ignored: eventType });
  }

  const subscriptionId = event.resource?.id;
  if (!subscriptionId) {
    return NextResponse.json({ error: 'No subscription id' }, { status: 400 });
  }

  try {
    // Source of truth, rather than the (possibly replayed) event payload.
    const subscription = await getSubscription(subscriptionId);
    const uid = subscription.custom_id ?? event.resource?.custom_id;

    if (!uid) {
      console.error(
        `Subscription ${subscriptionId} has no custom_id — cannot attribute it to an account.`
      );
      // 200 so PayPal stops retrying something retrying will never fix.
      return NextResponse.json({ ok: true, unattributed: true });
    }

    const isActive = ACTIVE_STATES.has(subscription.status);
    const nextBilling = subscription.billing_info?.next_billing_time;

    await adminDb()
      .collection('subscribers')
      .doc(uid)
      .set(
        {
          status: subscription.status,
          active: isActive,
          provider: 'paypal',
          subscriptionId,
          currentPeriodEnd: nextBilling
            ? Timestamp.fromDate(new Date(nextBilling))
            : null,
          updatedAt: Timestamp.now(),
          lastEvent: eventType,
        },
        { merge: true }
      );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('PayPal webhook processing failed:', err);
    // 500 asks PayPal to retry — the event was genuine, we just failed it.
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}
