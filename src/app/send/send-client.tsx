
'use client';

import { Header } from '@/components/Header';
import SendMessageForm from '@/components/SendMessageForm';
import { type SiteContent } from '@/lib/content';
import { useRef } from 'react';

export function SendPageClient({ content }: { content: SiteContent }) {
    const mainRef = useRef<HTMLElement>(null);

    return (
        <div className="flex min-h-dvh flex-col bg-background">
          <Header />
          <main ref={mainRef} className="flex-1 flex flex-col">
            <div className="container mx-auto max-w-5xl px-4 py-8 md:py-16 flex-1 flex flex-col">
              <section
                id="send"
                aria-labelledby="send-heading"
                className='flex-1 flex flex-col'
              >
                <div className="space-y-2 text-center">
                  <h2
                    id="send-heading"
                    className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl"
                  >
                    {content.sendTitle}
                  </h2>
                  <p className="text-muted-foreground">
                    {content.sendSubtitle}
                  </p>
                </div>
                <div className="mt-8 flex-1 flex flex-col justify-center">
                    <SendMessageForm content={content} />
                </div>
              </section>
            </div>
          </main>
        </div>
    )
}
