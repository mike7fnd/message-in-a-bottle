
import { NextResponse } from 'next/server';
import fetch from 'node-fetch';

let accessToken = '';
let tokenExpiresAt = 0;

async function getAccessToken() {
  if (accessToken && Date.now() < tokenExpiresAt) {
    return accessToken;
  }

  const client_id = process.env.SPOTIFY_CLIENT_ID;
  const client_secret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!client_id || !client_secret) {
    throw new Error('Spotify API credentials are not configured.');
  }

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization:
        'Basic ' + Buffer.from(client_id + ':' + client_secret).toString('base64'),
    },
    body: 'grant_type=client_credentials',
  });

  const data: any = await response.json();

  if (!response.ok) {
    throw new Error(data.error_description || 'Failed to fetch Spotify access token.');
  }

  accessToken = data.access_token;
  tokenExpiresAt = Date.now() + (data.expires_in - 300) * 1000;

  return accessToken;
}

// A list of popular track IDs from various genres to ensure variety
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
];

export async function GET() {
  try {
    const token = await getAccessToken();
    const tracksResponse = await fetch(
      `https://api.spotify.com/v1/tracks?ids=${FEATURED_TRACK_IDS.join(',')}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!tracksResponse.ok) {
      const errorData = await tracksResponse.json();
      console.error('Spotify API Error:', errorData);
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
    console.error('Server-side Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
