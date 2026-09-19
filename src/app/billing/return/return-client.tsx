'use client';

import Link from 'next/link';
import { CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/hooks/use-subscription';
import { siteConfig } from '@/lib/site-config';

/**
 * Where PayPal sends the buyer after they approve.
 *
 * Approval and activation are not the same moment: PayPal redirects the
 * browser immediately, but access is granted by the webhook, which can land a
 * few seconds later. The `subscribers/{uid}` listener is live, so this page
 * flips to the confirmed state on its own — no refresh, and no pretending the
 * subscription is active before it actually is.
 */
export default function BillingReturnClient() {
  const { isSubscribed, isLoading } = useSubscription();

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <div className="container mx-auto max-w-lg px-4 py-16 text-center">
        {isSubscribed ? (
          <>
            <CheckCircle className="mx-auto h-12 w-12" aria-hidden="true" />
            <h1 className="mt-6 font-headline text-3xl font-bold tracking-tighter">
              You&apos;re all set
            </h1>
            <p className="mt-3 text-muted-foreground">
              Your subscription is active and the daily limit no longer applies.
              Manage or cancel it whenever you like from your PayPal account.
            </p>
            <Button asChild className="mt-8">
              <Link href="/send">Write a message</Link>
            </Button>
          </>
        ) : (
          <>
            <Loader2
              className="mx-auto h-10 w-10 animate-spin text-muted-foreground"
              aria-hidden="true"
            />
            <h1 className="mt-6 font-headline text-2xl font-bold tracking-tighter">
              Confirming with PayPal
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              {isLoading
                ? 'One moment.'
                : "This usually takes a few seconds. You can leave this page — your subscription will activate on its own once PayPal confirms it."}
            </p>
            <p className="mt-6 text-xs text-muted-foreground">
              Still nothing after a few minutes? Email{' '}
              <a
                href={`mailto:${siteConfig.contactEmail}`}
                className="underline hover:text-foreground"
              >
                {siteConfig.contactEmail}
              </a>{' '}
              with your PayPal receipt and it will be sorted out by hand.
            </p>
            <Button asChild variant="outline" className="mt-8">
              <Link href="/send">Back to sending</Link>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
