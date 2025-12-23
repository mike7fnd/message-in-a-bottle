
'use client';
import { useUser } from '@/firebase';
import { usePathname } from 'next/navigation';
import { memo } from 'react';
import {
  Send,
  User,
  Home,
  Search,
  Info,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import Image from 'next/image';


const NAV_ITEMS = [
  { href: '/', label: 'Home', icon: Home, exact: true },
  { href: '/send', label: 'Send Message', icon: Send },
  { href: '/browse', label: 'Browse', icon: Search },
  { href: '/about', label: 'About', icon: Info },
];

const DesktopSidebarInternal = memo(function DesktopSidebarInternal() {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const { user } = useUser();

  const getInitials = (name?: string | null) => {
    if (!name) return 'A';
    return name.charAt(0).toUpperCase();
  };

  if (isMobile) {
    return null;
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-16 flex-col border-r bg-background sm:flex">
      <TooltipProvider>
        <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
          <Link
            href="/"
            className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 md:h-8 md:w-8"
          >
            <Image
                src="https://image2url.com/images/1766464071847-041ccf8f-4b13-4f01-883e-3357567042c4.png"
                alt="Logo"
                width={24}
                height={24}
                className="h-6 w-6"
                unoptimized
            />
            <span className="sr-only">Miab</span>
          </Link>
          {NAV_ITEMS.map((item) => {
             const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
             return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground',
                        isActive && 'bg-accent text-accent-foreground'
                      )}
                    >
                      <item.icon className="h-6 w-6" />
                      <span className="sr-only">{item.label}</span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
             )
          })}
        </nav>
        <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/profile">
                <Avatar className="h-10 w-10 cursor-pointer">
                    {user && !user.isAnonymous && user.photoURL ? (
                        <AvatarImage src={user.photoURL} alt={user.displayName || 'User'} />
                    ) : user && !user.isAnonymous ? (
                        <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                    ) : (
                        <AvatarFallback><User className="h-6 w-6" /></AvatarFallback>
                    )}
                </Avatar>
                <span className="sr-only">Profile</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">Profile</TooltipContent>
          </Tooltip>
        </nav>
      </TooltipProvider>
    </aside>
  );
});

export const DesktopSidebar = () => <DesktopSidebarInternal />;
