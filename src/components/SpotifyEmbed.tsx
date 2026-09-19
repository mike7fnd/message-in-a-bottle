'use client';

import { useState } from 'react';
import { Music, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Click-to-load wrapper around the Spotify player.
 *
 * The iframe used to render on page load, which meant Spotify received the
 * reader's IP address and could set its own cookies before anyone agreed to
 * anything — on a page the reader opened to read a note, not to stream music.
 * Now nothing is requested from Spotify until the reader asks for it.
 *
 * This is also why the message page is lighter: an embedded player is a few
 * hundred kilobytes that most readers never use.
 */
export function SpotifyEmbed({ trackId }: { trackId: string }) {
  const [loaded, setLoaded] = useState(false);

  if (!loaded) {
    return (
      <div className="rounded-15px border border-border bg-muted/40 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-15px bg-muted">
            <Music className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">
              A song is attached
            </p>
            <p className="text-xs text-muted-foreground">
              Loading the player connects you to Spotify, which may set its own
              cookies.
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3 w-full"
          onClick={() => setLoaded(true)}
        >
          <Play className="mr-2 h-4 w-4" aria-hidden="true" />
          Load Spotify player
        </Button>
      </div>
    );
  }

  return (
    <iframe
      title="Spotify player for the song attached to this message"
      style={{ borderRadius: '12px' }}
      src={`https://open.spotify.com/embed/track/${encodeURIComponent(trackId)}?utm_source=generator`}
      width="100%"
      height="152"
      frameBorder="0"
      allowFullScreen
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      loading="lazy"
    />
  );
}
