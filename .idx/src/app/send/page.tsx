
import { getContent } from '@/lib/content';
import { SendPageClient } from './send-client';
import type { Metadata } from 'next';

export function generateMetadata(): Metadata {
    return {
      title: 'Send a Message',
    };
}

export default async function SendPage() {
  const content = await getContent();
  return <SendPageClient content={content} />;
}
