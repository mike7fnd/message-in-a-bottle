
'use client';

import { useIsMobile } from '@/hooks/use-mobile';
import { DesktopSidebar } from './DesktopSidebar';
import { Header } from './Header';

export function MainLayout({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();

  if (isMobile === undefined) {
    return null; // Or a loading spinner
  }

  if (isMobile) {
    return (
      <div className="flex min-h-dvh flex-col">
        <Header />
        <main className="flex-1 pb-24">{children}</main>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <DesktopSidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
