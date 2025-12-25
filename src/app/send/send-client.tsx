
'use client';

import { type SiteContent } from '@/lib/content';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

const SendMessageForm = dynamic(() => import('@/components/SendMessageForm'), {
  ssr: false,
  loading: () => (
    <div className="mx-auto mt-8 max-w-xl">
        <Card>
            <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-20 w-full" />
                </div>
                 <div className="flex flex-col gap-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
            </CardContent>
        </Card>
    </div>
  ),
});


export function SendPageClient({ content }: { content: SiteContent }) {
    return (
        <div className="flex min-h-dvh flex-col bg-background">
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
