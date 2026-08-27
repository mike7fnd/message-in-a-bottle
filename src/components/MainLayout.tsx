'use client';

import { useIsMobile } from '@/hooks/use-mobile';
import { DesktopSidebar } from './DesktopSidebar';
import { Header } from './Header';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function MainLayout({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  const pathname = usePathname();

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
        <main className="flex-1 flex" style={{ paddingBottom: 'calc(4rem + max(env(safe-area-inset-bottom), 12px))' }}>{mainContent}</main>
      </div>
    );
  }

  return (
    <div className={cn("flex h-screen w-full overflow-hidden", !isMobile && "custom-cursor")}>
      <DesktopSidebar />
      <main className="flex-1 overflow-y-auto flex flex-col">
        {mainContent}
        {/* Footer lives inside the scrollable area so it never escapes h-screen */}
        <footer className="py-6 text-center text-sm text-muted-foreground shrink-0">
          © {new Date().getFullYear()} Message in a Bottle. All Rights Reserved.
        </footer>
      </main>
    </div>
  );
}
