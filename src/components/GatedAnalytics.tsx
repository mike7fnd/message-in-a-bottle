'use client';

import { Analytics } from '@vercel/analytics/next';
import { useConsent } from '@/components/ConsentProvider';

/**
 * Vercel Analytics, mounted only after the visitor opts into the analytics
 * category. Before that the script is never injected, so no page view is
 * recorded and no identifier is stored.
 */
export function GatedAnalytics() {
  const { analyticsAllowed } = useConsent();
  if (!analyticsAllowed) return null;
  return <Analytics />;
}
