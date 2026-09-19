'use client';

import Script from 'next/script';
import { ADSENSE_CLIENT_ID, isAdsenseConfigured } from '@/lib/site-config';
import { useConsent } from '@/components/ConsentProvider';

/**
 * Loads the official Google AdSense tag.
 *
 * It is requested only when both are true:
 *   1. a valid publisher id is configured, and
 *   2. the visitor has consented to the advertising category.
 *
 * Until then the script is never fetched, so no ad cookie can be set. Loading
 * is deferred with `lazyOnload` so it never competes with first paint.
 */
export function AdSenseScript() {
  const { advertisingAllowed } = useConsent();

  if (!isAdsenseConfigured || !advertisingAllowed) return null;

  return (
    <Script
      id="google-adsense"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
      strategy="lazyOnload"
      crossOrigin="anonymous"
    />
  );
}
