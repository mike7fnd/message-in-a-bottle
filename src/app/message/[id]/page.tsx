'use client';

import { useState, useEffect } from 'react';
import { getMessageById, type Message } from '@/lib/data';
import { useParams, notFound } from 'next/navigation';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function MessagePage() {
  const params = useParams<{ id: string }>();
  const [message, setMessage] = useState<Message | null | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchMessage() {
      setIsLoading(true);
      try {
        const fetchedMessage = await getMessageById(params.id);
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
  }, [params.id]);

  if (isLoading || message === undefined) {
    return (
      <div className="flex min-h-dvh flex-col">
        <Header />
        <main className="flex-1">
          <div className="container mx-auto max-w-2xl px-4 py-8 md:py-16">
            <Skeleton className="mb-4 h-6 w-48" />
            <Card>
              <CardContent className="p-6">
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
          <div className="container mx-auto max-w-2xl px-4 py-8 md:py-16">
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
        <div className="container mx-auto max-w-2xl px-4 py-8 md:py-16">
          <div className="mb-4">
            <Button
              asChild
              variant="link"
              className="pl-0 text-muted-foreground"
            >
              <Link href={`/bottle/${message.recipient}`}>
                <ChevronLeft className="mr-1 h-4 w-4" />
                Back to {message.recipient}'s bottle
              </Link>
            </Button>
          </div>

          <Card>
            <CardContent className="relative p-6">
              <MessageSquare className="absolute -top-3 -left-3 h-8 w-8 text-muted" />
              <blockquote className="border-l-2 border-border pl-4 italic text-muted-foreground">
                {message.content}
              </blockquote>
            </CardContent>
            <CardFooter className="p-6 pt-0 text-sm text-muted-foreground">
              <p>Received on {formattedTimestamp}</p>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
}
