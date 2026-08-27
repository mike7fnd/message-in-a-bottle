import type { Metadata } from 'next';
import MessagePageClient from './message-client';

// Dynamic page — message content changes, so no static caching.
// But having the server wrapper lets Next.js inject correct metadata.
export const revalidate = 0;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return {
    title: 'View Message',
    description: `Read a message in a bottle — ID: ${id}`,
  };
}

export default function MessagePage() {
  return <MessagePageClient />;
}
