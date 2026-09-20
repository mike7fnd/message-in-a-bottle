let accessToken = '';
let tokenExpiresAt = 0;

/**
 * Reads the response body once, as text, and only then tries to parse it.
 *
 * `response.json()` was what produced errors like
 *   Unexpected token 'A', "Active pre"... is not valid JSON
 * which says nothing about what actually went wrong. Spotify — and anything
 * sitting in front of it, such as an edge network blocking a datacentre IP —
 * can answer with plain text or HTML, and when it does, the parse error
 * replaces the real message and the real status code.
 *
 * Returns the parsed body when it is JSON, and the raw text when it is not, so
 * the caller can report either.
 */
async function readBody(
  response: Response
): Promise<{ json: any | null; text: string }> {
  const text = await response.text();
  try {
    return { json: JSON.parse(text), text };
  } catch {
    return { json: null, text };
  }
}

/** Enough of an unexpected body to identify it, without dumping a whole page. */
function snippet(text: string, max = 200): string {
  const collapsed = text.replace(/\s+/g, ' ').trim();
  return collapsed.length > max ? `${collapsed.slice(0, max)}…` : collapsed;
}

/**
 * Retrieves a Spotify access token, refreshing it if necessary.
 * This is the single source of truth for the Spotify token.
 */
export async function getAccessToken() {
  if (accessToken && Date.now() < tokenExpiresAt) {
    return accessToken;
  }

  // Trimmed. A credential pasted into a hosting dashboard very easily picks up
  // a trailing newline or space, which is invisible in the UI and produces a
  // failure that looks nothing like "your value has a space on the end".
  const client_id = process.env.SPOTIFY_CLIENT_ID?.trim();
  const client_secret = process.env.SPOTIFY_CLIENT_SECRET?.trim();

  if (!client_id || !client_secret) {
    throw new Error(
      'Spotify API credentials are not configured in environment variables.'
    );
  }

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization:
        'Basic ' + Buffer.from(client_id + ':' + client_secret).toString('base64'),
    },
    body: 'grant_type=client_credentials',
    cache: 'no-store',
  });

  const { json, text } = await readBody(response);

  if (!response.ok || !json?.access_token) {
    // The client id is safe to log — it is public by design, and knowing which
    // credential was in play is most of what makes these reports actionable.
    // The secret is never included.
    console.error('Spotify token request failed', {
      status: response.status,
      contentType: response.headers.get('content-type'),
      clientIdPrefix: client_id.slice(0, 6),
      body: snippet(text),
    });
    throw new Error(
      json?.error_description ||
        json?.error ||
        `Spotify token request failed (HTTP ${response.status}): ${snippet(text, 120)}`
    );
  }

  accessToken = json.access_token;
  // Refresh token 5 minutes before it expires
  tokenExpiresAt = Date.now() + (json.expires_in - 300) * 1000;

  return accessToken;
}

/**
 * A GET against the Spotify Web API with the app token attached.
 *
 * Central so every caller gets the same defensive body handling, rather than
 * each route reimplementing it and each one losing the message differently.
 */
export async function spotifyGet(
  path: string
): Promise<{ ok: boolean; status: number; json: any | null; text: string }> {
  const token = await getAccessToken();
  const response = await fetch(`https://api.spotify.com/v1/${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  const { json, text } = await readBody(response);
  return { ok: response.ok, status: response.status, json, text };
}

export { snippet as spotifyBodySnippet };
