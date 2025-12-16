
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Header } from '@/components/Header';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useTheme } from 'next-themes';

export default function Home() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const lightHero = PlaceHolderImages[0];
  const darkHero = PlaceHolderImages.find(p => p.id === 'dark-mode-hero');
  
  // Determine which hero image to show
  const heroImage = resolvedTheme === 'dark' && darkHero ? darkHero : lightHero;

  if (!mounted || !heroImage) {
    // Render a skeleton or placeholder while theme is resolving to avoid hydration mismatch
    return (
      <div className="flex min-h-dvh flex-col">
        <Header />
        <main className="flex flex-1 flex-col items-center justify-center bg-background text-center">
          <div className="space-y-4 px-4 pt-8 md:pt-16">
            <div className="w-96 h-96 md:w-80 md:h-80 bg-muted rounded-full mx-auto animate-pulse"></div>
            <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
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
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="flex flex-1 flex-col items-center justify-center bg-background text-center">
        <div className="space-y-4 px-4 pt-8 md:pt-16">
          <Image
            src={heroImage.imageUrl}
            alt={heroImage.description}
            width={400}
            height={400}
            className="mx-auto w-96 h-96 md:w-80 md:h-80 object-contain"
            data-ai-hint={heroImage.imageHint}
            unoptimized={true}
          />
          <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
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
      </main>
    </div>
  );
}
