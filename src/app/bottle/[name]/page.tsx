// Server component — fetches static content at the edge (cached 1 hour).
// Only the message list is fetched client-side since it's dynamic Firestore data.
import { getContent } from '@/lib/content';
import { FavoritesProvider } from '@/context/FavoritesContext';
import { BottlePageClient } from './bottle-client';

export const revalidate = 3600;

export default async function BottlePage() {
  const content = await getContent();
  return (
    <FavoritesProvider>
      <BottlePageClient content={content} />
    </FavoritesProvider>
  );
}
