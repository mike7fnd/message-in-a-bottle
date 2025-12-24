
import { BrowsePageClient } from './browse-client';
import { getContent } from '@/lib/content';
import { FavoritesProvider } from '@/context/FavoritesContext';

export default async function BrowsePage() {
  const content = await getContent();
  return (
    <FavoritesProvider>
        <BrowsePageClient content={content} />
    </FavoritesProvider>
  );
}
