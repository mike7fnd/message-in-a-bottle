import { ADSENSE_CLIENT_ID } from '@/lib/site-config';

/**
 * GET /ads.txt
 *
 * Served from a route handler rather than public/ads.txt so the publisher id
 * can never drift from the one in the page's verification meta tag and ad
 * units — all three read ADSENSE_CLIENT_ID.
 *
 * Requirements this satisfies: HTTP 200, text/plain, no authentication, no
 * client-side JavaScript, no HTML. It is statically generated at build time.
 *
 * The record below is the IAB-specified format:
 *   <ad system domain>, <publisher id>, <DIRECT|RESELLER>, <certification id>
 * f08c47fec0942fa0 is Google's own TAG certification id, identical for every
 * AdSense publisher — it is not a per-site secret.
 *
 * To add other ad systems later, append one record per line. If the publisher
 * id is unset (NEXT_PUBLIC_ADSENSE_CLIENT_ID=none) this returns 404 rather
 * than an empty or malformed file, which is what crawlers expect from a site
 * that has no authorized sellers.
 */

export const dynamic = 'force-static';

export function GET() {
  if (!ADSENSE_CLIENT_ID) {
    return new Response('Not found', {
      status: 404,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  const publisherId = ADSENSE_CLIENT_ID.replace(/^ca-/, '');
  const body = `google.com, ${publisherId}, DIRECT, f08c47fec0942fa0\n`;

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
