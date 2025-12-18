
'use client';
import { useUser } from '@/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
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


function AdminNav() {
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
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background shadow-t-lg">
        <div className="grid h-16 grid-cols-4 items-center">
          {NAV_ITEMS_MOBILE.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 text-xs font-medium',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    );
  }

  return (
    <TooltipProvider>
      <aside
        className={cn(
          'group hidden h-screen flex-col border-r bg-muted/40 transition-all duration-300 ease-in-out md:flex w-16 hover:w-64 sticky top-0'
        )}
      >
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="relative flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link
              href="/admin/messages"
              className="flex items-center gap-2 font-semibold"
            >
              <span
                className={cn('transition-opacity opacity-0 group-hover:opacity-100')}
              >
                mitb
              </span>
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              {NAV_ITEMS_DESKTOP.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Tooltip key={item.href} delayDuration={0}>
                    <TooltipTrigger asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary',
                          isActive
                            ? 'bg-muted text-primary'
                            : 'text-muted-foreground'
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        <span
                          className={cn('transition-opacity opacity-0 group-hover:opacity-100')}
                        >
                          {item.label}
                        </span>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </nav>
          </div>
          <div className="mt-auto p-4">
            <Button
              size="sm"
              className="w-full"
              onClick={handleSignOut}
              aria-label="Sign Out"
            >
              <LogOut
                className={cn('h-4 w-4 group-hover:mr-2')}
              />
              <span
                className={cn('transition-opacity opacity-0 group-hover:opacity-100')}
              >
                Sign Out
              </span>
            </Button>
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
}

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
        <main className="flex-1 overflow-y-auto p-4 pb-20 md:pb-6 lg:p-6 lg:gap-6 gap-4 flex flex-col">
          {children}
        </main>
      </div>
    </div>
  );
}
