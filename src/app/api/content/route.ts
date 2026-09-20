import { NextResponse } from 'next/server';
import { getContent } from '@/lib/content';

/**
 * GET /api/content
 *
 * Exposes site-content.json over HTTP.
 *
 * The web app reads this file directly from disk in a server component, which
 * the mobile app obviously cannot do. Rather than duplicating all 79 strings
 * and image URLs into the React Native bundle — where they would immediately
 * drift from whatever the admin panel last saved — mobile fetches them from
 * here. One source of truth, edited in one place.
 *
 * Everything served is already public: it is the copy and imagery rendered on
 * the marketing pages. No secrets, no per-user data, so no auth.
 */
export const revalidate = 3600;

export async function GET() {
  try {
    const content = await getContent();
    return NextResponse.json(content, {
      headers: {
        // Long shared cache; the CMS changes rarely and `getContent` already
        // falls back to built-in defaults if the file is unreadable.
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        // Consumed by the native app, which is not same-origin.
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Failed to serve site content:', error);
    return NextResponse.json(
      { error: 'Unable to load site content' },
      { status: 500 }
    );
  }
}
