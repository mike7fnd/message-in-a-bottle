
'use client';
import { usePathname } from 'next/navigation';
import { useIsMobile } from '@/hooks/use-mobile';

export function AppFooter() {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const isAdminPage = pathname.startsWith('/admin');

  if (isAdminPage || isMobile) {
    return null;
  }

  return (
    <footer className="py-6 text-center text-sm text-muted-foreground">
      © {new Date().getFullYear()} Message in a Bottle. All Rights Reserved.
    </footer>
  );
}
