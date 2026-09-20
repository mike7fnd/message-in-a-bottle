/**
 * The Spotify player for a message that has a song attached.
 *
 * Rendered directly, not behind a press. The song is part of what the sender
 * chose to say, so it shows up as a song rather than as a button promising one.
 *
 * The trade-off is real and is disclosed rather than hidden: the iframe loads
 * with the page, so Spotify sees the reader's IP address and can set its own
 * cookies without being asked first. The privacy page says exactly that, under
 * "Third parties" — if this component ever changes back, that paragraph has to
 * change with it.
 *
 * `loading="lazy"` still keeps the request until the player is near the
 * viewport, which on a long page is most of the saving that click-to-load gave.
 */
export function SpotifyEmbed({ trackId }: { trackId: string }) {
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
