
'use client';
import { usePathname } from 'next/navigation';

export function AppFooter() {
  const pathname = usePathname();
  const isAdminPage = pathname.startsWith('/admin');

  if (isAdminPage) {
    return null;
  }

  return (
    <footer className="py-6 text-center text-sm text-muted-foreground">
      © {new Date().getFullYear()} Message in a Bottle. All Rights Reserved.
    </footer>
  );
}
