'use client';

import { Heart, Send, Inbox } from 'lucide-react';
import Link from 'next/link';
import { Button } from './ui/button';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <Link
          href="/"
          className="flex items-center space-x-2 font-bold"
        >
          <span className="hidden font-headline md:inline">Message in a Bottle</span>
          <span className="font-headline md:hidden">mitb</span>
        </Link>
        <nav className="ml-auto flex items-center space-x-2">
          <Button variant="ghost" asChild className="hidden md:inline-flex">
            <Link href="/send">
              Send Message
            </Link>
          </Button>
          <Button variant="ghost" asChild className="hidden md:inline-flex">
            <Link href="/browse">
              Browse
            </Link>
          </Button>
          <Button variant="ghost" asChild className="hidden md:inline-flex">
            <Link href="/support">
              Support Us
            </Link>
          </Button>
          <Button variant="ghost" asChild size="icon" className="md:hidden">
            <Link href="/send">
              <Send />
              <span className="sr-only">Send Message</span>
            </Link>
          </Button>
          <Button variant="ghost" asChild size="icon" className="md:hidden">
            <Link href="/browse">
              <Inbox />
              <span className="sr-only">Browse</span>
            </Link>
          </Button>
          <Button variant="ghost" asChild size="icon" className="md:hidden">
            <Link href="/support">
              <Heart />
              <span className="sr-only">Support Us</span>
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
