import { Suspense } from 'react';
import { siteConfig } from '@/lib/site-config';
import type { Metadata } from 'next';
import { Loader2 } from 'lucide-react';
import AuthClient from './auth-client';

export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Sign In',
  description:
    'Sign in to Message in a Bottle to keep track of the bottles you have sent. An account is never required to send or read messages.',
  // Sign-in screens carry no content worth indexing and were previously listed
  // in the sitemap by mistake.
  alternates: { canonical: `${siteConfig.url}/auth` },
  robots: { index: false, follow: false },
};

export default function AuthPage() {
  return (
    // AuthClient reads ?next= with useSearchParams, which Next requires to sit
    // inside a Suspense boundary.
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <AuthClient />
    </Suspense>
  );
}
