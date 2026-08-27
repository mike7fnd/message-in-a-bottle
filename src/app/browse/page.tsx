import { BrowsePageClient } from './browse-client';
import { getContent } from '@/lib/content';
import { FavoritesProvider } from '@/context/FavoritesContext';

// Cache the browse page shell at the edge for 5 minutes.
// The content JSON is static but recipients are dynamic — the shell is cached,
// the client fetches live recipient data after hydration.
export const revalidate = 300;

export default async function BrowsePage() {
  const content = await getContent();
  return (
    <FavoritesProvider>
      <BrowsePageClient content={content} />
    </FavoritesProvider>
  );
}
