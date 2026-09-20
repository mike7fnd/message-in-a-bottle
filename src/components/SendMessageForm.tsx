'use client';

import { useState, useTransition, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import {
  Loader2,
  Send,
  Plus,
  Copy,
  Link as LinkIcon,
  CalendarIcon,
  Share2,
  Upload,
  Music,
  Search,
  X,
} from 'lucide-react';
import { Card, CardContent } from './ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { Skeleton } from './ui/skeleton';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './ui/collapsible';
import { addMessageCached } from '@/lib/cached-data';
import { checkRateLimit, recordMessageSent } from '@/lib/rate-limit';
import { z } from 'zod';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { SendingAnimation } from './SendingAnimation';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { type SiteContent } from '@/lib/content';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { format } from 'date-fns';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { toPng } from 'html-to-image';
import { StoryPreview } from './StoryPreview';
import { useDebounce } from '@/hooks/use-debounce';
import { useFeatures } from '@/hooks/use-features';

const FormSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty.'),
  recipient: z.string().min(1, 'Recipient cannot be empty.').max(50, 'Recipient name is too long.'),
});

/** Shape returned by /api/spotify/search and /api/spotify/featured. */
interface SpotifyTrack {
  id: string;
  name: string;
  artist: string;
  albumArt: string;
}

export default function SendMessageForm({ content }: { content: SiteContent }) {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const [isPending, startTransition] = useTransition();

  const [recipient, setRecipient] = useState('');
  const [message, setMessage] = useState('');
  const [openDate, setOpenDate] = useState<Date | undefined>(undefined);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isExtrasOpen, setIsExtrasOpen] = useState(false);
  const [sentMessageId, setSentMessageId] = useState<string | null>(null);
  const [rateLimitLabel, setRateLimitLabel] = useState<string | null>(null);
  const [modalContent, setModalContent] = useState<'share' | 'music' | null>(null);

  // ── Spotify ────────────────────────────────────────────────────────────────
  const { spotifyEnabled } = useFeatures();
  const [spotifyTrack, setSpotifyTrack] = useState<SpotifyTrack | null>(null);
  const [spotifyQuery, setSpotifyQuery] = useState('');
  const [spotifyResults, setSpotifyResults] = useState<SpotifyTrack[]>([]);
  const [isSpotifySearching, setIsSpotifySearching] = useState(false);
  const [spotifyError, setSpotifyError] = useState<string | null>(null);
  const debouncedSpotifyQuery = useDebounce(spotifyQuery, 300);
  const [isGenerating, setIsGenerating] = useState(false);
  const [formState, setFormState] = useState<{
    success: boolean;
    message?: string;
    errors?: { recipient?: string[]; message?: string[] };
  }>({ success: false });

  const { resolvedTheme } = useTheme();
  const extrasContainer = useRef<HTMLDivElement>(null);
  const storyRef = useRef<HTMLDivElement>(null);

  // GSAP extras animation
  useGSAP(
    () => {
      if (isExtrasOpen) {
        gsap.fromTo(extrasContainer.current,
          { height: 0, opacity: 0, marginTop: 0, y: -20 },
          { height: 'auto', opacity: 1, marginTop: '1rem', y: 0, duration: 0.8, ease: 'elastic.out(1, 0.75)' }
        );
      } else {
        gsap.to(extrasContainer.current,
          { height: 0, opacity: 0, marginTop: 0, y: -20, duration: 0.3, ease: 'power2.in' }
        );
      }
    },
    { dependencies: [isExtrasOpen], scope: extrasContainer }
  );

  // Load draft + rate limit check
  useEffect(() => {
    try {
      const draft = localStorage.getItem('messageDraft');
      if (draft) {
        const { recipient, message } = JSON.parse(draft);
        setRecipient(recipient || '');
        setMessage(message || '');
      }
    } catch (e) {
      console.error('Failed to parse draft', e);
    }
    const { allowed, retryAfterLabel } = checkRateLimit();
    if (!allowed) setRateLimitLabel(retryAfterLabel ?? 'some time');
  }, []);

  // Persist draft
  useEffect(() => {
    localStorage.setItem('messageDraft', JSON.stringify({ recipient, message }));
  }, [recipient, message]);

  /**
   * Song list for the picker: the curated featured set when the box is empty,
   * search results once something is typed.
   *
   * Only runs while the dialog is open, so simply loading the send page costs
   * nothing — no Spotify token is minted for someone who never asks for music.
   *
   * The request is aborted on every change. Without that, a slow search for
   * "lo" can land after a fast one for "love" and overwrite it, which reads as
   * the picker ignoring what you typed.
   */
  useEffect(() => {
    if (modalContent !== 'music') return;

    const controller = new AbortController();
    const url = debouncedSpotifyQuery.trim()
      ? `/api/spotify/search?query=${encodeURIComponent(debouncedSpotifyQuery.trim())}`
      : '/api/spotify/featured';

    setIsSpotifySearching(true);
    setSpotifyError(null);

    fetch(url, { signal: controller.signal })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          // Surfaced rather than swallowed. A missing or wrong Spotify
          // credential used to render as an empty list, which looks like
          // "no songs match" and sends you hunting for the wrong problem.
          throw new Error(
            typeof data?.error === 'string'
              ? data.error
              : 'Could not reach Spotify.'
          );
        }
        setSpotifyResults(Array.isArray(data.tracks) ? data.tracks : []);
      })
      .catch((err) => {
        if (err?.name === 'AbortError') return;
        console.error('Spotify lookup failed:', err);
        setSpotifyResults([]);
        setSpotifyError(
          err instanceof Error ? err.message : 'Could not reach Spotify.'
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsSpotifySearching(false);
      });

    return () => controller.abort();
  }, [modalContent, debouncedSpotifyQuery]);

  // Share / download image
  const generateAndShareImage = useCallback(async (shareType: 'native' | 'download') => {
    if (!storyRef.current) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not capture message card.' });
      return;
    }
    setIsGenerating(true);
    try {
      const dataUrl = await toPng(storyRef.current, {
        cacheBust: true, pixelRatio: 2,
        fetchRequestInit: { mode: 'cors', credentials: 'omit' as RequestCredentials },
      });
      if (shareType === 'download') {
        const link = document.createElement('a');
        link.download = `message-for-${recipient}.png`;
        link.href = dataUrl;
        link.click();
        return;
      }
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `message-for-${recipient}.png`, { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: `A message for ${recipient}`, text: `I sent a message in a bottle to ${recipient}!` });
      } else {
        toast({ title: 'Sharing not supported', description: "Your browser doesn't support direct image sharing. Download instead." });
      }
    } catch (err) {
      console.error('Error generating image:', err);
      toast({ variant: 'destructive', title: 'Oops!', description: 'Could not generate or share image.' });
    } finally {
      setIsGenerating(false);
    }
  }, [recipient, toast]);

  // Submit
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormState({ success: false });

    if (isUserLoading) {
      setFormState({ success: false, message: 'Initializing session, please wait...' });
      return;
    }

    const rateLimit = checkRateLimit();
    if (!rateLimit.allowed) {
      setRateLimitLabel(rateLimit.retryAfterLabel ?? 'some time');
      return;
    }

    const validated = FormSchema.safeParse({ recipient, message });
    if (!validated.success) {
      setFormState({ success: false, errors: validated.error.flatten().fieldErrors });
      return;
    }

    startTransition(async () => {
      try {
        const messageId = await addMessageCached(
          validated.data.message,
          validated.data.recipient,
          user?.uid,
          undefined,
          spotifyTrack?.id,
          openDate,
        );
        recordMessageSent();
        setRateLimitLabel(null);
        setShowSuccess(true);
        setSentMessageId(messageId);
        setMessage('');
        localStorage.removeItem('messageDraft');
        setOpenDate(undefined);
        setSpotifyTrack(null);
        setIsExtrasOpen(false);
        router.refresh();
      } catch (error) {
        console.error('Error sending message:', error);
        setFormState({
          success: false,
          message: error instanceof Error ? error.message : 'An unknown error occurred.',
        });
      }
    });
  };

  const resetForm = () => { setShowSuccess(false); setSentMessageId(null); setRecipient(''); setMessage(''); };

  const handleCopyLink = () => {
    if (!sentMessageId) return;
    navigator.clipboard.writeText(`${window.location.origin}/message/${sentMessageId}`);
    toast({ title: 'Link Copied!', description: 'The message link has been copied to your clipboard.' });
  };

  const successImage = resolvedTheme === 'dark' ? content.sendSuccessImageDark : content.sendSuccessImageLight;

  // ── Success screen ──────────────────────────────────────────────────────────
  if (showSuccess && sentMessageId) {
    return (
      <div className="mx-auto mt-8 max-w-xl">
        <Card className="relative overflow-hidden">
          <CardContent className="p-6 text-center space-y-4">
            <div className="flex justify-center">
              {successImage && (
                <Image src={successImage} alt="Success" width={128} height={128} className="h-32 w-32 animate-bottle-sent" unoptimized />
              )}
            </div>
            <h3 className="text-2xl font-bold font-headline">{content.sendSuccessTitle}</h3>
            <p className="text-muted-foreground">{content.sendSuccessDescription}</p>

            <div className="relative rounded-md bg-muted p-3">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Link href={`/message/${sentMessageId}`} className="block w-full truncate pl-7 text-left text-sm font-mono text-primary hover:underline">
                {`${window.location.origin}/message/${sentMessageId}`}
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button onClick={handleCopyLink} className="w-full">
                <Copy className="mr-2" />{content.sendCopyLinkButton}
              </Button>
              <Button variant="secondary" onClick={() => setModalContent('share')} className="w-full">
                <Share2 className="mr-2" />Share to Story
              </Button>
              <Button variant="outline" onClick={resetForm} className="w-full col-span-1 sm:col-span-2">
                <Send className="mr-2" />{content.sendAnotherButton}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Dialog open={modalContent === 'share'} onOpenChange={(open) => !open && setModalContent(null)}>
          <DialogContent className="max-w-xs w-[90vw]">
            <DialogHeader className="text-center">
              <DialogTitle>Share this Message</DialogTitle>
              <DialogDescription>Share this bottle on social media or download it.</DialogDescription>
            </DialogHeader>
            <div className="absolute top-[-1000px] left-[-1000px]">
              <StoryPreview ref={storyRef} recipient={recipient} message={message} messageUrl={`${window.location.origin}/message/${sentMessageId}`} />
            </div>
            <div className="flex flex-col gap-2 pt-4">
              <Button onClick={() => generateAndShareImage('native')} disabled={isGenerating}>
                {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Share2 className="mr-2 h-5 w-5" />}
                Share Message
              </Button>
              <Button onClick={() => generateAndShareImage('download')} variant="outline" disabled={isGenerating}>
                {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2" />}
                Download Image
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ── Send form ───────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto mt-8 max-w-xl">
      <Card className="relative overflow-hidden">
        {isPending && <SendingAnimation content={content} />}
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Recipient */}
            <div className="space-y-2">
              <Label htmlFor="recipient">{content.sendRecipientLabel}</Label>
              <Input
                id="recipient"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder={content.sendRecipientPlaceholder}
                required
                disabled={isPending || isUserLoading}
              />
              {formState.errors?.recipient && (
                <p className="text-sm text-red-500">{formState.errors.recipient.join(', ')}</p>
              )}
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="message">{content.sendMessageLabel}</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={content.sendMessagePlaceholder}
                rows={5}
                required
                disabled={isPending || isUserLoading}
              />
              {formState.errors?.message && (
                <p className="text-sm text-red-500">{formState.errors.message.join(', ')}</p>
              )}
            </div>

            {/* Extras (Time Capsule) */}
            <div className="flex flex-col gap-2">
              <Collapsible open={isExtrasOpen} onOpenChange={setIsExtrasOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <Plus className={cn('mr-2 h-4 w-4 transition-transform duration-300', isExtrasOpen && 'rotate-45')} />
                    {content.sendAddSomethingButton}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent asChild>
                  <div ref={extrasContainer} className="h-0 overflow-hidden space-y-4">

                    {/* Time Capsule */}
                    <div className="space-y-2 text-center">
                      <Label>Time Capsule (Optional)</Label>
                      <p className="text-xs text-muted-foreground">Set a date when the recipient can open this message.</p>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn('w-full justify-center text-left font-normal', !openDate && 'text-muted-foreground')}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {openDate ? format(openDate, 'PPP') : <span>Set an open date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={openDate}
                            onSelect={setOpenDate}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      {openDate && (
                        <div className="flex justify-center">
                          <Button variant="ghost" size="sm" onClick={() => setOpenDate(undefined)}>
                            Clear date
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Add a Song. Hidden entirely when the admin turns the
                        feature off, rather than shown and failing. */}
                    {spotifyEnabled && (
                      <div className="space-y-2">
                        {spotifyTrack ? (
                          <div className="relative">
                            {/* The picked track plays inline so you hear what
                                you are attaching before you send it. */}
                            <iframe
                              title={`Preview of ${spotifyTrack.name} by ${spotifyTrack.artist}`}
                              style={{ borderRadius: '12px' }}
                              src={`https://open.spotify.com/embed/track/${encodeURIComponent(spotifyTrack.id)}?utm_source=generator`}
                              width="100%"
                              height="152"
                              frameBorder="0"
                              allowFullScreen
                              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                              loading="lazy"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => setSpotifyTrack(null)}
                              className="absolute right-2 top-2 h-8 w-8 rounded-full bg-background text-foreground shadow-subtle"
                              aria-label={`Remove ${spotifyTrack.name}`}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            onClick={() => setModalContent('music')}
                            disabled={isPending || isUserLoading}
                          >
                            <Music className="mr-2 h-4 w-4" />
                            {content.sendAddSongButton}
                          </Button>
                        )}
                      </div>
                    )}

                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Submit */}
              <Button
                type="submit"
                className="w-full"
                disabled={isPending || isUserLoading || !!rateLimitLabel}
              >
                {isPending || isUserLoading
                  ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  : <Send className="mr-2 h-4 w-4" />}
                {content.sendMessageButton}
              </Button>

              {rateLimitLabel && (
                <p className="text-center text-sm text-muted-foreground">
                  You can send another message in <span className="font-semibold text-foreground">{rateLimitLabel}</span>.
                </p>
              )}

              {formState.message && (
                <p className="text-center text-sm text-destructive">{formState.message}</p>
              )}

              <p className="text-center text-xs text-muted-foreground">{content.sendNote}</p>
            </div>

          </form>
        </CardContent>
      </Card>

      {/* Song picker.
          Outside the <form> on purpose: a button rendered inside a form
          submits it by default, and a mis-typed one here would send a
          half-written letter the moment you picked a song. */}
      <Dialog
        open={modalContent === 'music'}
        onOpenChange={(open) => {
          if (open) return;
          setModalContent(null);
          setSpotifyQuery('');
          setSpotifyError(null);
        }}
      >
        <DialogContent className="w-[90vw] max-w-md p-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle>{content.sendMusicTitle}</DialogTitle>
            <DialogDescription>
              The song is attached to your message for whoever opens it.
            </DialogDescription>
          </DialogHeader>

          <div className="relative px-6">
            <Search className="absolute left-9 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={spotifyQuery}
              onChange={(e) => setSpotifyQuery(e.target.value)}
              placeholder={content.sendMusicPlaceholder}
              className="pl-10"
              aria-label="Search Spotify for a song"
            />
          </div>

          <div className="max-h-80 space-y-2 overflow-y-auto p-6 pt-2">
            {isSpotifySearching ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-2">
                  <Skeleton className="h-10 w-10 shrink-0" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))
            ) : spotifyError ? (
              <p className="py-4 text-center text-sm text-destructive">
                {spotifyError}
              </p>
            ) : (
              <>
                {!debouncedSpotifyQuery.trim() && spotifyResults.length > 0 && (
                  <h3 className="px-2 pt-2 text-sm font-semibold text-muted-foreground">
                    {content.sendFeaturedSongs}
                  </h3>
                )}

                {spotifyResults.map((track) => (
                  <button
                    key={track.id}
                    type="button"
                    className="group flex w-full items-center gap-4 rounded-md p-2 text-left hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => {
                      setSpotifyTrack(track);
                      setModalContent(null);
                      setSpotifyQuery('');
                    }}
                  >
                    {track.albumArt ? (
                      <Image
                        src={track.albumArt}
                        alt=""
                        width={40}
                        height={40}
                        className="shrink-0 rounded-sm"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-muted">
                        <Music className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{track.name}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {track.artist}
                      </p>
                    </div>
                  </button>
                ))}

                {debouncedSpotifyQuery.trim() && spotifyResults.length === 0 && (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    No songs found for &ldquo;{debouncedSpotifyQuery.trim()}&rdquo;.
                  </p>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
