import { getContent } from '@/lib/content';
import { SendPageClient } from './send-client';
import type { Metadata } from 'next';

// Cache the send page shell at the edge for 1 hour.
export const revalidate = 3600;

export function generateMetadata(): Metadata {
  return {
    title: 'Send a Message',
  };
}

export default async function SendPage() {
  const content = await getContent();
  return <SendPageClient content={content} />;
}
