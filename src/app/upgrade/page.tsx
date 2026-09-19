import type { Metadata } from 'next';
import { siteConfig } from '@/lib/site-config';
import UpgradeClient from './upgrade-client';

export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Unlimited sending',
  description:
    'Lift the one-message-a-day limit on Message in a Bottle with a PayPal subscription.',
  alternates: { canonical: `${siteConfig.url}/upgrade` },
  // A transactional page tied to a signed-in account; nothing to index.
  robots: { index: false, follow: false },
};

export default function UpgradePage() {
  return <UpgradeClient />;
}
