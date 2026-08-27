
'use client';
// Footer is now rendered inside MainLayout for web (fixes double scrollbar).
// This component is kept only for admin pages that bypass MainLayout.
import { usePathname } from 'next/navigation';

export function AppFooter() {
  const pathname = usePathname();

  // Admin pages use their own layout — show footer there only
  if (!pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <footer className="py-6 text-center text-sm text-muted-foreground">
      © {new Date().getFullYear()} Message in a Bottle. All Rights Reserved.
    </footer>
  );
}
