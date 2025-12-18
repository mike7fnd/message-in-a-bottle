
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Header } from '@/components/Header';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { ThemeDoubleClickWrapper } from '@/components/ThemeDoubleClickWrapper';
import { Skeleton } from '@/components/ui/skeleton';
import { type SiteContent } from '@/lib/content';

export default function HomeClient({ content }: { content: SiteContent }) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const heroImage = resolvedTheme === 'dark' ? content.homeHeroImageDark : content.homeHeroImageLight;
  const hintImage = resolvedTheme === 'dark' ? content.homeHintImageDark : content.homeHintImageLight;

  if (!mounted) {
    // Render a skeleton or placeholder while theme is resolving to avoid hydration mismatch
    return (
      <div className="flex min-h-dvh flex-col">
        <Header />
        <main className="flex flex-1 flex-col items-center justify-center bg-background text-center">
          <div className="space-y-4 pt-8 md:pt-16">
            <div className="w-80 h-80 bg-muted rounded-full mx-auto animate-pulse"></div>
            <div className="mx-auto max-w-[700px] text-muted-foreground md:text-xl px-4 h-6">
              <Skeleton className="h-6 w-96 mx-auto" />
            </div>
          </div>
          <div className="flex w-full flex-col justify-center gap-4 px-4 pt-4 pb-8 sm:w-auto sm:flex-row md:pb-16">
            <Button asChild size="lg">
              <Link href="/send">{content.homeSendButton}</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/browse">{content.homeBrowseButton}</Link>
            </Button>
          </div>
           <div className="pb-16 text-center">
                <h3 className="mt-4 text-2xl font-semibold tracking-tight"><Skeleton className="h-8 w-80 mx-auto" /></h3>
                <div className="mt-2 text-md text-muted-foreground h-5">
                    <Skeleton className="h-5 w-64 mx-auto" />
                </div>
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
              <div className="relative w-full h-[38rem] sm:h-[48rem]">
                <Image
                    src={heroImage}
                    alt="Hero image of a message in a bottle"
                    fill
                    className="object-contain"
                    unoptimized
                />
              </div>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl px-4">
                  {content.homeSubtitle}
              </p>
            </div>
            <div className="flex w-full flex-col justify-center gap-4 px-4 pt-4 pb-8 sm:w-auto sm:flex-row md:pb-16">
            <Button asChild size="lg">
                <Link href="/send">{content.homeSendButton}</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="shadow-subtle">
                <Link href="/browse">{content.homeBrowseButton}</Link>
            </Button>
            </div>

            <div className="container mx-auto max-w-2xl pt-16 md:pt-0 pb-32 md:pb-16">
              <div className="grid grid-cols-2 gap-8 items-center">
                <div className="text-center md:text-left">
                    <h3 className="text-2xl font-semibold tracking-tight">{content.homeDarkModeTitle}</h3>
                    <p className="mt-2 text-md text-muted-foreground">
                        {content.homeDarkModeSubtitle}
                    </p>
                </div>
                <div className="flex justify-center">
                    <Image
                        src={hintImage}
                        alt="Hint image for changing theme"
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
