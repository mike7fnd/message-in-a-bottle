
'use client';

import { useState, useEffect } from 'react';
import { type Message } from '@/lib/data';
import { getCachedMessagesForRecipient, getCachedContent } from '@/lib/cached-data';
import { type SiteContent } from '@/lib/content';
import { useParams, useRouter } from 'next/navigation';
import { MessageCard } from '@/components/MessageCard';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { FavoritesProvider } from '@/context/FavoritesContext';
import { Card, CardContent, CardFooter } from '@/components/ui/card';

function BottlePageContent() {
  const params = useParams<{ name: string }>();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [content, setContent] = useState<SiteContent | null>(null);
  const recipientName = decodeURIComponent(params.name);

  useEffect(() => {
    async function fetchData() {
      const [fetchedContent, cachedMessages] = await Promise.all([
        // SWR callback: update content if background revalidation returns fresher data
        getCachedContent((fresh) => setContent(fresh)),
        getCachedMessagesForRecipient(
          recipientName,
          // SWR callback: update messages in the background without a loading flash
          (fresh) => setMessages(fresh),
        ),
      ]);

      setContent(fetchedContent);
      setMessages(cachedMessages);
      setIsLoading(false);
    }

    if (recipientName) {
      fetchData();
    }
  }, [recipientName]);

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
    <div className="flex min-h-dvh flex-col">
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
              <Link href={`/message/${message.id}`} key={message.id} className="block group">
                <MessageCard
                  message={message}
                  style={{ animationDelay: `${index * 150}ms` }}
                  className="animate-in fade-in-0 slide-in-from-bottom-5 duration-500 fill-mode-both"
                />
              </Link>
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
