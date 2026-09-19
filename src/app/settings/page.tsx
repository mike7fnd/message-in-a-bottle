import { siteConfig } from '@/lib/site-config';
import type { Metadata } from 'next';
import SettingsClientPage from './settings-client';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Settings',
  description: 'Manage your app preferences.',
  // A preferences panel, not a destination for search traffic.
  alternates: { canonical: `${siteConfig.url}/settings` },
  robots: { index: false, follow: false },
};

export default function SettingsPage() {
  return <SettingsClientPage />;
}
