import type { Metadata } from 'next';
import { getContent } from '@/lib/content';
import { siteConfig } from '@/lib/site-config';
import DonatePage from './donate-client';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Support the Project',
  description: 'Support Message in a Bottle with a donation. The site is free to use and run by one person; contributions cover hosting and keep it online.',
  alternates: { canonical: `${siteConfig.url}/donate` },
};

export default async function DonatePageServer() {
  const content = await getContent();
  return <DonatePage content={content} />;
}
