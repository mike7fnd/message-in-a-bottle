'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader2, LogIn, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useUser } from '@/firebase';
import { useSubscription } from '@/hooks/use-subscription';

/**
 * The upgrade prompt shown from the send form's cooldown notice.
 *
 * Two paths, as specified:
 *  - signed in with a real account → straight to PayPal approval
 *  - anonymous or signed out       → /auth, then back here to pay
 *
 * The benefit list deliberately claims only unlimited sending. Early access to
 * your own sealed messages is not offered, because the time-capsule lock is
 * drawn in the browser and a sealed message's text is already readable through
 * the public API — there would be nothing real to sell.
 */
export function UpgradeDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { user } = useUser();
  const { isSubscribed } = useSubscription();
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasAccount = Boolean(user && !user.isAnonymous);

  const startCheckout = useCallback(async () => {
    setError(null);

    if (!user) {
      setError('Still starting up — try again in a second.');
      return;
    }

    // No account yet: send them to sign up, remembering where to come back to.
    if (!hasAccount) {
      onOpenChange(false);
      router.push('/auth?next=/upgrade');
      return;
    }

    setIsStarting(true);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/billing/create-subscription', {
        method: 'POST',
        headers: { Authorization: `Bearer ${idToken}` },
      });

      const data = await res.json();

      if (res.status === 403 && data.code === 'needs-account') {
        onOpenChange(false);
        router.push('/auth?next=/upgrade');
        return;
      }

      if (!res.ok || !data.approveUrl) {
        setError(data.error ?? 'Could not start the subscription.');
        return;
      }

      // Full navigation, not router.push — PayPal is a different origin.
      window.location.href = data.approveUrl;
    } catch (err) {
      console.error('Checkout failed:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsStarting(false);
    }
  }, [user, hasAccount, onOpenChange, router]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
            Send without waiting
          </DialogTitle>
          <DialogDescription>
            Everyone gets one message a day. A subscription lifts that limit.
          </DialogDescription>
        </DialogHeader>

        {isSubscribed ? (
          <p className="rounded-20px border border-border bg-muted/40 p-4 text-sm">
            You&apos;re already subscribed — the daily limit doesn&apos;t apply
            to your account.
          </p>
        ) : (
          <>
            <ul className="space-y-3 py-2 text-sm">
              <li className="flex items-start gap-3">
                <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>
                  <strong className="text-foreground">
                    Unlimited messages.
                  </strong>{' '}
                  Write as many as you like, whenever you like — no 24-hour
                  wait.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>
                  <strong className="text-foreground">
                    Keeps the site running.
                  </strong>{' '}
                  Message in a Bottle is free for everyone and paid for by ads
                  and subscriptions.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>
                  <strong className="text-foreground">Cancel anytime</strong>{' '}
                  from your PayPal account. Billing is handled entirely by
                  PayPal — your card details never reach this site.
                </span>
              </li>
            </ul>

            {!hasAccount && (
              <p className="rounded-15px bg-muted p-3 text-xs text-muted-foreground">
                A subscription is tied to an account, so it survives clearing
                your browser. You&apos;ll be asked to sign up first.
              </p>
            )}

            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
          </>
        )}

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Not now
          </Button>
          {!isSubscribed && (
            <Button
              onClick={startCheckout}
              disabled={isStarting}
              className="w-full sm:w-auto"
            >
              {isStarting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : hasAccount ? (
                <Sparkles className="mr-2 h-4 w-4" />
              ) : (
                <LogIn className="mr-2 h-4 w-4" />
              )}
              {hasAccount ? 'Subscribe with PayPal' : 'Create an account'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
