import type { Metadata } from 'next';
import { siteConfig } from '@/lib/site-config';
import BillingReturnClient from './return-client';

export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Subscription confirmed',
  alternates: { canonical: `${siteConfig.url}/billing/return` },
  robots: { index: false, follow: false },
};

export default function BillingReturnPage() {
  return <BillingReturnClient />;
}
