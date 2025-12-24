
'use client';

import { usePathname } from 'next/navigation';
import { useRef, useMemo } from 'react';

// A simple component to cache pages on mobile to make navigation feel faster
export function PageCache({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const pages = useRef<Map<string, React.ReactNode>>(new Map());
  
  useMemo(() => {
    if (!pages.current.has(pathname)) {
        pages.current.set(pathname, children);
    }
  }, [pathname, children]);
  
  return (
    <>
      {Array.from(pages.current.entries()).map(([path, page]) => (
        <div key={path} style={{ display: path === pathname ? 'block' : 'none' }}>
          {page}
        </div>
      ))}
    </>
  );
}
