'use client';

import { Header } from '@/components/Header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import Link from 'next/link';

export default function SupportPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto max-w-2xl px-4 py-8 md:py-16">
          <section
            id="support"
            className="animate-in fade-in-0 duration-500"
            aria-labelledby="support-heading"
          >
            <div className="space-y-2 text-center">
              <h1
                id="support-heading"
                className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl"
              >
                Support the Developers
              </h1>
              <p className="text-muted-foreground">
                If you enjoy this app, please consider supporting our work.
              </p>
            </div>
            <div className="mx-auto mt-12 max-w-md">
              <Card>
                <CardHeader className="items-center text-center">
                  <Heart className="h-12 w-12 text-red-500" />
                  <CardTitle>Your Support Matters</CardTitle>
                  <CardDescription>
                    Your contribution helps us maintain and improve this
                    application. Every little bit helps!
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center p-6">
                  <Button asChild size="lg">
                    <Link href="/donate">Donate Now</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
