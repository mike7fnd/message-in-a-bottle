
'use client';

import Link from 'next/link';
import { Home, Send, User, Search } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/send', label: 'Send', icon: Send },
  { href: '/browse', label: 'Browse', icon: Search },
  { href: '/profile', label: 'Profile', icon: User },
];

export function BottomNav() {
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const isAdminPage = pathname.startsWith('/admin');

  if (!isMobile || isAdminPage) {
    return null;
  }

  return (
    <nav className="fixed bottom-4 left-1/2 z-50 h-16 w-[90vw] -translate-x-1/2 rounded-full border border-border/40 bg-background shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden">
      <div className="grid h-full grid-cols-4 p-1">
        {navItems.map((item) => {
          let isActive;
          if (item.href === '/profile') {
            // Highlight Profile for /profile, /history, and /about
            isActive = ['/profile', '/history', '/about'].some((p) => pathname.startsWith(p));
          } else if (item.href === '/browse') {
            // Highlight Browse for /browse, /bottle/*, and /message/*
            isActive = ['/browse', '/bottle', '/message'].some((p) => pathname.startsWith(p));
          } else if (item.href === '/') {
            // Exact match for Home
            isActive = pathname === '/';
          } else {
            // Standard startsWith check for others
            isActive = pathname.startsWith(item.href);
          }
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 rounded-full text-[10px] font-medium transition-colors',
                isActive
                  ? 'text-primary bg-background shadow-2xl'
                  : 'text-muted-foreground hover:text-primary'
              )}
            >
              <item.icon className="h-6 w-6" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
