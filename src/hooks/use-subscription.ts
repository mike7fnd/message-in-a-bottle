'use client';

import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';

export interface SubscriptionState {
  /** True only while a verified PayPal subscription is active. */
  isSubscribed: boolean;
  /** Raw PayPal status, for display. */
  status: string | null;
  /** When the current paid period ends, if PayPal told us. */
  currentPeriodEnd: Date | null;
  isLoading: boolean;
}

/**
 * Reads the caller's entitlement from `subscribers/{uid}`.
 *
 * That document is written only by the PayPal webhook through the Admin SDK,
 * and the security rules make it read-only to clients — so unlike a flag on
 * `users/{uid}` (which the owner may write), it cannot be granted from the
 * browser console.
 *
 * Subscribed via `onSnapshot` rather than a one-off read so access appears the
 * moment the webhook lands, without the user refreshing after paying.
 */
export function useSubscription(): SubscriptionState {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const [state, setState] = useState<SubscriptionState>({
    isSubscribed: false,
    status: null,
    currentPeriodEnd: null,
    isLoading: true,
  });

  useEffect(() => {
    // Anonymous visitors can never hold a subscription — it is attached to an
    // account so it survives a cleared browser.
    if (isUserLoading) return;
    if (!user || user.isAnonymous) {
      setState({
        isSubscribed: false,
        status: null,
        currentPeriodEnd: null,
        isLoading: false,
      });
      return;
    }

    const ref = doc(firestore, 'subscribers', user.uid);
    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        const data = snap.data();
        setState({
          isSubscribed: data?.active === true,
          status: (data?.status as string) ?? null,
          currentPeriodEnd: data?.currentPeriodEnd?.toDate?.() ?? null,
          isLoading: false,
        });
      },
      (err) => {
        // A missing doc is the normal case for everyone who has not paid; a
        // real error just means no entitlement, never an accidental grant.
        console.error('Subscription lookup failed:', err);
        setState({
          isSubscribed: false,
          status: null,
          currentPeriodEnd: null,
          isLoading: false,
        });
      }
    );

    return () => unsubscribe();
  }, [user, isUserLoading, firestore]);

  return state;
}
