import type { Metadata } from 'next';
import MessagePageClient from './message-client';
import { siteConfig } from '@/lib/site-config';

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
    title: 'A message in a bottle',
    description:
      'Someone left an anonymous note here. Open the bottle to read it, or browse the other messages drifting in the ocean.',
    alternates: { canonical: `${siteConfig.url}/message/${id}` },
    // Deliberately not indexed. Each of these URLs holds one short, unedited
    // note written by a member of the public: individually thin, unbounded in
    // number, and frequently about a named private person. Letting them into
    // the index would bury the site's real pages under near-duplicate stubs
    // and surface people's names in search results. They stay fully readable
    // and crawlable — `follow` keeps the links to /browse and /bottle live.
    robots: { index: false, follow: true },
    openGraph: {
      title: 'A message in a bottle',
      description: 'Someone left an anonymous note here. Open it to read.',
      url: `${siteConfig.url}/message/${id}`,
      siteName: siteConfig.name,
      type: 'article',
    },
  };
}

export default function MessagePage() {
  return <MessagePageClient />;
}
