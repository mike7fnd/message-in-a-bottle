
'use client';

import Link from 'next/link';
import { Button } from './ui/button';
import { usePathname } from 'next/navigation';
import { useIsMobile } from '@/hooks/use-mobile';
import { History, User, RefreshCw } from 'lucide-react';
import { useUser } from '@/firebase';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { useRecipientContext } from '@/context/RecipientContext';
import { cn } from '@/lib/utils';


export function Header() {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const { user } = useUser();
  const { refreshRecipients, isLoading } = useRecipientContext();

  const navLinks = [
    { href: '/send', label: 'Send Message' },
    { href: '/browse', label: 'Browse' },
  ];

  const getInitials = (name?: string | null) => {
    if (!name) return 'A';
    return name.charAt(0).toUpperCase();
  };

  const isBrowsePage = pathname.startsWith('/browse');

  if (isMobile) {
    return (
      <header className="w-full bg-background/95 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-8 items-center justify-between">
          {/* Left placeholder to balance the flexbox */}
          <div className="w-6" />

          <Link
            href="/"
            className="text-md font-semibold text-primary absolute left-1/2 -translate-x-1/2"
          >
            <span className="font-playfair italic">Message</span>
            <span className="font-headline"> in a Bottle</span>
          </Link>

          {isBrowsePage && (
            <button onClick={() => !isLoading && refreshRecipients()} disabled={isLoading} className="text-primary">
              <RefreshCw className={cn("h-5 w-5", isLoading && "animate-spin")} />
            </button>
          )}
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
        <nav className="ml-auto flex items-center space-x-2">
          {navLinks.map((link) => (
             <Button
              key={link.href}
              variant={pathname.startsWith(link.href) ? 'secondary' : 'ghost'}
              asChild
            >
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
           <Link href="/profile">
              <Avatar className="h-9 w-9 cursor-pointer">
                  {user && !user.isAnonymous && user.photoURL ? (
                    <AvatarImage src={user.photoURL} alt={user.displayName || 'User'} />
                  ) : user && !user.isAnonymous ? (
                    <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                  ) : (
                    <AvatarFallback><User className="h-5 w-5" /></AvatarFallback>
                  )}
              </Avatar>
           </Link>
        </nav>
      </div>
    </header>
  );
}
