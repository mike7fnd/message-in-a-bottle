
'use client';
import { useUser } from '@/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState, memo } from 'react';
import {
  Loader2,
  Home,
  MessageSquare,
  Library,
  LogOut,
  LifeBuoy,
  Menu,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const ADMIN_EMAILS = ['mikefernandex227@gmail.com'];

const NAV_ITEMS_DESKTOP = [
  { href: '/admin/messages', label: 'Messages', icon: MessageSquare },
  { href: '/admin/feedback', label: 'Feedback', icon: LifeBuoy },
  { href: '/admin/settings', label: 'Contents', icon: Library },
];

const NAV_ITEMS_MOBILE = [
    { href: '/admin/messages', label: 'Messages', icon: MessageSquare },
    { href: '/admin/feedback', label: 'Feedback', icon: LifeBuoy },
    { href: '/admin/settings', label: 'Contents', icon: Library },
    { href: '/admin/more', label: 'Menu', icon: Menu },
];


const AdminNav = memo(function AdminNav() {
  const pathname = usePathname();
  const auth = useAuth();
  const router = useRouter();
  const isMobile = useIsMobile();

  const handleSignOut = async () => {
    if (!auth) return;
    await signOut(auth);
    router.push('/admin/login');
  };

  if (isMobile) {
    return (
       <nav className="fixed bottom-4 left-1/2 z-50 h-16 w-[90vw] -translate-x-1/2 rounded-full border border-border/40 bg-background shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden">
        <div className="grid h-full grid-cols-4 p-1">
          {NAV_ITEMS_MOBILE.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 rounded-full text-[10px] font-medium transition-colors',
                  isActive
                    ? 'text-primary bg-background shadow-2xl'
                    : 'text-muted-foreground hover:text-primary'
                )}
              >
                <item.icon className="h-6 w-6" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    );
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-16 flex-col border-r bg-background sm:flex">
      <TooltipProvider>
        <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
          <Link
            href="/admin/messages"
            className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
          >
            <span className="text-sm">M</span>
            <span className="sr-only">MITB Admin</span>
          </Link>
          {NAV_ITEMS_DESKTOP.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground',
                      isActive && 'bg-accent text-accent-foreground'
                    )}
                  >
                    <item.icon className="h-6 w-6" />
                    <span className="sr-only">{item.label}</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            );
          })}
        </nav>
        <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 text-muted-foreground transition-colors hover:text-foreground"
                onClick={handleSignOut}
              >
                <LogOut className="h-6 w-6" />
                <span className="sr-only">Sign Out</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Sign Out</TooltipContent>
          </Tooltip>
        </nav>
      </TooltipProvider>
    </aside>
  );
});

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    // If auth state is still loading, do nothing yet.
    if (isUserLoading) {
      return;
    }

    const isAdmin = user && user.email && ADMIN_EMAILS.includes(user.email);
    const isLoginPage = pathname === '/admin/login';

    // If trying to access a protected admin page without being an admin, redirect to login.
    if (!isLoginPage && !isAdmin) {
      router.replace('/admin/login');
      return; // Stop further execution in this render
    }
    
    // If on the login page but already logged in as an admin, redirect to dashboard.
    if (isLoginPage && isAdmin) {
      router.replace('/admin/messages');
      return; // Stop further execution in this render
    }
    
    // If none of the above, authentication is checked and we can show the content.
    setAuthChecked(true);

  }, [user, isUserLoading, router, pathname]);

  const isLoginPage = pathname === '/admin/login';

  // While we are waiting for the useEffect to run for the first time,
  // we show a loader unless we are already on the login page.
  if (!authChecked) {
     return (
        <div className="flex h-screen w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      );
  }
  
  // If we're on the login page, just render the children (the login form).
  if (isLoginPage) {
    return <>{children}</>;
  }

  // If we are here, it means we are an authenticated admin on a protected page.
  return (
    <div className="flex h-screen w-full overflow-hidden">
      <AdminNav />
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 pb-20 md:pb-6 lg:p-6 lg:gap-6 gap-4 flex flex-col md:ml-16">
          {children}
        </main>
      </div>
    </div>
  );
}
