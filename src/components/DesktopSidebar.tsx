
'use client';

import Link from 'next/link';
import { Home, Send, User, Search, Info } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useUser } from '@/firebase';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useState, useEffect } from 'react';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/send', label: 'Send', icon: Send },
  { href: '/browse', label: 'Browse', icon: Search },
  { href: '/about', label: 'About', icon: Info },
];

export function DesktopSidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);


  const getInitials = (name?: string | null) => {
    if (!name) return 'A';
    return name.charAt(0).toUpperCase();
  };

  return (
    <TooltipProvider>
      <aside className="sticky top-0 hidden h-screen w-16 flex-col border-r bg-background md:flex">
        <div className="flex h-full flex-col items-center">
          <div className="flex h-14 shrink-0 items-center justify-center border-b px-2 lg:h-[60px]">
            <Link
              href="/"
              className="flex items-center justify-center font-semibold"
            >
              <Image
                src="https://image2url.com/images/1766464071847-041ccf8f-4b13-4f01-883e-3357567042c4.png"
                alt="Logo"
                width={32}
                height={32}
                className="h-6 w-6"
                unoptimized
              />
            </Link>
          </div>
          <nav className="flex flex-1 flex-col items-center gap-4 py-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Tooltip key={item.href} delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:text-primary',
                        isActive
                          ? 'bg-muted text-primary'
                          : 'text-muted-foreground'
                      )}
                    >
                      <item.icon className="h-6 w-6" />
                      <span className="sr-only">{item.label}</span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </nav>
          <div className="mt-auto flex flex-col items-center gap-4 p-4">
             <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                    <Link href="/profile">
                         {mounted ? (
                            <Avatar className="h-9 w-9 cursor-pointer">
                                {user && !user.isAnonymous && user.photoURL ? (
                                    <AvatarImage src={user.photoURL} alt={user.displayName || 'User'} />
                                ) : user && !user.isAnonymous ? (
                                    <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                                ) : (
                                    <AvatarFallback><User className="h-5 w-5" /></AvatarFallback>
                                )}
                            </Avatar>
                        ) : (
                           <div className="h-9 w-9 rounded-full bg-muted" />
                        )}
                        <span className="sr-only">Profile</span>
                    </Link>
                </TooltipTrigger>
                <TooltipContent side="right">
                  Profile
                </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
}
