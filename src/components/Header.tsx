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
import Image from 'next/image';


export function Header() {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const { refreshRecipients, isLoading } = useRecipientContext();


  if (!isMobile) {
    return null;
  }

  const isBrowsePage = pathname.startsWith('/browse');

  return (
    <header className="w-full bg-background/95 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-8 items-center justify-between">
        {/* Left placeholder to balance the flexbox */}
        <div className="w-6" /> 
        
        <Link
          href="/"
          className="absolute left-1/2 -translate-x-1/2"
        >
          <Image 
            src="https://image2url.com/images/1766463519278-b41cc74d-4d9f-4adf-82bd-253c257a6379.jpeg"
            alt="Message in a Bottle logo"
            width={160}
            height={32}
            className="object-contain h-6 w-auto"
            priority
            unoptimized
          />
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
