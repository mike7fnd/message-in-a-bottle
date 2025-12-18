
import { NextResponse } from 'next/server';
import fetch from 'node-fetch';
import { getAccessToken } from '@/lib/spotify';

const FEATURED_TRACK_IDS = [
      "3AJwUDP919kvQ9QcozQPxg", // Yellow - Coldplay
      "0ug5NqcwcFR2xrfTkc7k8e", //Style
    "4m0q0xQ2BNl9SCAGKyfiGZ", // Somebody Else - The 1975
    "71BqAINEnezjQfxE4VuJfq", //Slut
    "0W0iAC1VGlB82PI6elxFYf", //Guilty as Sin
     "4nyY8oVjbX2d4qzlpiVM5n", //Ruin My Life
     "410fyfFghBsxNu45LiNJ24", //Pagibig ay Kanibalismo
     "1udOOSbJnytCdgvbgYOF5s", //Kalapastanganan
     "3A02hWQ2ebOFDWSbAMNnpw", //bittersweet
     "1qbmS6ep2hbBRaEZFpn7BX", //Man I Need
     "6DH13QYXK7lKkYHSU88N48", //Who Knows
    "6Qyc6fS4DsZjB2mRW9DsQs", // Iris - The Goo Goo Dolls
    "2btKtacOXuMtC9WjcNRvAA", // ILYSB - LANY
    "4eWQlBRaTjPPUlzacqEeoQ", //Never Be The Same
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
