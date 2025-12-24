
import { NextRequest, NextResponse } from 'next/server';
import fetch from 'node-fetch';
import { getAccessToken } from '@/lib/spotify';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json(
      { error: 'Query parameter is required' },
      { status: 400 }
    );
  }

  try {
    const token = await getAccessToken();
    const searchResponse = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(
        query
      )}&type=track&limit=10`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!searchResponse.ok) {
      const errorData = await searchResponse.json();
      console.error('Spotify API Error on search:', errorData);
      return NextResponse.json(
        { error: 'Failed to search tracks on Spotify.' },
        { status: searchResponse.status }
      );
    }
    
    const searchData: any = await searchResponse.json();
    
    const tracks = searchData.tracks.items.map((track: any) => ({
      id: track.id,
      name: track.name,
      artist: track.artists.map((artist: any) => artist.name).join(', '),
      albumArt: track.album.images[0]?.url || '',
    }));

    return NextResponse.json({ tracks });

  } catch (error) {
    console.error('Server-side error in /api/spotify/search:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
