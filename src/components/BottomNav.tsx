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
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 border-t border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex h-full items-center justify-center gap-10">
        {navItems.map((item) => {
          let isActive: boolean;
          if (item.href === '/profile') {
            isActive = ['/profile', '/history', '/about', '/settings', '/privacy', '/terms'].some((p) => pathname.startsWith(p));
          } else if (item.href === '/browse') {
            isActive = ['/browse', '/bottle', '/message'].some((p) => pathname.startsWith(p));
          } else if (item.href === '/') {
            isActive = pathname === '/';
          } else {
            isActive = pathname.startsWith(item.href);
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              className={cn(
                'flex items-center justify-center transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <item.icon
                className={cn(
                  'h-7 w-7 transition-all',
                  isActive
                    ? '[stroke-width:1.75]'
                    : '[stroke-width:1.25]',
                )}
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
