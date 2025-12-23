
'use client';

import { useState, useEffect } from 'react';
import { getMessageById, type Message } from '@/lib/data';
import { useParams, notFound, useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent, CardFooter, CardTitle, CardHeader } from '@/components/ui/card';
import { ImageIcon, Music } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';

export default function MessagePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [message, setMessage] = useState<Message | null | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const { id } = params;

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

  if (isLoading || message === undefined) {
    return (
      <div className="flex min-h-dvh flex-col">
        <Header />
        <main className="flex-1">
          <div className="container mx-auto max-w-5xl px-4 py-8 md:py-16">
            <Skeleton className="mb-4 h-6 w-48" />
            <Card>
              <CardHeader>
                 <Skeleton className="h-8 w-48" />
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <Skeleton className="h-24 w-full" />
              </CardContent>
              <CardFooter className="p-6 pt-0">
                <Skeleton className="h-4 w-64" />
              </CardFooter>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  if (!message) {
    // This case is handled by notFound(), but as a fallback:
    return (
      <div className="flex min-h-dvh flex-col">
        <Header />
        <main className="flex-1">
          <div className="container mx-auto max-w-5xl px-4 py-8 md:py-16">
            <p className="text-center">Message not found.</p>
          </div>
        </main>
      </div>
    );
  }

  const formattedTimestamp = message.timestamp
    ? format(new Date(message.timestamp), "MMMM d, yyyy 'at' h:mm a")
    : 'a few moments ago';

  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto max-w-5xl px-4 py-8 md:py-16">
          <div className="mb-4">
            <Button
              variant="link"
              onClick={() => router.back()}
              className="pl-0 text-muted-foreground capitalize"
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back to {message.recipient}'s bottle
            </Button>
          </div>

          <div className="space-y-8 animate-in fade-in-0 duration-1000">
            <Card
              style={{
                backgroundColor: 'white',
                position: 'relative',
                overflow: 'hidden',
                backgroundImage: 'repeating-linear-gradient(to bottom, transparent, transparent 23px, hsl(var(--border) / 0.2) 24px, hsl(var(--border) / 0.2) 24px)'
              }}
            >
              <CardContent className="relative p-6 space-y-4">
                <p className="font-normal capitalize pl-4 text-lg text-card-foreground/90">For <span className="font-playfair italic">{message.recipient}</span>,</p>
                <blockquote className="border-l-2 border-red-800/10 pl-4 italic text-card-foreground/80">
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
              <CardFooter className="p-6 pt-0 text-sm text-card-foreground/60 justify-end">
                <p>{formattedTimestamp}</p>
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
