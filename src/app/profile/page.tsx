import { siteConfig } from '@/lib/site-config';
import type { Metadata } from 'next';
import ProfileClient from './profile-client';

export const revalidate = 0; // Personal page — never cached or shared

/**
 * Server wrapper whose only job is to carry metadata. The page itself is a
 * client component, and a client component cannot export `metadata`, so
 * without this the page could be indexed with no directive at all.
 */
export const metadata: Metadata = {
  title: 'Your Profile',
  description: 'Your account, sent bottles and saved favorites.',
  // A per-visitor page with nothing useful for a search result.
  alternates: { canonical: `${siteConfig.url}/profile` },
  robots: { index: false, follow: false, nocache: true },
};

export default function ProfilePage() {
  return <ProfileClient />;
}
