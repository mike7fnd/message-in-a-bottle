
'use client';

import { useState, useEffect } from 'react';
import { getMessagesForRecipient, type Message } from '@/lib/data';
import { MessageCard } from '@/components/MessageCard';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { useMessageCache } from '@/context/MessageCacheContext';

type Props = {
    params: { name: string };
};

export function BottlePageClient({ params }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const recipientName = decodeURIComponent(params.name);
  const { getCachedMessages, setCachedMessages } = useMessageCache();


  useEffect(() => {
    async function fetchMessages() {
      const cached = getCachedMessages(recipientName);
      if (cached) {
        setMessages(cached);
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
        fetchMessages();
    }
  }, [recipientName, getCachedMessages, setCachedMessages]);

  if (isLoading) {
    return (
      <div className="flex min-h-dvh flex-col">
        <Header />
        <main className="flex-1">
          <div className="container mx-auto max-w-2xl px-4 py-8 md:py-16">
            <Skeleton className="mb-4 h-6 w-48" />
            <Skeleton className="mb-8 h-10 w-64" />
            <div className="space-y-8">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto max-w-2xl px-4 py-8 md:py-16">
          <div className="mb-4">
            <Button
              asChild
              variant="link"
              className="pl-0 text-muted-foreground"
            >
              <Link href="/browse">
                <ChevronLeft className="mr-1 h-4 w-4" />
                Back to all bottles
              </Link>
            </Button>
          </div>
          <h1 className="truncate font-headline text-3xl font-bold tracking-tighter sm:text-4xl">
            letter's for <span className="capitalize">{recipientName}</span>
          </h1>
          <p className="mt-1 text-muted-foreground">Click each message to open.</p>

          <div className="mt-8 space-y-8">
            {messages.map((message, index) => (
              <Link href={`/message/${message.id}`} key={message.id} className="block">
                <MessageCard
                  content={message.content}
                  timestamp={
                    message.timestamp
                      ? format(
                          new Date(message.timestamp),
                          "MMMM d, yyyy 'at' h:mm a"
                        )
                      : 'Just now'
                  }
                  style={{ animationDelay: `${index * 150}ms` }}
                  className="animate-in fade-in-0 slide-in-from-bottom-5 duration-500 fill-mode-both"
                />
              </Link>
            ))}
            {messages.length === 0 && !isLoading && (
              <p className="text-center text-muted-foreground">
                No messages in this bottle yet.
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
