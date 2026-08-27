import { type NextRequest, NextResponse } from 'next/server';
import { addVisit } from '@/lib/data';

/**
 * POST /api/track-visit
 *
 * Responds to the client immediately (zero user-perceived latency) then performs
 * the geo-IP lookup and Firestore write in the background.
 *
 * Previously the handler awaited both external calls before responding, which
 * added ~200–500 ms to the user's page load just for analytics.
 */
export async function POST(request: NextRequest) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    '127.0.0.1';

  // Respond to the client immediately — don't make them wait for analytics
  const res = NextResponse.json({ success: true }, { status: 200 });
  res.headers.set('Cache-Control', 'no-store');

  // Run the heavy work after the response is sent.
  // On Vercel, waitUntil keeps the serverless function alive long enough to finish.
  // On other runtimes we fall back to a detached promise (best-effort).
  const trackingWork = (async () => {
    try {
      const geoResponse = await fetch(
        `https://pro.ip-api.com/json/${ip}?key=F3hV8B0sD6pE1kS&fields=status,message,country,city`,
        // Short timeout so a slow geo service doesn't hang the function
        { signal: AbortSignal.timeout(4000) }
      );

      if (!geoResponse.ok) {
        await addVisit('Unknown', 'Unknown');
        return;
      }

      const geoData = await geoResponse.json();

      if (geoData.status === 'success') {
        await addVisit(geoData.country || 'Unknown', geoData.city || 'Unknown');
      } else {
        await addVisit('Unknown', 'Unknown');
      }
    } catch (err) {
      // Best-effort — a failed geo lookup should never surface to the user
      console.warn('[track-visit] background tracking failed:', err);
      try {
        await addVisit('Unknown', 'Unknown');
      } catch {
        // Give up silently
      }
    }
  })();

  // Use Vercel's waitUntil if available, otherwise let the promise run detached
  if (
    typeof globalThis !== 'undefined' &&
    'waitUntil' in (globalThis as any)
  ) {
    (globalThis as any).waitUntil(trackingWork);
  }
  // In all cases the promise is already running — return the response now
  return res;
}
