
'use client';

import { usePathname } from 'next/navigation';
import { useRef, type ReactNode } from 'react';

// This component is a workaround to cache pages in Next.js App Router.
// It works by storing the children of each page in a map.
// When the user navigates back to a page, it serves the cached children
// instead of re-rendering the page.
// https://github.com/vercel/next.js/issues/49279#issuecomment-1631770343

export function PageCache({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const pages = useRef<Map<string, ReactNode>>(new Map());

  // If the page is not in the cache, add it.
  if (!pages.current.has(pathname)) {
    pages.current.set(pathname, children);
  }

  return (
    <>
      {[...pages.current.entries()].map(([path, page]) => (
        <div
          key={path}
          style={{
            display: path === pathname ? 'block' : 'none',
          }}
        >
          {page}
        </div>
      ))}
    </>
  );
}
