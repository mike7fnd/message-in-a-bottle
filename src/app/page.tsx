
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Header } from '@/components/Header';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useTheme } from 'next-themes';
import { ThemeDoubleClickWrapper } from '@/components/ThemeDoubleClickWrapper';
import { Skeleton } from '@/components/ui/skeleton';

export default function Home() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const lightHero = PlaceHolderImages[0];
  const darkHero = PlaceHolderImages.find(p => p.id === 'dark-mode-hero');
  const lightHintImage = PlaceHolderImages.find(p => p.id === 'double-click-light');
  const darkHintImage = PlaceHolderImages.find(p => p.id === 'double-click-dark');

  const heroImage = resolvedTheme === 'dark' && darkHero ? darkHero : lightHero;
  const hintImage = resolvedTheme === 'dark' ? darkHintImage : lightHintImage;

  if (!mounted || !heroImage || !hintImage) {
    // Render a skeleton or placeholder while theme is resolving to avoid hydration mismatch
    return (
      <div className="flex min-h-dvh flex-col">
        <Header />
        <main className="flex flex-1 flex-col items-center justify-center bg-background text-center">
          <div className="space-y-4 pt-8 md:pt-16">
            <div className="w-80 h-80 bg-muted rounded-full mx-auto animate-pulse"></div>
            <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl px-4">
              Send anonymous messages into the digital ocean.
            </p>
          </div>
          <div className="flex w-full flex-col justify-center gap-4 px-4 pt-4 pb-8 sm:w-auto sm:flex-row md:pb-16">
            <Button asChild size="lg">
              <Link href="/send">Send a Message</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/browse">Browse Messages</Link>
            </Button>
          </div>
           <div className="pb-16 text-center">
                <h3 className="mt-4 text-2xl font-semibold tracking-tight">Reading at the middle of the night?</h3>
                <p className="mt-2 text-md text-muted-foreground">
                    Double-click the lamp to active dark mode.
                </p>
                 <div className="mt-4 flex justify-center">
                    <Skeleton className="h-24 w-48" />
                </div>
            </div>
        </main>
      </div>
    );
  }

  return (
    <ThemeDoubleClickWrapper>
        <div className="flex min-h-dvh flex-col">
        <Header />
        <main className="flex flex-1 flex-col items-center justify-center bg-background text-center">
            <div className="space-y-4 pt-8 md:pt-16 w-full">
              <div className="relative w-full h-[32rem] sm:h-[48rem]">
                <Image
                    src={heroImage.imageUrl}
                    alt={heroImage.description}
                    fill
                    className="object-contain"
                    data-ai-hint={heroImage.imageHint}
                    unoptimized
                />
              </div>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl px-4">
                  Send anonymous messages into the digital ocean.
              </p>
            </div>
            <div className="flex w-full flex-col justify-center gap-4 px-4 pt-4 pb-8 sm:w-auto sm:flex-row md:pb-16">
            <Button asChild size="lg">
                <Link href="/send">Send a Message</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
                <Link href="/browse">Browse Messages</Link>
            </Button>
            </div>

            <div className="container mx-auto max-w-2xl pb-16">
              <div className="grid grid-cols-2 gap-8 items-center">
                <div className="text-center md:text-left">
                    <h3 className="text-2xl font-semibold tracking-tight">Reading at the middle of the night?</h3>
                    <p className="mt-2 text-md text-muted-foreground">
                        Double-click the lamp to active dark mode.
                    </p>
                </div>
                <div className="flex justify-center">
                    <Image
                        src={hintImage.imageUrl}
                        alt={hintImage.description}
                        width={192}
                        height={96}
                        className="rounded-lg"
                        unoptimized
                    />
                </div>
              </div>
            </div>
        </main>
        </div>
    </ThemeDoubleClickWrapper>
  );
}
