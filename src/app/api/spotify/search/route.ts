import { NextRequest, NextResponse } from 'next/server';
import { spotifyGet, spotifyBodySnippet } from '@/lib/spotify';

// Process-level cache: query string → { tracks, expiresAt }
// Identical searches within the same server process cost zero Spotify API calls.
const searchCache = new Map<string, { tracks: unknown[]; expiresAt: number }>();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes
const MAX_CACHE_ENTRIES = 200;     // LRU-style cap

function pruneSearchCache() {
  if (searchCache.size <= MAX_CACHE_ENTRIES) return;
  // Delete the oldest 20% when over capacity
  const deleteCount = Math.floor(MAX_CACHE_ENTRIES * 0.2);
  let i = 0;
  for (const key of searchCache.keys()) {
    if (i++ >= deleteCount) break;
    searchCache.delete(key);
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  const cacheKey = query.toLowerCase().trim();

  // Serve from process cache if fresh
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    const res = NextResponse.json({ tracks: cached.tracks });
    res.headers.set('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=900');
    res.headers.set('X-Cache', 'HIT');
    return res;
  }

  try {
    // The process cache above handles dedup; spotifyGet sends no-store so
    // Next.js never mixes one query's response into another's.
    const searchResponse = await spotifyGet(
      `search?q=${encodeURIComponent(query)}&type=track&limit=10`
    );

    if (!searchResponse.ok) {
      console.error('Spotify API Error on search:', {
        status: searchResponse.status,
        // Read as text first: an upstream block page is not JSON, and parsing
        // it used to replace the real status with a parse error.
        body: spotifyBodySnippet(searchResponse.text, 120),
      });
      // Serve stale cache on Spotify error if available
      if (cached) {
        const res = NextResponse.json({ tracks: cached.tracks });
        res.headers.set('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=900');
        res.headers.set('X-Cache', 'STALE');
        return res;
      }
      return NextResponse.json(
        { error: 'Failed to search tracks on Spotify.' },
        { status: searchResponse.status }
      );
    }

    const items: any[] = searchResponse.json?.tracks?.items ?? [];
    const tracks = items
      .filter((track) => track?.id)
      .map((track: any) => ({
        id: track.id,
        name: track.name ?? 'Unknown track',
        artist: Array.isArray(track.artists)
          ? track.artists.map((a: any) => a?.name).filter(Boolean).join(', ')
          : '',
        albumArt: track.album?.images?.[0]?.url || '',
      }));

    // Update process cache
    searchCache.set(cacheKey, { tracks, expiresAt: Date.now() + CACHE_TTL });
    pruneSearchCache();

    const res = NextResponse.json({ tracks });
    res.headers.set('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=900');
    res.headers.set('X-Cache', 'MISS');
    return res;

  } catch (error) {
    console.error('Server-side error in /api/spotify/search:', error);
    if (cached) {
      const res = NextResponse.json({ tracks: cached.tracks });
      res.headers.set('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=900');
      res.headers.set('X-Cache', 'STALE-ERROR');
      return res;
    }
    const msg = error instanceof Error ? error.message : 'Unknown server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
