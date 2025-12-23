
import { NextResponse } from 'next/server';
import fetch from 'node-fetch';
import { getAccessToken } from '@/lib/spotify';

const FEATURED_TRACK_IDS = [
    "3AJwUDP919kvQ9QcozQPxg", // Yellow - Coldplay
    "4m0q0xQ2BNl9SCAGKyfiGZ", // Somebody Else - The 1975
    "6Qyc6fS4DsZjB2mRW9DsQs", // Iris - The Goo Goo Dolls
    "2btKtacOXuMtC9WjcNRvAA", // ILYSB - LANY
    "7JIuqL4ZqkpfGKQhYlrirs", // The Only Exception - Paramore
    "6rY5FAWxCdAGllYEOZMbjW", // SLOW DANCING IN THE DARK - Joji
    "3T9CfDxFYqZWSKxd0BhZrb", // Wait - Maroon 5
    "5II8XNTmGAsegdcYFplDfN", // Statue - Lil Eddie
    "3hEfpBHxgieRLz4t3kLNEg", // About You - The 1975
    "3qhlB30KknSejmIvZZLjOD", // End of Beginning - Djo
    "4LRPiXqCikLlN15c3yImP7", // As It Was - Harry Styles
    "0VjIjW4GlUZAMYd2vXMi3b", // Blinding Lights - The Weeknd
];


export async function GET() {
  try {
    const token = await getAccessToken();
    const trackIds = FEATURED_TRACK_IDS.join(',');

    const tracksResponse = await fetch(
      `https://api.spotify.com/v1/tracks?ids=${trackIds}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!tracksResponse.ok) {
      const errorData = await tracksResponse.json();
      console.error('Spotify API Error fetching tracks:', errorData);
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

    return NextResponse.json({ tracks });

  } catch (error) {
    console.error('Server-side error in /api/spotify/featured:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
