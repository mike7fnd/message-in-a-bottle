'use client';

import Link from 'next/link';
import { ArrowUpRight, Camera } from 'lucide-react';
import { usePathname } from 'next/navigation';

/**
 * Site-wide promo strip for the sibling Jazzbooth app.
 *
 * Sits at the very top of every public page, above the mobile header and above
 * the desktop sidebar. It scrolls away rather than sticking — the mobile view
 * already carries a fixed bottom nav and, until it is answered, the consent
 * banner, and a third permanently pinned bar would leave very little room to
 * actually read a message.
 *
 * Hidden on /admin, which is the operator's own console.
 */
export function AnnouncementBar() {
  const pathname = usePathname();

  if (pathname.startsWith('/admin')) return null;

  return (
    <div className="w-full bg-primary text-primary-foreground">
      <Link
        href="https://www.jazzbooth.site"
        target="_blank"
        // noopener/noreferrer is required with target="_blank" so the opened
        // tab cannot reach back into this one via window.opener.
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs transition-opacity hover:opacity-90"
      >
        <Camera className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>Try this photobooth app</span>
        <span className="font-semibold underline underline-offset-2">
          jazzbooth.site
        </span>
        <ArrowUpRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span className="sr-only">(opens in a new tab)</span>
      </Link>
    </div>
  );
}
