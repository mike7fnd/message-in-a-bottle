'use client';

import { useEffect, useRef } from 'react';
import { ADSENSE_CLIENT_ID, isAdsenseConfigured } from '@/lib/site-config';
import { cn } from '@/lib/utils';

/**
 * A single Google AdSense display unit.
 *
 * Deliberate behaviour:
 *  - Renders absolutely nothing — no wrapper, no reserved box, no placeholder —
 *    unless a publisher id AND a slot id are configured. An unconfigured site
 *    shows no ad furniture at all.
 *  - Pushes to `adsbygoogle` exactly once per mount. There is no timer, no
 *    refresh, and no re-push on re-render, so no impression is ever
 *    manufactured.
 *  - Carries a visible "Advertisement" label, and the unit is always placed
 *    after the page's own content rather than beside navigation, so a click is
 *    never mistaken for a site control.
 */
export interface AdUnitProps {
  /** Slot id from the AdSense dashboard. */
  slot?: string;
  /** Maps to data-ad-format. `auto` is the responsive default. */
  format?: 'auto' | 'fluid' | 'rectangle' | 'horizontal' | 'vertical';
  /** Maps to data-ad-layout, used by in-article / in-feed units. */
  layout?: string;
  layoutKey?: string;
  /** Let the unit shrink below the container width. */
  fullWidthResponsive?: boolean;
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export function AdUnit({
  slot,
  format = 'auto',
  layout,
  layoutKey,
  fullWidthResponsive = true,
  className,
}: AdUnitProps) {
  const pushedRef = useRef(false);

  // Not gated on consent. Google's model is that the tag always loads and
  // Consent Mode decides whether ads are personalised — with ad_storage denied
  // AdSense still serves, just generically and without ad cookies. Withholding
  // the unit entirely would also hide the ad code from Google's own review.
  const enabled = isAdsenseConfigured && Boolean(slot);

  useEffect(() => {
    if (!enabled || pushedRef.current) return;
    pushedRef.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // The script may be blocked by an extension or still loading. Either way
      // this unit simply stays empty; nothing is retried or faked.
    }
  }, [enabled]);

  if (!enabled) return null;

  return (
    <aside
      className={cn('my-8 w-full overflow-hidden', className)}
      aria-label="Advertisement"
    >
      <p className="mb-1 text-center text-[11px] uppercase tracking-wide text-muted-foreground">
        Advertisement
      </p>
      <ins
        className="adsbygoogle block"
        style={{ display: 'block' }}
        data-ad-client={ADSENSE_CLIENT_ID}
        data-ad-slot={slot}
        data-ad-format={format}
        {...(layout ? { 'data-ad-layout': layout } : {})}
        {...(layoutKey ? { 'data-ad-layout-key': layoutKey } : {})}
        data-full-width-responsive={fullWidthResponsive ? 'true' : 'false'}
      />
    </aside>
  );
}

/** Responsive banner, for the end of a content column. */
export function AdBanner(props: Omit<AdUnitProps, 'format'>) {
  return <AdUnit {...props} format="auto" />;
}

/** In-article unit, for between blocks of reading content. */
export function AdInArticle(props: Omit<AdUnitProps, 'format' | 'layout'>) {
  return <AdUnit {...props} format="fluid" layout="in-article" />;
}

/** In-feed unit, for between items in a list. */
export function AdInFeed(props: Omit<AdUnitProps, 'format'>) {
  return <AdUnit {...props} format="fluid" />;
}
