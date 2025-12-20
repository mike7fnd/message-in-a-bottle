//final
import { BrowsePageClient } from './browse-client';
import { getContent } from '@/lib/content';

export default async function BrowsePage() {
  const content = await getContent();
  return <BrowsePageClient content={content} />;
}
