import { getContent } from '@/lib/content';
import HomeClient from './home-client';

// Cache the rendered home page at the edge for 1 hour.
// getContent() reads a static JSON file that rarely changes.
export const revalidate = 3600;

export default async function Home() {
  const content = await getContent();
  return <HomeClient content={content} />;
}
