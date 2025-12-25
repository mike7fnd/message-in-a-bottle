
'use client';

import { useState, useEffect, useRef } from 'react';
import { getMessagesForRecipient, type Message } from '@/lib/data';
import { useParams, useRouter } from 'next/navigation';
import { MessageCard } from '@/components/MessageCard';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useMessageCache } from '@/context/MessageCacheContext';
import { getContent, type SiteContent } from '@/lib/content';
import { FavoritesProvider } from '@/context/FavoritesContext';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { cn } from '@/lib/utils';


function InteractiveMessageCard({ message, index }: { message: Message, index: number }) {
    const cardRef = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        if (!cardRef.current) return;

        const card = cardRef.current;

        const handleScroll = () => {
            const { top, height } = card.getBoundingClientRect();
            const viewportHeight = window.innerHeight;

            const cardCenter = top + height / 2;
            const viewportCenter = viewportHeight / 2;

            const distance = Math.abs(viewportCenter - cardCenter);
            const maxDistance = viewportHeight / 2;

            // Scale and opacity are calculated based on distance from the center
            // The card is at full size (scale=1) when its center is at the viewport center
            const scale = Math.max(0.8, 1 - (distance / maxDistance) * 0.2);
            // Opacity is at full (1) when its center is at the viewport center
            const opacity = Math.max(0.4, 1 - (distance / maxDistance) * 0.6);

            gsap.to(card, {
                scale: scale,
                opacity: opacity,
                duration: 0.5,
                ease: 'power3.out',
            });
        };

        // Initial call
        handleScroll();

        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, { scope: cardRef });


    return (
        <div
            ref={cardRef}
            style={{
                animationDelay: `${index * 150}ms`,
                transformOrigin: 'center center',
            }}
            className="animate-in fade-in-0 slide-in-from-bottom-5 duration-500 fill-mode-both"
        >
            <Link href={`/message/${message.id}`} className="block group">
                <MessageCard message={message} />
            </Link>
        </div>
    );
}


function BottlePageContent() {
  const params = useParams<{ name: string }>();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [content, setContent] = useState<SiteContent | null>(null);
  const recipientName = decodeURIComponent(params.name);
  const { getCachedMessages, setCachedMessages } = useMessageCache();


  useEffect(() => {
    async function fetchData() {
      const [fetchedContent, cachedMessages] = await Promise.all([
        getContent(),
        getCachedMessages(recipientName)
      ]);

      setContent(fetchedContent);

      if (cachedMessages) {
        setMessages(cachedMessages);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const fetchedMessages = await getMessagesForRecipient(recipientName);
        setMessages(fetchedMessages);
        setCachedMessages(recipientName, fetchedMessages);
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      } finally {
        setIsLoading(false);
      }
    }
    if (recipientName) {
        fetchData();
    }
  }, [recipientName, getCachedMessages, setCachedMessages]);

  const MessageSkeleton = () => (
    <Card>
      <CardContent className="relative p-6 pb-0">
        <div className="space-y-2 border-l-2 border-border pl-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center p-6">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-4 w-1/3" />
      </CardFooter>
    </Card>
  );

  if (isLoading || !content) {
    return (
      <div className="flex min-h-dvh flex-col">
        <main className="flex-1">
          <div className="container mx-auto max-w-2xl px-4 py-8 md:py-16">
            <div className="mb-4">
                <Skeleton className="h-6 w-48" />
            </div>
            <Skeleton className="mb-1 h-10 w-64" />
            <Skeleton className="h-5 w-48" />

            <div className="mt-8 space-y-8">
              <MessageSkeleton />
              <MessageSkeleton />
              <MessageSkeleton />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col" style={{ perspective: '1000px' }}>
      <main className="flex-1">
        <div className="container mx-auto max-w-2xl px-4 py-8 md:py-16">
          <div className="mb-4">
            <Button
              variant="link"
              onClick={() => router.back()}
              className="pl-0 text-muted-foreground"
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              {content.bottleBackButton}
            </Button>
          </div>
          <h1 className="truncate font-headline text-3xl font-bold tracking-tighter sm:text-4xl">
            {content.bottleTitle} <span className="capitalize">{recipientName}</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{content.bottleSubtitle}</p>

          <div className="mt-8 space-y-8">
            {messages.map((message, index) => (
               <InteractiveMessageCard key={message.id} message={message} index={index} />
            ))}
            {messages.length === 0 && !isLoading && (
              <p className="text-center text-muted-foreground">
                {content.bottleNoMessages}
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}


export default function BottlePage() {
    return (
        <FavoritesProvider>
            <BottlePageContent />
        </FavoritesProvider>
    )
}
