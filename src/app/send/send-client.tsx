
'use client';

import { Header } from '@/components/Header';
import SendMessageForm from '@/components/SendMessageForm';
import { type SiteContent } from '@/lib/content';

export function SendPageClient({ content }: { content: SiteContent }) {
    return (
        <div className="flex min-h-dvh flex-col bg-background">
          <Header />
          <main className="flex-1">
            <div className="container mx-auto max-w-2xl px-4 py-8 md:py-16">
              <section
                id="send"
                className="animate-in fade-in-0 duration-500"
                aria-labelledby="send-heading"
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
                <SendMessageForm content={content} />
              </section>
            </div>
          </main>
        </div>
    )
}
