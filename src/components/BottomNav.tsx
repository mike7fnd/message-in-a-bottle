
'use client';

import Link from 'next/link';
import { Home, Send, User, Search } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

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
  
  const containerRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  
  const [activePill, setActivePill] = useState({ width: 0, left: 0, top: 0, height: 0 });

  const getActiveLink = () => {
    if (!containerRef.current) return null;
    let activeLink = containerRef.current.querySelector<HTMLAnchorElement>('[data-active="true"]');
    if (!activeLink && ['/history', '/about', '/settings', '/privacy', '/terms'].some(p => pathname.startsWith(p))) {
        activeLink = containerRef.current.querySelector<HTMLAnchorElement>('[href="/profile"]');
    }
    return activeLink;
  }

  useLayoutEffect(() => {
    const calculatePillPosition = () => {
        const activeLink = getActiveLink();
        if (activeLink) {
            setActivePill({
                width: activeLink.offsetWidth,
                left: activeLink.offsetLeft,
                top: activeLink.offsetTop,
                height: activeLink.offsetHeight,
            });
        } else {
            setActivePill({ width: 0, left: 0, top: 0, height: 0 });
        }
    }
    
    calculatePillPosition();
    
    window.addEventListener('resize', calculatePillPosition);
    return () => window.removeEventListener('resize', calculatePillPosition);

  }, [pathname]);

  useGSAP(() => {
    if (indicatorRef.current && activePill.width > 0) {
      gsap.to(indicatorRef.current, {
        width: activePill.width,
        height: activePill.height,
        left: activePill.left,
        top: activePill.top,
        opacity: 1,
        duration: 0.8,
        ease: 'elastic.out(1, 0.75)',
      });
    } else {
        gsap.to(indicatorRef.current, { opacity: 0, duration: 0.2 });
    }
  }, { dependencies: [activePill], scope: containerRef });


  if (!isMobile || isAdminPage) {
    return null;
  }

  return (
    <nav className="fixed bottom-4 left-1/2 z-50 h-16 w-[90vw] -translate-x-1/2 rounded-full border border-border/40 bg-background/80 shadow-lg backdrop-blur">
      <div ref={containerRef} className="relative grid h-full grid-cols-4 p-1">
        <div ref={indicatorRef} className="absolute rounded-full bg-background shadow-2xl z-0 opacity-0" />
        {navItems.map((item) => {
          let isActive;
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
              data-active={isActive}
              className={cn(
                'relative z-10 flex flex-col items-center justify-center gap-0.5 rounded-full text-[10px] font-medium transition-colors',
                isActive
                  ? 'text-primary'
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
