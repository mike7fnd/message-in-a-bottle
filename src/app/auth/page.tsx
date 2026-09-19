import { siteConfig } from '@/lib/site-config';
import type { Metadata } from 'next';
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
  return <AuthClient />;
}
