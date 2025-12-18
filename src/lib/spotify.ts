
import fetch from 'node-fetch';

let accessToken = '';
let tokenExpiresAt = 0;

/**
 * Retrieves a Spotify access token, refreshing it if necessary.
 * This is the single source of truth for the Spotify token.
 */
export async function getAccessToken() {
  if (accessToken && Date.now() < tokenExpiresAt) {
    return accessToken;
  }

  const client_id = process.env.SPOTIFY_CLIENT_ID;
  const client_secret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!client_id || !client_secret) {
    throw new Error('Spotify API credentials are not configured in environment variables.');
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
    console.error('Spotify Token Error:', data);
    throw new Error(data.error_description || 'Failed to fetch Spotify access token.');
  }
  
  accessToken = data.access_token;
  // Refresh token 5 minutes before it expires
  tokenExpiresAt = Date.now() + (data.expires_in - 300) * 1000; 
  
  return accessToken;
}
