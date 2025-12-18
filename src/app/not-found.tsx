
'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Frown } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background text-center">
      <main className="flex w-full flex-1 flex-col items-center justify-center p-4">
        <Frown className="h-24 w-24 text-muted-foreground" />
        <h1 className="mt-8 font-headline text-4xl font-bold tracking-tighter sm:text-5xl">
          404 - Lost at Sea
        </h1>
        <p className="mt-4 max-w-md text-muted-foreground">
          The page you're looking for seems to have drifted away. Let's get you
          back to shore.
        </p>
        <Button asChild className="mt-8" size="lg">
          <Link href="/">Return Home</Link>
        </Button>
      </main>
    </div>
  );
}
