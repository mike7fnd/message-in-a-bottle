'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { getCachedMessageById } from '@/lib/cached-data';
import { type Message } from '@/lib/data';
import { notFound, useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  Share2,
} from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { toPng } from 'html-to-image';
import { useToast } from '@/hooks/use-toast';
import { SpotifyEmbed } from '@/components/SpotifyEmbed';
import { ReportMessageDialog } from '@/components/ReportMessageDialog';
import { ShareDialog } from '@/components/ShareDialog';
import { AdBanner } from '@/components/ads/AdUnit';
import { AD_SLOTS, siteConfig } from '@/lib/site-config';

function CountdownTimer({ unlockDate }: { unlockDate: Date }) {
  const calculateTimeLeft = () => {
    const difference = +unlockDate - +new Date();
    let timeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };
    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }
    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setTimeout(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);
      if (Object.values(newTimeLeft).every(v => v === 0) && +unlockDate <= +new Date()) {
        window.location.reload();
      }
    }, 1000);
    return () => clearTimeout(timer);
  });

  return (
    <div className="font-body font-light grid grid-cols-4 gap-2 text-center items-center">
      {Object.entries(timeLeft).map(([interval, value]) => (
        <div key={interval} className="flex flex-col items-center">
          <span className="text-lg tracking-widest">{String(value).padStart(2, '0')}</span>
          <span className="text-xs uppercase text-muted-foreground">{interval}</span>
        </div>
      ))}
    </div>
  );
}

export default function MessagePageClient() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [message, setMessage] = useState<Message | null | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const { toast } = useToast();
  const messageCardRef = useRef<HTMLDivElement>(null);

  // Built from the canonical origin rather than window.location, so a link
  // shared from the www host still points at the apex URL.
  const shareUrl = `${siteConfig.url}/message/${id}`;

  useEffect(() => {
    if (!id) return;
    async function fetchMessage() {
      setIsLoading(true);
      try {
        const fetchedMessage = await getCachedMessageById(
          id,
          (fresh) => { if (fresh) setMessage(fresh); },
        );
        setMessage(fetchedMessage);
        if (!fetchedMessage) notFound();
      } catch (error) {
        console.error('Failed to fetch message:', error);
        setMessage(null);
      } finally {
        setIsLoading(false);
      }
    }
    fetchMessage();
  }, [id]);

  /**
   * Renders the message card to a PNG for the image-based share routes.
   * Returns null rather than throwing so ShareDialog can decide what to do.
   */
  const captureCardImage = useCallback(async (): Promise<File | null> => {
    if (!messageCardRef.current) return null;
    const dataUrl = await toPng(messageCardRef.current, {
      cacheBust: true,
      pixelRatio: 2,
    });
    const blob = await (await fetch(dataUrl)).blob();
    return new File([blob], `message-for-${message?.recipient ?? 'you'}.png`, {
      type: 'image/png',
    });
  }, [message]);

  if (isLoading || message === undefined) {
    return (
      <div className="flex min-h-dvh flex-col">
        <main className="flex-1">
          <div className="container mx-auto max-w-2xl px-4 py-8 md:py-16">
            <div className="flex justify-between items-center mb-4">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-9 w-9 rounded-full" />
            </div>
            <Card>
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-6 w-1/3" />
                <div className="space-y-2 border-l-2 border-border pl-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                </div>
              </CardContent>
              <CardFooter className="p-6 pt-0 justify-end">
                <Skeleton className="h-4 w-1/2" />
              </CardFooter>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  if (!message) {
    return (
      <div className="flex min-h-dvh flex-col">
        <main className="flex-1">
          <div className="container mx-auto max-w-2xl px-4 py-8 md:py-16">
            <p className="text-center">Message not found.</p>
          </div>
        </main>
      </div>
    );
  }

  const openDate = message.openTimestamp ? new Date(message.openTimestamp.seconds * 1000) : null;
  const isLocked = openDate && openDate > new Date();
  const formattedTimestamp = message.timestamp
    ? format(new Date(message.timestamp), "MMMM d, yyyy 'at' h:mm a")
    : 'a few moments ago';

  return (
    <>
      <div className="flex min-h-dvh flex-col">
        <main className="flex-1">
          <div className="container mx-auto max-w-2xl px-4 py-8 md:py-16">
            <div className="flex justify-between items-center mb-4">
              <Button
                variant="link"
                onClick={() => router.back()}
                className="pl-0 text-muted-foreground capitalize"
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Back to {message.recipient}'s bottle
              </Button>
              <div className="flex items-center gap-1">
                {!isLocked && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsShareModalOpen(true)}
                    aria-label="Share this message"
                  >
                    <Share2 className="h-5 w-5" />
                  </Button>
                )}
                {/* Reporting route promised by the Terms. Available on locked
                    messages too — a sealed note can still be abusive. */}
                <ReportMessageDialog
                  messageId={message.id}
                  recipient={message.recipient}
                />
              </div>
            </div>

            <div className="space-y-8 animate-in fade-in-0 duration-1000">
              <div ref={messageCardRef}>
                {isLocked ? (
                  <Card>
                    <CardContent className="relative p-6 space-y-4 text-center">
                      <div className="flex flex-col items-center gap-6 py-8">
                        <Image
                          src="https://image2url.com/r2/bucket1/images/1766564087454-99f170fe-9000-483b-9a5f-f236267a2ca7.png"
                          alt="Lock icon"
                          width={128}
                          height={128}
                          className="h-32 w-32"
                        />
                        <p className="text-muted-foreground font-normal">
                          opens at{' '}
                          <span className="font-semibold text-foreground">
                            {format(openDate, 'MMMM d, yyyy')}
                          </span>
                        </p>
                        <CountdownTimer unlockDate={openDate} />
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="relative p-6 space-y-4">
                      <p className="font-normal capitalize pl-4 text-lg text-foreground">
                        For <span className="font-playfair italic">{message.recipient}</span>,
                      </p>
                      <blockquote className="border-l-2 border-border pl-4 italic">
                        {message.content}
                      </blockquote>
                      {message.photo && (
                        <div className="mt-6 space-y-2">
                          <Image
                            src={message.photo}
                            alt="Attached image for message"
                            width={500}
                            height={500}
                            className="w-full rounded-md border"
                            unoptimized
                          />
                        </div>
                      )}
                      {message.spotifyTrackId && (
                        <div className="mt-6 space-y-2">
                          <SpotifyEmbed trackId={message.spotifyTrackId} />
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="p-6 pt-0 text-sm text-muted-foreground justify-end">
                      <p>{formattedTimestamp}</p>
                    </CardFooter>
                  </Card>
                )}
              </div>

              {/* Below the message, outside the card that gets captured as a
                  shareable image, and clear of the back and share controls at
                  the top — so an ad can't be mistaken for part of the note or
                  clicked by accident while navigating. Hidden entirely on a
                  sealed message: there is nothing to read yet. */}
              {!isLocked && <AdBanner slot={AD_SLOTS.messageBelow} />}
            </div>
          </div>
        </main>
      </div>

      <ShareDialog
        open={isShareModalOpen}
        onOpenChange={setIsShareModalOpen}
        url={shareUrl}
        title={`A message in a bottle for ${message.recipient}`}
        text="Someone left an anonymous message in the ocean."
        getImage={captureCardImage}
      />
    </>
  );
}
