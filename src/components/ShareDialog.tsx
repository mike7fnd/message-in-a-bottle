'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  FacebookShareButton,
  FacebookIcon,
  TwitterShareButton,
  TwitterIcon,
  WhatsappShareButton,
  WhatsappIcon,
  TelegramShareButton,
  TelegramIcon,
  ThreadsShareButton,
  ThreadsIcon,
} from 'react-share';
import { Check, Copy, Download, Link as LinkIcon, Loader2, Share2 } from 'lucide-react';
import { InstagramGlyph, TiktokGlyph } from '@/components/icons/SocialIcons';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

/**
 * Share sheet for a single message.
 *
 * A note on Instagram and TikTok, since they are the two people ask for most:
 * neither exposes a web share URL. There is no equivalent of Facebook's
 * `sharer.php` that can pre-fill an Instagram or TikTok post from a browser —
 * both require the content to already be on the device. So rather than
 * pretending with a button that goes nowhere useful, those go through the
 * phone's own share sheet (`navigator.share`), which does list Instagram and
 * TikTok when their apps are installed, with a download as the fallback.
 */
export interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Canonical link to the message. */
  url: string;
  /** Used as the post title / tweet text. */
  title: string;
  /** Longer blurb for networks that take one. */
  text?: string;
  /**
   * Produces a PNG of the message card for the image-based paths. Returning
   * null means image sharing is unavailable and those controls are hidden.
   */
  getImage?: () => Promise<File | null>;
}

export function ShareDialog({
  open,
  onOpenChange,
  url,
  title,
  text,
  getImage,
}: ShareDialogProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState<
    null | 'native' | 'download' | 'instagram' | 'tiktok'
  >(null);
  const [canNativeShare, setCanNativeShare] = useState(false);

  // Feature-detected on the client only: `navigator.share` does not exist
  // during SSR, and checking it during render would desync hydration.
  useEffect(() => {
    setCanNativeShare(
      typeof navigator !== 'undefined' && typeof navigator.share === 'function'
    );
  }, []);

  useEffect(() => {
    if (!open) {
      setCopied(false);
      setBusy(null);
    }
  }, [open]);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({ title: 'Link copied' });
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        variant: 'destructive',
        title: "Couldn't copy",
        description: 'Select the link above and copy it manually.',
      });
    }
  }, [url, toast]);

  /** Phone share sheet — the only route to Instagram and TikTok. */
  const shareNatively = useCallback(async () => {
    setBusy('native');
    try {
      const file = getImage ? await getImage() : null;

      // Sharing files and text together is not universally supported, so ask
      // first and fall back to a link-only share.
      if (file && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title, text: `${text ?? ''} ${url}`.trim() });
      } else {
        await navigator.share({ title, text, url });
      }
    } catch (err) {
      // A cancelled share sheet throws AbortError — that is the user changing
      // their mind, not a failure worth reporting.
      if ((err as Error)?.name !== 'AbortError') {
        console.error('Native share failed:', err);
        toast({
          variant: 'destructive',
          title: "Couldn't open the share sheet",
          description: 'Try copying the link instead.',
        });
      }
    } finally {
      setBusy(null);
    }
  }, [getImage, title, text, url, toast]);

  /**
   * Instagram and TikTok.
   *
   * Neither can be handed media by a web page: their story/post composers are
   * native SDK surfaces that read from the device, so there is no URL that
   * arrives with the card already attached. What this does instead, in order
   * of preference:
   *
   *   1. The OS share sheet with the PNG attached. On a phone this lists
   *      Instagram — including "Stories" — and TikTok directly, and is the only
   *      route that carries the image the whole way.
   *   2. Otherwise save the card and open the app's composer, so the image is
   *      waiting in the gallery. The `instagram://story-camera` scheme opens
   *      the story camera; TikTok's equivalent is undocumented, so it falls
   *      back to the web uploader.
   */
  const shareToApp = useCallback(
    async (app: 'instagram' | 'tiktok') => {
      setBusy(app);
      const label = app === 'instagram' ? 'Instagram' : 'TikTok';
      try {
        const file = getImage ? await getImage() : null;

        if (file && navigator.canShare?.({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title,
              text: `${text ?? ''} ${url}`.trim(),
            });
            return;
          } catch (err) {
            if ((err as Error)?.name === 'AbortError') return;
            // Fall through to the save-and-open path below.
          }
        }

        if (file) {
          const href = URL.createObjectURL(file);
          const a = document.createElement('a');
          a.href = href;
          a.download = file.name;
          a.click();
          URL.revokeObjectURL(href);
        }

        toast({
          title: `Card saved for ${label}`,
          description: file
            ? `Opening ${label} — pick the image you just saved to add it to your story.`
            : `Opening ${label}. Paste the link into your post.`,
        });

        const scheme =
          app === 'instagram' ? 'instagram://story-camera' : 'snssdk1233://';
        const webFallback =
          app === 'instagram'
            ? 'https://www.instagram.com/'
            : 'https://www.tiktok.com/upload';

        // Try the app, and fall back to the web if nothing took over the tab.
        const startedAt = Date.now();
        window.location.href = scheme;
        window.setTimeout(() => {
          const stillHere = !document.hidden && Date.now() - startedAt < 2500;
          if (stillHere) window.open(webFallback, '_blank', 'noopener');
        }, 1200);
      } catch (err) {
        console.error(`${label} share failed:`, err);
        toast({
          variant: 'destructive',
          title: `Couldn't open ${label}`,
          description: 'Copy the link and share it manually instead.',
        });
      } finally {
        setBusy(null);
      }
    },
    [getImage, title, text, url, toast]
  );

  const downloadImage = useCallback(async () => {
    if (!getImage) return;
    setBusy('download');
    try {
      const file = await getImage();
      if (!file) throw new Error('No image produced');
      const href = URL.createObjectURL(file);
      const a = document.createElement('a');
      a.href = href;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(href);
      toast({
        title: 'Image saved',
        description: 'Post it to Instagram or TikTok from your gallery.',
      });
    } catch (err) {
      console.error('Image download failed:', err);
      toast({
        variant: 'destructive',
        title: "Couldn't create the image",
        description: 'The link still works — copy it instead.',
      });
    } finally {
      setBusy(null);
    }
  }, [getImage, toast]);

  const iconProps = { size: 44, round: true } as const;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Share this message</DialogTitle>
          <DialogDescription>
            Anyone with the link can read it — it is already public.
          </DialogDescription>
        </DialogHeader>

        {/* Link + copy.
            `min-w-0` on both the grid child and the flex child is what makes
            `truncate` work here. DialogContent is a CSS grid, and grid and
            flex children default to `min-width: auto`, meaning they refuse to
            shrink below their content. A long message URL is one unbroken
            nowrap string, so without these it widened the dialog instead of
            being clipped, which is what broke the card. */}
        <div className="min-w-0 space-y-2">
          <div className="flex min-w-0 items-center gap-2 rounded-15px bg-muted p-3">
            <LinkIcon
              className="h-4 w-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <p
              className="min-w-0 flex-1 truncate text-left font-mono text-xs text-foreground"
              title={url}
            >
              {url}
            </p>
          </div>
          <Button onClick={copyLink} className="w-full">
            {copied ? (
              <Check className="mr-2 h-4 w-4" />
            ) : (
              <Copy className="mr-2 h-4 w-4" />
            )}
            {copied ? 'Copied' : 'Copy link'}
          </Button>
        </div>

        {/* Networks that accept a shared link from the web */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Share to</p>
          <div className="flex flex-wrap items-center gap-3">
            <FacebookShareButton url={url} aria-label="Share on Facebook">
              <FacebookIcon {...iconProps} />
            </FacebookShareButton>
            <TwitterShareButton url={url} title={title} aria-label="Share on X">
              <TwitterIcon {...iconProps} />
            </TwitterShareButton>
            <WhatsappShareButton url={url} title={title} aria-label="Share on WhatsApp">
              <WhatsappIcon {...iconProps} />
            </WhatsappShareButton>
            <TelegramShareButton url={url} title={title} aria-label="Share on Telegram">
              <TelegramIcon {...iconProps} />
            </TelegramShareButton>
            <ThreadsShareButton url={url} title={title} aria-label="Share on Threads">
              <ThreadsIcon {...iconProps} />
            </ThreadsShareButton>

            {/* These two save the card first, then open the app — see
                shareToApp for why they can't behave like the rest. */}
            <button
              type="button"
              onClick={() => shareToApp('instagram')}
              disabled={busy !== null}
              aria-label="Save the card and open Instagram"
              title="Save the card and open Instagram"
              className="relative rounded-full transition-opacity hover:opacity-85 disabled:opacity-50"
            >
              <InstagramGlyph size={44} />
              {busy === 'instagram' && (
                <span className="absolute inset-0 flex items-center justify-center rounded-full bg-background/70">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => shareToApp('tiktok')}
              disabled={busy !== null}
              aria-label="Save the card and open TikTok"
              title="Save the card and open TikTok"
              className="relative rounded-full transition-opacity hover:opacity-85 disabled:opacity-50"
            >
              <TiktokGlyph size={44} />
              {busy === 'tiktok' && (
                <span className="absolute inset-0 flex items-center justify-center rounded-full bg-background/70">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </span>
              )}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Instagram and TikTok can&apos;t receive an image straight from a web
            page, so those two save the card to your device first, then open the
            app for you to attach it.
          </p>
        </div>

        {/* Generic image routes, for anywhere not covered above */}
        {(canNativeShare || getImage) && (
          <div className="space-y-2 border-t border-border pt-4">
            <p className="text-xs font-medium text-muted-foreground">
              Somewhere else
            </p>
            {canNativeShare && (
              <Button
                variant="secondary"
                className="w-full"
                onClick={shareNatively}
                disabled={busy !== null}
              >
                {busy === 'native' ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Share2 className="mr-2 h-4 w-4" />
                )}
                Open share sheet
              </Button>
            )}
            {getImage && (
              <Button
                variant="outline"
                className="w-full"
                onClick={downloadImage}
                disabled={busy !== null}
              >
                {busy === 'download' ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Save as image
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
