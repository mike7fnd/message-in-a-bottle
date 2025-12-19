
'use client';

import Link from 'next/link';
import { Home, Send, Inbox, Info } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/send', label: 'Send', icon: Send },
  { href: '/browse', label: 'Browse', icon: Inbox },
  { href: '/about', label: 'About', icon: Info },
];

export function BottomNav() {
  const isMobile = useIsMobile();
  const pathname = usePathname();

  if (!isMobile) {
    return null;
  }

  return (
    <nav className="fixed bottom-4 left-1/2 z-50 h-16 w-[90vw] -translate-x-1/2 rounded-full border border-border/40 bg-background/95 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      <div className="grid h-full grid-cols-4 p-1">
        {navItems.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 rounded-full text-xs font-medium transition-colors',
                isActive
                  ? 'text-primary bg-background shadow-sm'
                  : 'text-muted-foreground hover:text-primary'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
