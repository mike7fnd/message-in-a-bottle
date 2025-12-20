'use client';

import Link from 'next/link';

export function AnnouncementBar() {
  return (
    <div className="relative flex items-center justify-center gap-x-4 bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground sm:text-sm">
      <p>
        We've released{' '}
        <Link
          href="https://yflowers.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold underline underline-offset-4"
        >
          yourflowers
        </Link>
      </p>
    </div>
  );
}
