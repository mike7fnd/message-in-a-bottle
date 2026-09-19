'use client';

import { forwardRef } from 'react';
import { siteConfig } from '@/lib/site-config';

/**
 * The image people actually post — a designed asset, not a screenshot of the
 * page. Rendered off-screen and captured with html-to-image.
 *
 * On the aspect ratio: Instagram and TikTok stories are 9:16 (1080×1920). A
 * 16:9 landscape image posted to a story is letterboxed into a thin strip with
 * dead grey space above and below it, so `story` is the default. `landscape`
 * is here for anywhere that genuinely wants 16:9, such as a link preview or a
 * YouTube community post.
 *
 * Dimensions are CSS pixels at half the final size and captured at
 * pixelRatio 2, which keeps the type sizes readable while emitting a full
 * 1080×1920 PNG.
 */
export type ShareFormat = 'story' | 'landscape';

const OCEAN = 'https://images.pexels.com/photos/19977233/pexels-photo-19977233.jpeg';

export const SHARE_FORMATS: Record<
  ShareFormat,
  { width: number; height: number; pixelRatio: number; background: string }
> = {
  story: {
    width: 540,
    height: 960,
    pixelRatio: 2, // → 1080 × 1920
    // Ask Pexels for the exact crop rather than downloading the full-size
    // original and letting the browser squash it.
    background: `${OCEAN}?auto=compress&cs=tinysrgb&w=1080&h=1920&fit=crop`,
  },
  landscape: {
    width: 960,
    height: 540,
    pixelRatio: 2, // → 1920 × 1080
    background: `${OCEAN}?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop`,
  },
};

/** Keeps long notes from overflowing the card. */
const MAX_CHARS = { story: 300, landscape: 220 } as const;

export interface ShareCardProps {
  recipient: string;
  message: string;
  format?: ShareFormat;
  /** Caption under the card. */
  caption?: string;
}

export const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(
  (
    {
      recipient,
      message,
      format = 'story',
      caption = 'share your thoughts in your head',
    },
    ref
  ) => {
    const spec = SHARE_FORMATS[format];
    const limit = MAX_CHARS[format];
    const body =
      message.length > limit ? `${message.slice(0, limit).trimEnd()}…` : message;

    const isStory = format === 'story';
    const domain = siteConfig.url.replace(/^https?:\/\//, '');

    return (
      <div
        ref={ref}
        style={{
          width: spec.width,
          height: spec.height,
          position: 'relative',
          overflow: 'hidden',
          // Explicit colour: the capture must not inherit the page theme, or a
          // dark-mode reader would export a different image from everyone else.
          backgroundColor: '#0b1f2a',
        }}
      >
        {/* Ocean. A plain <img> with crossOrigin set, not next/image — it keeps
            the canvas untainted and avoids the srcset that html-to-image would
            have to resolve. Pexels serves Access-Control-Allow-Origin: *. */}
        <img
          src={spec.background}
          alt=""
          crossOrigin="anonymous"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />

        {/* Scrim, so white type stays legible over a bright horizon. */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(4,20,30,0.55) 0%, rgba(4,20,30,0.25) 38%, rgba(4,20,30,0.72) 100%)',
          }}
        />

        <div
          style={{
            position: 'relative',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: isStory ? '56px 40px' : '36px 56px',
            textAlign: 'center',
            color: '#fff',
          }}
        >
          {/* Wordmark */}
          <p
            style={{
              margin: 0,
              fontSize: isStory ? 15 : 14,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              opacity: 0.9,
              fontWeight: 600,
            }}
          >
            Message in a Bottle
          </p>

          {/* The note */}
          <div
            style={{
              width: '100%',
              maxWidth: isStory ? 420 : 560,
              borderRadius: 28,
              background: 'rgba(255,255,255,0.94)',
              color: '#111',
              padding: isStory ? '36px 30px' : '30px 34px',
              boxShadow: '0 18px 50px rgba(0,0,0,0.30)',
              textAlign: 'left',
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: isStory ? 19 : 17,
                textTransform: 'capitalize',
              }}
            >
              For{' '}
              <span
                style={{
                  fontFamily: 'var(--font-playfair), Georgia, serif',
                  fontStyle: 'italic',
                }}
              >
                {recipient}
              </span>
              ,
            </p>
            <p
              style={{
                margin: '16px 0 0',
                borderLeft: '2px solid rgba(0,0,0,0.14)',
                paddingLeft: 16,
                fontStyle: 'italic',
                fontSize: isStory ? 20 : 18,
                lineHeight: 1.55,
                // Preserve the writer's own line breaks.
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {body}
            </p>
          </div>

          {/* Caption + link */}
          <div>
            <p
              style={{
                margin: 0,
                fontSize: isStory ? 21 : 19,
                fontFamily: 'var(--font-playfair), Georgia, serif',
                fontStyle: 'italic',
                lineHeight: 1.4,
              }}
            >
              {caption}
            </p>
            <p
              style={{
                margin: '14px 0 0',
                fontSize: isStory ? 15 : 14,
                fontWeight: 700,
                letterSpacing: '0.06em',
                opacity: 0.95,
              }}
            >
              {domain}
            </p>
          </div>
        </div>
      </div>
    );
  }
);

ShareCard.displayName = 'ShareCard';
