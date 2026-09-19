'use client';

import { useIsMobile } from '@/hooks/use-mobile';
import { DesktopSidebar } from './DesktopSidebar';
import { Header } from './Header';
import { SiteFooter } from './SiteFooter';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function MainLayout({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  const pathname = usePathname();

  // Admin has its own chrome and is excluded from indexing.
  const isAdmin = pathname.startsWith('/admin');

  if (isMobile === undefined) {
    return null; // Or a loading spinner
  }

  const mainContent = (
    <div className="flex-1 w-full">
      {children}
    </div>
  );

  if (isMobile) {
    return (
      <div className="flex min-h-dvh flex-col">
        <Header />
        <main
          id="main-content"
          className="flex-1 flex"
          style={{ paddingBottom: 'calc(4rem + max(env(safe-area-inset-bottom), 12px))' }}
        >
          {mainContent}
        </main>
        {/* Legal/nav links must be reachable on mobile too, so the footer sits
            above the bottom nav padding rather than being dropped entirely. */}
        {!isAdmin && (
          <SiteFooter
            className="border-t border-border"
            // Clears the fixed BottomNav so the last row is never covered.
            style={{ paddingBottom: 'calc(4rem + max(env(safe-area-inset-bottom), 12px))' }}
          />
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex h-screen w-full overflow-hidden", !isMobile && "custom-cursor")}>
      <DesktopSidebar />
      <main id="main-content" className="flex-1 overflow-y-auto flex flex-col">
        {mainContent}
        {/* Footer lives inside the scrollable area so it never escapes h-screen */}
        {!isAdmin && <SiteFooter className="shrink-0 border-t border-border" />}
      </main>
    </div>
  );
}
