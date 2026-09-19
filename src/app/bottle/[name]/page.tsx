// Server component — fetches static content at the edge (cached 1 hour).
// Only the message list is fetched client-side since it's dynamic Firestore data.
import type { Metadata } from 'next';
import { getContent } from '@/lib/content';
import { FavoritesProvider } from '@/context/FavoritesContext';
import { siteConfig } from '@/lib/site-config';
import { BottlePageClient } from './bottle-client';

export const revalidate = 3600;

/**
 * Per-bottle metadata.
 *
 * Without this every bottle page inherited the site-wide title and
 * description, so each one looked like a duplicate of the last. The name is
 * the only thing that distinguishes these pages, so it drives the title and
 * the canonical.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ name: string }>;
}): Promise<Metadata> {
  const { name } = await params;
  const decoded = decodeURIComponent(name);
  // Display form only — the stored value is already lower-cased.
  const display = decoded.charAt(0).toUpperCase() + decoded.slice(1);

  return {
    title: `Messages for ${display}`,
    description: `Anonymous messages written to ${display} and left in the ocean at Message in a Bottle. Open a bottle to read what someone wanted to say.`,
    alternates: {
      canonical: `${siteConfig.url}/bottle/${encodeURIComponent(decoded)}`,
    },
    openGraph: {
      title: `Messages for ${display}`,
      description: `Anonymous messages written to ${display}.`,
      url: `${siteConfig.url}/bottle/${encodeURIComponent(decoded)}`,
      siteName: siteConfig.name,
      type: 'website',
    },
  };
}

export default async function BottlePage() {
  const content = await getContent();
  return (
    <FavoritesProvider>
      <BottlePageClient content={content} />
    </FavoritesProvider>
  );
}
