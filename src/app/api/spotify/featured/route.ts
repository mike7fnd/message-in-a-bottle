import { NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/spotify';

// No static revalidate here — this is an API route with a module-level process cache.
// The Cache-Control header on the response handles CDN/browser caching.

const FEATURED_TRACK_IDS = [
  "3AJwUDP919kvQ9QcozQPxg", // Yellow - Coldplay
  "0ug5NqcwcFR2xrfTkc7k8e", // Style - Taylor Swift
  "4m0q0xQ2BNl9SCAGKyfiGZ", // Somebody Else - The 1975
  "71BqAINEnezjQfxE4VuJfq", // Slut! - Taylor Swift
  "0W0iAC1VGlB82PI6elxFYf", // Guilty as Sin? - Taylor Swift
  "4nyY8oVjbX2d4qzlpiVM5n", // Ruin My Life - Zara Larsson
  "410fyfFghBsxNu45LiNJ24", // Pagibig ay Kanibalismo
  "1udOOSbJnytCdgvbgYOF5s", // Kalapastanganan
  "3A02hWQ2ebOFDWSbAMNnpw", // bittersweet
  "1qbmS6ep2hbBRaEZFpn7BX", // Man I Need
  "6DH13QYXK7lKkYHSU88N48", // Who Knows
  "6Qyc6fS4DsZjB2mRW9DsQs", // Iris - The Goo Goo Dolls
  "2btKtacOXuMtC9WjcNRvAA", // ILYSB - LANY
  "4eWQlBRaTjPPUlzacqEeoQ", // Never Be The Same - Camila Cabello
  "7JIuqL4ZqkpfGKQhYlrirs", // The Only Exception - Paramore
  "6rY5FAWxCdAGllYEOZMbjW", // Slow Dancing in the Dark - Joji
  "3T9CfDxFYqZWSKxd0BhZrb", // Wait - Maroon 5
  "5II8XNTmGAsegdcYFplDfN", // Statue - Lil Eddie
  "3hEfpBHxgieRLz4t3kLNEg", // About You - The 1975
  "3qhlB30KknSejmIvZZLjOD", // End of Beginning - Djo
  "4LRPiXqCikLlN15c3yImP7", // As It Was - Harry Styles
  "0VjIjW4GlUZAMYd2vXMi3b", // Blinding Lights - The Weeknd
];

// Module-level cache — survives across requests within the same server process.
// This means after the first request on a cold start, subsequent requests within
// the same process window are served instantly from memory.
let cachedTracks: unknown[] | null = null;
let cacheExpiresAt = 0;
const PROCESS_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export async function GET() {
  try {
    // Serve from process-level cache if still fresh
    if (cachedTracks && Date.now() < cacheExpiresAt) {
      const response = NextResponse.json({ tracks: cachedTracks });
      response.headers.set('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=86400');
      response.headers.set('X-Cache', 'HIT');
      return response;
    }

    const token = await getAccessToken();
    const trackIds = FEATURED_TRACK_IDS.join(',');

    const tracksResponse = await fetch(
      `https://api.spotify.com/v1/tracks?ids=${trackIds}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!tracksResponse.ok) {
      const errorData = await tracksResponse.json();
      console.error('Spotify API Error fetching tracks:', errorData);
      // If we have a stale process cache, serve it rather than erroring
      if (cachedTracks) {
        const response = NextResponse.json({ tracks: cachedTracks });
        response.headers.set('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=86400');
        response.headers.set('X-Cache', 'STALE');
        return response;
      }
      return NextResponse.json(
        { error: 'Failed to fetch featured tracks from Spotify.' },
        { status: tracksResponse.status }
      );
    }

    const tracksData: any = await tracksResponse.json();

    const tracks = tracksData.tracks.map((track: any) => ({
      id: track.id,
      name: track.name,
      artist: track.artists.map((artist: any) => artist.name).join(', '),
      albumArt: track.album.images[0]?.url || '',
    }));

    // Update process-level cache
    cachedTracks = tracks;
    cacheExpiresAt = Date.now() + PROCESS_CACHE_TTL;

    const response = NextResponse.json({ tracks });
    response.headers.set('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=86400');
    response.headers.set('X-Cache', 'MISS');
    return response;

  } catch (error) {
    console.error('Server-side error in /api/spotify/featured:', error);
    // Serve stale cache on error if available
    if (cachedTracks) {
      const response = NextResponse.json({ tracks: cachedTracks });
      response.headers.set('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=86400');
      response.headers.set('X-Cache', 'STALE-ERROR');
      return response;
    }
    const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
