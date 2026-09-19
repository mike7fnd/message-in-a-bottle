/**
 * Central site / compliance configuration.
 *
 * Every deployment-specific value is read from an environment variable with a
 * production default, so nothing here is a secret and nothing is invented.
 *
 * Environment variables (set these in Vercel → Project → Settings → Environment Variables):
 *
 *   NEXT_PUBLIC_SITE_URL          canonical origin, no trailing slash
 *   NEXT_PUBLIC_ADSENSE_CLIENT_ID AdSense publisher id, format "ca-pub-XXXXXXXXXXXXXXXX".
 *                                 Leave UNSET to disable all ad code and the
 *                                 google-adsense-account meta tag.
 *   NEXT_PUBLIC_CONTACT_EMAIL     public contact address
 *   NEXT_PUBLIC_SITE_OPERATOR     the natural person / entity operating the site
 *   IPAPI_KEY                     server-only key for the ip-api.com geo lookup.
 *                                 Leave UNSET to disable country/city analytics.
 */

function trimTrailingSlash(url: string) {
  return url.replace(/\/+$/, '');
}

export const siteConfig = {
  name: 'Message in a Bottle',
  shortName: 'MiaB',
  /** Canonical origin. The www host 308-redirects here (see next.config.ts). */
  url: trimTrailingSlash(
    process.env.NEXT_PUBLIC_SITE_URL || 'https://messageinabottle.sbs'
  ),
  description:
    'Write an anonymous message, address it to a name, and it drifts into a public ocean of letters that anyone can read.',
  /** The individual who builds and operates the site. */
  operator: process.env.NEXT_PUBLIC_SITE_OPERATOR || 'Mike Fernandez',
  /** Jurisdiction whose law governs the Terms. */
  jurisdiction: 'Republic of the Philippines',
  contactEmail:
    process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'mikefernandex227@gmail.com',
  social: {
    tiktok: 'https://www.tiktok.com/@dvbmke',
    instagram: 'https://www.instagram.com/dvbmike',
  },
  /** PayPal link used on the donate page. */
  donateUrl: 'https://paypal.me/MikeFernandez255',
} as const;

// ── AdSense ──────────────────────────────────────────────────────────────────

/**
 * AdSense publisher id. Undefined when unset, which makes every ad component
 * and the AdSense script render nothing at all.
 */
export const ADSENSE_CLIENT_ID =
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID?.trim() || undefined;

/** True only when a syntactically valid publisher id is configured. */
export const isAdsenseConfigured = Boolean(
  ADSENSE_CLIENT_ID && /^ca-pub-\d{16}$/.test(ADSENSE_CLIENT_ID)
);

/**
 * Ad slot ids, supplied per-unit from the AdSense dashboard. A slot that is not
 * configured renders nothing — no empty container, no placeholder.
 */
export const AD_SLOTS = {
  browseFeed: process.env.NEXT_PUBLIC_ADSENSE_SLOT_BROWSE_FEED?.trim() || undefined,
  messageBelow: process.env.NEXT_PUBLIC_ADSENSE_SLOT_MESSAGE_BELOW?.trim() || undefined,
  aboutFooter: process.env.NEXT_PUBLIC_ADSENSE_SLOT_ABOUT_FOOTER?.trim() || undefined,
} as const;

// ── Legal document dates ─────────────────────────────────────────────────────
// Static, so the "last updated" line reflects when the text actually changed
// rather than today's date. Update by hand when you edit a policy.

export const POLICY_LAST_UPDATED = 'September 19, 2026';

// ── Analytics ────────────────────────────────────────────────────────────────

/** Country/city visit analytics only run when a geo key is configured. */
export const isGeoAnalyticsConfigured = Boolean(process.env.IPAPI_KEY);
