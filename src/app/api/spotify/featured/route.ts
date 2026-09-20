import { NextResponse } from 'next/server';
import { spotifyGet, spotifyBodySnippet } from '@/lib/spotify';

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

interface FeaturedTrack {
  id: string;
  name: string;
  artist: string;
  albumArt: string;
}

// Module-level cache — survives across requests within the same server process.
// This means after the first request on a cold start, subsequent requests within
// the same process window are served instantly from memory.
let cachedTracks: FeaturedTrack[] | null = null;
let cacheExpiresAt = 0;
const PROCESS_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * How many track lookups run at once.
 *
 * See the note on fetchFeaturedTracks: these are now one request per track
 * rather than one for the set, so they are throttled to stay well clear of
 * Spotify's rate limiter. Twenty-two requests at six at a time is four rounds,
 * which happens once a day per server process.
 */
const CONCURRENCY = 6;

function mapTrack(track: any): FeaturedTrack | null {
  if (!track?.id) return null;
  return {
    id: track.id,
    name: track.name ?? 'Unknown track',
    artist: Array.isArray(track.artists)
      ? track.artists.map((a: any) => a?.name).filter(Boolean).join(', ')
      : '',
    albumArt: track.album?.images?.[0]?.url || '',
  };
}

/**
 * Fetches the featured set one track at a time.
 *
 * This used to be a single call to `/v1/tracks?ids=…`, which is the obvious way
 * to do it and was the cause of the empty song list: that endpoint answers 403
 * Forbidden for this app, while `/v1/tracks/{id}` and `/v1/search` both answer
 * 200 with the very same token. Verified directly against the API — it is a
 * restriction on the batch endpoint, not a bad credential.
 *
 * One failed track is skipped rather than failing the whole list. A song being
 * pulled from Spotify in one region should cost you that song, not the picker.
 */
async function fetchFeaturedTracks(): Promise<{
  tracks: FeaturedTrack[];
  failures: number;
}> {
  const collected: FeaturedTrack[] = [];
  let failures = 0;

  for (let i = 0; i < FEATURED_TRACK_IDS.length; i += CONCURRENCY) {
    const batch = FEATURED_TRACK_IDS.slice(i, i + CONCURRENCY);
    const settled = await Promise.all(
      batch.map(async (id) => {
        try {
          const res = await spotifyGet(`tracks/${encodeURIComponent(id)}`);
          if (!res.ok) {
            console.error('Spotify track lookup failed', {
              id,
              status: res.status,
              body: spotifyBodySnippet(res.text, 120),
            });
            return null;
          }
          return mapTrack(res.json);
        } catch (e) {
          console.error('Spotify track lookup threw', { id, error: e });
          return null;
        }
      })
    );

    for (const track of settled) {
      if (track) collected.push(track);
      else failures += 1;
    }
  }

  return { tracks: collected, failures };
}

function cachedResponse(tracks: FeaturedTrack[], cacheState: string) {
  const response = NextResponse.json({ tracks });
  response.headers.set(
    'Cache-Control',
    'public, s-maxage=86400, stale-while-revalidate=86400'
  );
  response.headers.set('X-Cache', cacheState);
  return response;
}

export async function GET() {
  try {
    // Serve from process-level cache if still fresh
    if (cachedTracks && Date.now() < cacheExpiresAt) {
      return cachedResponse(cachedTracks, 'HIT');
    }

    const { tracks, failures } = await fetchFeaturedTracks();

    // Nothing came back at all: the token or the API is the problem, not the
    // individual songs. Say so rather than caching an empty list for a day.
    if (tracks.length === 0) {
      if (cachedTracks) return cachedResponse(cachedTracks, 'STALE');
      return NextResponse.json(
        {
          error:
            'Could not load featured songs from Spotify. Search still works.',
        },
        { status: 502 }
      );
    }

    if (failures > 0) {
      console.warn(
        `Featured songs: ${failures} of ${FEATURED_TRACK_IDS.length} tracks unavailable.`
      );
    }

    // Update process-level cache
    cachedTracks = tracks;
    cacheExpiresAt = Date.now() + PROCESS_CACHE_TTL;

    return cachedResponse(tracks, 'MISS');
  } catch (error) {
    console.error('Server-side error in /api/spotify/featured:', error);
    // Serve stale cache on error if available
    if (cachedTracks) return cachedResponse(cachedTracks, 'STALE-ERROR');
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown server error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
