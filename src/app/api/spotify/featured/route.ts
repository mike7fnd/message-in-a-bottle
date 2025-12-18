
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
    "7k9guVClpbPyfVfF0E9T2b", // Here With Me - d4vd
    "5JskdG0sXo43p3LpS2nN2g", // Until I Found You - Stephen Sanchez
    "4CeeEOM32jQcH3eN9Q2dGj", // ceilings - Lizzy McAlpine
    "1odExbeFR4t2sfEV5G174c", // die for you - joji
    "3RiPr60MddHuriL4E3ITko", // All I aAsk - Adele
    "6dOtV4ipGsoS7z0S1epI4w", // Saturn - SZA
    "5B8n62iSOiL324smV3dI7k", // Get You The Moon - Kina
    "0IysK35Xo5L5LgP1dOKS3f", // double take - dhruv
    "3qff2EnrPjcaMTt5e0d22N", // Here's Your Perfect - Jamie Miller
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
