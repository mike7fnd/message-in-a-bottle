
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
  const { user } = useUser();
  const { refreshRecipients, isLoading } = useRecipientContext();

  const getInitials = (name?: string | null) => {
    if (!name) return 'A';
    return name.charAt(0).toUpperCase();
  };

  const isBrowsePage = pathname.startsWith('/browse');

  if (!isMobile) {
    return null;
  }

  return (
    <header className="w-full py-3">
      <div className="container flex h-8 items-center justify-between">
        <Link href="/profile">
            <Avatar className="h-8 w-8 cursor-pointer">
                {user && !user.isAnonymous && user.photoURL ? (
                  <AvatarImage src={user.photoURL} alt={user.displayName || 'User'} />
                ) : user && !user.isAnonymous ? (
                  <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                ) : (
                  <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                )}
            </Avatar>
         </Link>

        <Link
          href="/"
          className="text-md font-semibold text-primary absolute left-1/2 -translate-x-1/2"
        >
           <Image
            src="https://image2url.com/images/1766463519278-b41cc74d-4d9f-4adf-82bd-253c257a6379.jpeg"
            alt="Message in a Bottle Logo"
            width={150}
            height={30}
            className="object-contain h-6 w-auto"
            unoptimized
          />
        </Link>

        {isBrowsePage ? (
          <button onClick={() => !isLoading && refreshRecipients()} disabled={isLoading} className="text-primary">
            <RefreshCw className={cn("h-5 w-5", isLoading && "animate-spin")} />
          </button>
        ) : (
          <div className="w-8" />
        )}
      </div>
    </header>
  );
}
