
'use client';

import { useEffect, useRef, useLayoutEffect } from 'react';
import { Header } from '@/components/Header';
import { type Recipient } from '@/lib/data';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { useIntersectionObserver } from '@/hooks/use-intersection-observer';
import { Button } from '@/components/ui/button';
import { useRecipientContext } from '@/context/RecipientContext';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/lib/utils';

function RecipientCard({ recipient }: { recipient: Recipient }) {
  const { setScrollPosition } = useRecipientContext();
  return (
    <Link
      href={`/bottle/${recipient.name}`}
      key={recipient.name}
      className="group"
      onClick={() => setScrollPosition(window.scrollY)}
    >
      <Card className="transform border-0 bg-transparent shadow-none transition-transform duration-200 group-hover:scale-105">
        <CardHeader>
          <CardTitle className="flex flex-col items-center gap-2 text-center">
            <Image
              src="/images/bottle-default.png"
              alt="Message in a bottle"
              width={160}
              height={160}
              className="h-40 w-40 transition-all duration-300 group-hover:rotate-3 group-hover:brightness-110"
              unoptimized // <- add this
            />
            <span className="capitalize">{recipient.name}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-sm text-muted-foreground">
            {recipient.messageCount} New Message
            {recipient.messageCount > 1 ? 's' : ''}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

function RecipientSkeleton() {
    return (
        <Card className="transform border-0 bg-transparent shadow-none transition-transform duration-200">
            <CardHeader>
                <CardTitle className="flex flex-col items-center gap-2 text-center">
                    <Skeleton className="h-40 w-40 rounded-full" />
                    <Skeleton className="h-6 w-24" />
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Skeleton className="mx-auto h-4 w-16" />
            </CardContent>
        </Card>
    );
}

export default function BrowsePage() {
    const {
        recipients,
        isLoading,
        isLoadingMore,
        hasMore,
        error,
        searchTerm,
        setSearchTerm,
        loadMore,
        scrollPosition,
    } = useRecipientContext();

    const loadMoreRef = useRef(null);
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    useIntersectionObserver({
        target: loadMoreRef,
        onIntersect: loadMore,
        enabled: hasMore && !isLoadingMore && !debouncedSearchTerm,
    });

    useLayoutEffect(() => {
      if (scrollPosition > 0) {
        window.scrollTo(0, scrollPosition);
      }
    }, [scrollPosition]);


  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto max-w-2xl px-4 py-8 md:py-16">
          <div className="space-y-2 text-center">
            <h1 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl">
              Browse Bottles
            </h1>
            <p className="text-muted-foreground">
              Select a recipient to view their messages.
            </p>
          </div>
          <div className="sticky top-[60px] z-10 py-4">
            <div className="relative mx-auto max-w-md">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search for a recipient..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10"
              />
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {isLoading && !recipients.length &&
              Array.from({ length: 4 }).map((_, index) => (
                <RecipientSkeleton key={index} />
              ))}

            {recipients.map((recipient) => (
                <RecipientCard key={recipient.name} recipient={recipient} />
            ))}

          </div>

          <div ref={loadMoreRef} className="mt-8 flex justify-center">
            {isLoadingMore && (
                 <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 w-full">
                    <RecipientSkeleton />
                    <RecipientSkeleton />
                 </div>
            )}
            {!isLoadingMore && hasMore && !debouncedSearchTerm && (
                 <Button onClick={loadMore} variant="outline">Load More</Button>
            )}
            {!hasMore && !isLoading && recipients.length > 0 && !debouncedSearchTerm && (
                <p className="text-center text-sm text-muted-foreground">You've reached the end.</p>
            )}
            {recipients.length === 0 && !isLoading && searchTerm && (
                <p className="text-center text-muted-foreground">No bottles found for "{searchTerm}".</p>
            )}
            {error && <p className="text-center text-destructive">{error}</p>}
          </div>
        </div>
      </main>
    </div>
  );
}
