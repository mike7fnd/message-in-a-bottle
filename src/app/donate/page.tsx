import type { Metadata } from 'next';
import { getContent } from '@/lib/content';
import DonatePage from './donate-client';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Support the Project',
  description: 'Donate to support Message in a Bottle.',
};

export default async function DonatePageServer() {
  const content = await getContent();
  return <DonatePage content={content} />;
}
