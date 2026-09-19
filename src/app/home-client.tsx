
'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { ThemeDoubleClickWrapper } from '@/components/ThemeDoubleClickWrapper';
import { type SiteContent } from '@/lib/content';
import { useFeatures } from '@/hooks/use-features';
import { cn } from '@/lib/utils';
import { Mail } from 'lucide-react';

const TiktokIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.73-1.52.4-.65.59-1.43.58-2.22.01-2.55.01-5.1.01-7.65Z" />
  </svg>
);

const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
  </svg>
);


/**
 * Light/dark artwork, swapped with the `dark:` class variant instead of from
 * `resolvedTheme` in JavaScript.
 *
 * This is why it matters: the page used to withhold *all* of its markup behind
 * a `mounted` flag so the theme could resolve first, which meant the server
 * sent a skeleton with no text and no headings. Search crawlers and anyone
 * without JS saw an empty page. Swapping in CSS lets the server render the real
 * page immediately, with no hydration mismatch.
 *
 * The dark copy is marked decorative so assistive tech doesn't announce the
 * same alt text twice.
 */
function ThemedImage({
  light,
  dark,
  alt,
  className,
  priority,
  ...rest
}: Omit<React.ComponentProps<typeof Image>, 'src' | 'alt' | 'className'> & {
  light: string;
  dark: string;
  alt: string;
  className?: string;
}) {
  return (
    <>
      {light && (
        <Image
          {...rest}
          priority={priority}
          src={light}
          alt={alt}
          className={cn(className, 'dark:hidden')}
        />
      )}
      {dark && (
        <Image
          {...rest}
          // Eager rather than priority: preloading both themes would mean two
          // large preloads competing for the LCP.
          loading="eager"
          src={dark}
          alt=""
          aria-hidden="true"
          className={cn(className, 'hidden dark:block')}
        />
      )}
    </>
  );
}

export default function HomeClient({ content }: { content: SiteContent }) {
  // Admin-controlled flag from Firestore `config/features`. Defaults to visible
  // while loading so the section never flashes away under a reader.
  const { homeMediaSectionVisible } = useFeatures();

  return (
    <ThemeDoubleClickWrapper>
      <div className="flex min-h-dvh flex-col">
        <main className="flex flex-1 flex-col items-center justify-center bg-background text-center">
          <div className="space-y-4 pt-8 md:pt-16 w-full">
            {/* The only h1 on the page. Visually hidden because the hero
                artwork already carries the wordmark — the text is here so the
                heading outline and screen readers aren't left without one. */}
            <h1 className="sr-only">
              Message in a Bottle — send an anonymous message
            </h1>
            <div className="relative w-full h-[38rem] sm:h-[48rem]">
              <ThemedImage
                light={content.homeHeroImageLight}
                dark={content.homeHeroImageDark}
                alt="A glass bottle holding a rolled-up letter, drifting on open water"
                fill
                priority
                sizes="100vw"
                className="object-contain"
              />
            </div>
            <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl px-4">
              {content.homeSubtitle}
            </p>
          </div>

          <div className="flex w-full flex-col justify-center gap-4 px-4 pt-4 pb-16 sm:w-auto sm:flex-row md:pb-24">
            <Button asChild size="lg">
              <Link href="/send">{content.homeSendButton}</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="shadow-subtle">
              <Link href="/browse">{content.homeBrowseButton}</Link>
            </Button>
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-semibold tracking-tight">
              Send a dedication message
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">Express your feelings in a unique way.</p>
          </div>

          {/* The "with songs, photos, and sketch" heading, the "over a 100M
              songs from Spotify" line and the accompanying image were removed:
              the send form has no photo, sketch or song UI, so they advertised
              features the site does not currently offer. The bottom fade moved
              onto the remaining image, which now ends the section. */}
          {homeMediaSectionVisible && (
            <div className="w-full mt-4">
              <div className="relative h-[40vh] md:h-[45vh] w-full overflow-hidden">
                <Image
                  src="https://image2url.com/images/1766306329932-21f9577e-b432-4308-9568-2c4b21b59431.jpeg"
                  alt="A handwritten dedication letter laid out beside a glass bottle"
                  fill
                  sizes="100vw"
                  className="object-contain"
                />
                <div className="absolute inset-x-0 bottom-0 h-[10%] bg-gradient-to-t from-background to-transparent pointer-events-none" />
              </div>
            </div>
          )}

          <div className="container mx-auto max-w-2xl text-center py-16 md:py-24">
            {/* Purely decorative grouping — alt="" keeps screen readers from
                announcing the same illustration three times. */}
            <div className="relative h-32 w-48 mx-auto mb-4">
              <ThemedImage
                light={content.browseBottleImageLight}
                dark={content.browseBottleImageDark}
                alt=""
                width={96}
                height={96}
                className="absolute top-0 left-1/2 -translate-x-1/2 h-24 w-24 object-contain z-10 -rotate-6"
              />
              <ThemedImage
                light={content.browseBottleImageLight}
                dark={content.browseBottleImageDark}
                alt=""
                width={80}
                height={80}
                className="absolute bottom-0 left-0 h-20 w-20 object-contain rotate-12 opacity-80"
              />
              <ThemedImage
                light={content.browseBottleImageLight}
                dark={content.browseBottleImageDark}
                alt=""
                width={80}
                height={80}
                className="absolute bottom-0 right-0 h-20 w-20 object-contain -rotate-12 opacity-80"
              />
            </div>
            <div className="relative">
              <h2 className="text-5xl md:text-7xl tracking-tighter text-primary font-abril">Set it adrift</h2>
              <div className="absolute inset-x-0 bottom-0 h-full bg-gradient-to-t from-background to-transparent pointer-events-none"></div>
            </div>
            <p className="mt-2 text-lg font-semibold text-foreground">No name, no reply, no pressure</p>
            <p className="max-w-md mx-auto mt-4 text-muted-foreground">
              Join the current and share your own feelings anonymously. What will you send?
            </p>
            <div className="mt-8">
              <Button asChild size="lg">
                <Link href="/send">Send a Message Now</Link>
              </Button>
            </div>
          </div>

          <section className="container mx-auto max-w-2xl text-center py-16 md:py-24">
            <Image
              src="https://image2url.com/images/1766356602104-3c5a46eb-6e5d-431c-88d1-c20df83cf767.jpg"
              alt="Mike Fernandez, who builds and runs Message in a Bottle"
              width={100}
              height={100}
              className="rounded-full mx-auto mb-4 shadow-lg"
            />
            <p className="mt-2 text-lg text-muted-foreground">
              developed by Mike Fernandez <br /> 12-10-25
            </p>
            <div className="mt-6 flex justify-center gap-4">
              <Link href="https://www.tiktok.com/@dvbmke" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
                <Button variant="outline" size="icon" className="shadow-subtle">
                  <TiktokIcon className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="https://www.instagram.com/dvbmike?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <Button variant="outline" size="icon" className="shadow-subtle">
                  <InstagramIcon className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="mailto:mikefernandex227@gmail.com" aria-label="Email">
                <Button variant="outline" size="icon" className="shadow-subtle">
                  <Mail className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </section>
        </main>
      </div>
    </ThemeDoubleClickWrapper>
  );
}
