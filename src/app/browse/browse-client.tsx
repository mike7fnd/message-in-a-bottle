//final
'use client';

import { useEffect, useRef, useLayoutEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { type Recipient } from '@/lib/data';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { useIntersectionObserver } from '@/hooks/use-intersection-observer';
import { Button } from '@/components/ui/button';
import { useRecipientContext } from '@/context/RecipientContext';
import { useDebounce } from '@/hooks/use-debounce';
import { useTheme } from 'next-themes';
import { type SiteContent } from '@/lib/content';

function RecipientCard({ recipient, content }: { recipient: Recipient, content: SiteContent }) {
  const { setScrollPosition } = useRecipientContext();
  const { resolvedTheme } = useTheme();

  const defaultImage = resolvedTheme === 'dark' ? content.browseBottleImageDark : content.browseBottleImageLight;
  const hoverImage = resolvedTheme === 'dark' ? content.browseBottleHoverImageDark : content.browseBottleHoverImageLight;


  return (
    <Link
      href={`/bottle/${recipient.name}`}
      key={recipient.name}
      className="group"
      onClick={() => setScrollPosition(window.scrollY)}
    >
        <div className="flex flex-col items-center gap-2 text-center">
            <div className="relative h-40 w-40 transform transition-transform duration-200 group-hover:scale-110 group-hover:rotate-6">
              {defaultImage && <Image
                src={defaultImage}
                alt="Bottle illustration"
                width={160}
                height={160}
                className="h-40 w-40 object-contain"
                unoptimized
              />}
              {hoverImage && <Image
                src={hoverImage}
                alt="Glowing bottle illustration"
                width={160}
                height={160}
                className="absolute inset-0 h-40 w-40 object-contain opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                unoptimized
              />}
            </div>
            <span className="capitalize font-semibold text-2xl">{recipient.name}</span>
        </div>
        <p className="text-center text-sm text-muted-foreground mt-2">
            {recipient.messageCount} {content.browseNewMessages}
            {recipient.messageCount > 1 ? 's' : ''}
        </p>
    </Link>
  );
}

function RecipientSkeleton() {
    return (
        <div className="flex flex-col items-center gap-2">
            <Skeleton className="h-40 w-40 rounded-full" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="mx-auto h-4 w-16 mt-2" />
        </div>
    );
}

export function BrowsePageClient({ content }: { content: SiteContent }) {
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
              {content.browseTitle}
            </h1>
            <p className="text-muted-foreground">
              {content.browseSubtitle}
            </p>
          </div>
          <div className="sticky top-0 z-10 py-4">
            <div className="relative mx-auto max-w-md">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground z-10" />
              <Input
                type="text"
                placeholder={content.browseSearchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10"
              />
            </div>
          </div>
          
          <div className="mt-8 grid grid-cols-1 gap-y-16 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-20">
            {isLoading && !recipients.length &&
              Array.from({ length: 2 }).map((_, index) => (
                <RecipientSkeleton key={index} />
              ))}
            
            {recipients.map((recipient) => (
                <RecipientCard key={recipient.name} recipient={recipient} content={content} />
            ))}

          </div>

          <div ref={loadMoreRef} className="mt-8 flex justify-center">
            {isLoadingMore && (
                 <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 w-full">
                    <RecipientSkeleton />
                    <RecipientSkeleton />
                 </div>
            )}
            {!isLoadingMore && hasMore && !debouncedSearchTerm && (
                 <Button onClick={loadMore} variant="outline">{content.browseLoadMore}</Button>
            )}
            {!hasMore && !isLoading && recipients.length > 0 && !debouncedSearchTerm && (
                <p className="text-center text-sm text-muted-foreground">{content.browseEnd}</p>
            )}
            {recipients.length === 0 && !isLoading && searchTerm && (
                <p className="text-center text-muted-foreground">{content.browseNoResults} "{searchTerm}".</p>
            )}
            {error && <p className="text-center text-destructive">{error}</p>}
          </div>
        </div>
      </main>
    </div>
  );
}
