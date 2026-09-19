'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UpgradeDialog } from '@/components/UpgradeDialog';
import { useSubscription } from '@/hooks/use-subscription';
import { useUser } from '@/firebase';

/**
 * Landing page for /auth?next=/upgrade.
 *
 * Someone arrives here straight after creating an account, so the dialog opens
 * by itself and they continue to PayPal without hunting for the button again.
 */
export default function UpgradeClient() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const { isSubscribed, isLoading } = useSubscription();
  const [dialogOpen, setDialogOpen] = useState(false);

  const hasAccount = Boolean(user && !user.isAnonymous);

  useEffect(() => {
    if (isUserLoading || isLoading) return;
    if (!isSubscribed && hasAccount) setDialogOpen(true);
  }, [isUserLoading, isLoading, isSubscribed, hasAccount]);

  if (isUserLoading || isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <div className="container mx-auto max-w-2xl px-4 py-8 md:py-16">
        <Button asChild variant="link" className="mb-4 pl-0 text-muted-foreground">
          <Link href="/send">
            <ChevronLeft className="mr-1 h-4 w-4" /> Back to sending
          </Link>
        </Button>

        <h1 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl">
          Unlimited sending
        </h1>

        {isSubscribed ? (
          <>
            <p className="mt-3 text-muted-foreground">
              Your subscription is active — the one-a-day limit no longer
              applies to your account. Manage or cancel it any time from your
              PayPal account.
            </p>
            <Button asChild className="mt-6">
              <Link href="/send">Write a message</Link>
            </Button>
          </>
        ) : !hasAccount ? (
          <>
            <p className="mt-3 text-muted-foreground">
              A subscription is tied to an account so it survives clearing your
              browser. Create one — it takes a moment — and you&apos;ll come
              straight back here.
            </p>
            <Button
              className="mt-6"
              onClick={() => router.push('/auth?next=/upgrade')}
            >
              Create an account
            </Button>
          </>
        ) : (
          <>
            <p className="mt-3 text-muted-foreground">
              Everyone gets one message a day. A subscription lifts that limit.
            </p>
            <Button className="mt-6" onClick={() => setDialogOpen(true)}>
              See what&apos;s included
            </Button>
          </>
        )}
      </div>

      <UpgradeDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
