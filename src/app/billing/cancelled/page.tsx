import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { siteConfig } from '@/lib/site-config';

export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Subscription cancelled',
  alternates: { canonical: `${siteConfig.url}/billing/cancelled` },
  robots: { index: false, follow: false },
};

/** Where PayPal returns someone who backed out before approving. */
export default function BillingCancelledPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <div className="container mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="font-headline text-2xl font-bold tracking-tighter">
          No subscription started
        </h1>
        <p className="mt-3 text-muted-foreground">
          You backed out before confirming, so nothing was charged and nothing
          changed. The free daily message still works as usual.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-2 sm:flex-row">
          <Button asChild>
            <Link href="/send">Back to sending</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/upgrade">Try again</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
