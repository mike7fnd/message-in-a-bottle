
'use client';

import Link from 'next/link';
import { Button } from './ui/button';
import { usePathname } from 'next/navigation';
import { useIsMobile } from '@/hooks/use-mobile';


export function Header() {
  const pathname = usePathname();
  const isMobile = useIsMobile();

  const navLinks = [
    { href: '/send', label: 'Send Message' },
    { href: '/browse', label: 'Browse' },
    { href: '/about', label: 'About' },
  ];

  if (isMobile) {
    // On mobile, show a simplified, centered title.
    return (
      <header className="w-full bg-background/95 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-8 items-center justify-center">
          <Link
            href="/"
            className="text-md font-semibold text-primary"
          >
            <span className="font-playfair italic">Message</span>
            <span className="font-headline"> in a Bottle</span>
          </Link>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <Link
          href="/"
          className="flex items-center space-x-2 font-bold"
        >
          <span className="hidden font-headline md:inline">Message in a Bottle</span>
          <span className="font-headline md:hidden">miab</span>
        </Link>
        <nav className="ml-auto hidden items-center space-x-2 md:flex">
          {navLinks.map((link) => (
             <Button
              key={link.href}
              variant={pathname.startsWith(link.href) ? 'secondary' : 'ghost'}
              asChild
            >
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
        </nav>
      </div>
    </header>
  );
}
