
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { getMessageById, type Message } from '@/lib/data';
import { notFound, useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  Share2,
  Download,
  Instagram,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { toPng } from 'html-to-image';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { FacebookShareButton, FacebookIcon } from 'react-share';

function CountdownTimer({ unlockDate }: { unlockDate: Date }) {
  const calculateTimeLeft = () => {
    const difference = +unlockDate - +new Date();
    let timeLeft = {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    };

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
      if (Object.values(newTimeLeft).every(val => val === 0) && (+unlockDate <= +new Date())) {
        window.location.reload();
      }
    }, 1000);

    return () => clearTimeout(timer);
  });

  const timerComponents = Object.entries(timeLeft).map(([interval, value]) => {
    const paddedValue = String(value).padStart(2, '0');
    return (
      <div key={interval} className="flex flex-col items-center">
        <span className="text-lg tracking-widest">{paddedValue}</span>
        <span className="text-xs uppercase text-muted-foreground">{interval}</span>
      </div>
    );
  });

  return (
    <div className="font-body font-light grid grid-cols-4 gap-2 text-center items-center">
      {timerComponents}
    </div>
  );
}


export default function MessagePage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [message, setMessage] = useState<Message | null | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const { toast } = useToast();
  const messageCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    async function fetchMessage() {
      setIsLoading(true);
      try {
        const fetchedMessage = await getMessageById(id);
        setMessage(fetchedMessage);

        if (!fetchedMessage) {
          notFound();
        }
      } catch (error) {
        console.error('Failed to fetch message:', error);
        setMessage(null);
      } finally {
        setIsLoading(false);
      }
    }
    fetchMessage();
  }, [id]);

   const generateAndShareImage = useCallback(async (shareType: 'native' | 'download') => {
    if (messageCardRef.current === null) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not capture message card.' });
      return;
    }
    setIsGenerating(true);

    try {
      const dataUrl = await toPng(messageCardRef.current, { cacheBust: true, pixelRatio: 2 });

      if (shareType === 'download') {
        const link = document.createElement('a');
        link.download = `message-for-${message?.recipient}.png`;
        link.href = dataUrl;
        link.click();
        return;
      }

      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `message-for-${message?.recipient}.png`, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `A message for ${message?.recipient}`,
          text: `I sent a message in a bottle to ${message?.recipient}!`,
        });
      } else {
        toast({ title: "Sharing not supported", description: "Your browser doesn't support direct image sharing. Please download the image instead." });
      }
    } catch (err) {
      console.error("Error generating image:", err);
      toast({
        variant: 'destructive',
        title: 'Oops!',
        description: 'Could not generate or share image. Please try again.',
      });
    } finally {
        setIsGenerating(false);
    }
  }, [message, toast]);

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
              {!isLocked && (
                <Button variant="ghost" size="icon" onClick={() => setIsShareModalOpen(true)}>
                    <Share2 className="h-5 w-5" />
                </Button>
              )}
            </div>

            <div className="space-y-8 animate-in fade-in-0 duration-1000">
                <div ref={messageCardRef}>
                    {isLocked ? (
                    <Card>
                        <CardContent className="relative p-6 space-y-4 text-center">
                            <div className="flex flex-col items-center gap-6 py-8">
                            <Image src="https://image2url.com/r2/bucket1/images/1766564087454-99f170fe-9000-483b-9a5f-f236267a2ca7.png" alt="Lock icon" width={128} height={128} className="h-32 w-32" unoptimized />
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
                        <p className="font-normal capitalize pl-4 text-lg text-foreground">For <span className="font-playfair italic">{message.recipient}</span>,</p>
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
                            <iframe
                                data-testid="embed-iframe"
                                style={{ borderRadius: '12px' }}
                                src={`https://open.spotify.com/embed/track/${message.spotifyTrackId}?utm_source=generator`}
                                width="100%"
                                height="152"
                                frameBorder="0"
                                allowFullScreen
                                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                                loading="lazy"
                            ></iframe>
                            </div>
                        )}
                        </CardContent>
                        <CardFooter className="p-6 pt-0 text-sm text-muted-foreground justify-end">
                        <p>{formattedTimestamp}</p>
                        </CardFooter>
                    </Card>
                    )}
                </div>
            </div>
          </div>
        </main>
      </div>

       <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
        <DialogContent className="max-w-xs w-[90vw]">
            <DialogHeader>
                <DialogTitle>Share this message</DialogTitle>
                <DialogDescription>
                    Share this bottle on social media or download it.
                </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2 pt-4">
                 <Button
                    onClick={() => generateAndShareImage('native')}
                    disabled={isGenerating}
                >
                    {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Share2 className="mr-2 h-5 w-5" />}
                    Share Message
                </Button>
                <Button onClick={() => generateAndShareImage('download')} variant="outline" disabled={isGenerating}>
                  {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Download className="mr-2"/>}
                  Download Image
                </Button>
            </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
