import { MetadataRoute } from 'next';
import { siteConfig } from '@/lib/site-config';

export const revalidate = 86400;

const baseUrl = siteConfig.url;

/**
 * Only canonical, public, indexable pages belong here.
 *
 * Deliberately excluded:
 *  /auth, /profile, /history, /settings  personal or sign-in pages, all noindex
 *  /admin/*                              operator console
 *  /message/[id]                         one short user-written note per URL;
 *                                        thin and unbounded, so it is noindex
 *  /bottle/[name]                        generated from whatever names people
 *                                        happen to use, so it is not enumerated
 *                                        here — it stays crawlable via /browse
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    { url: baseUrl, changeFrequency: 'weekly', priority: 1, lastModified },
    { url: `${baseUrl}/send`, changeFrequency: 'monthly', priority: 0.9, lastModified },
    { url: `${baseUrl}/browse`, changeFrequency: 'daily', priority: 0.8, lastModified },
    { url: `${baseUrl}/about`, changeFrequency: 'monthly', priority: 0.7, lastModified },
    { url: `${baseUrl}/contact`, changeFrequency: 'yearly', priority: 0.6, lastModified },
    { url: `${baseUrl}/donate`, changeFrequency: 'yearly', priority: 0.3, lastModified },
    { url: `${baseUrl}/privacy`, changeFrequency: 'yearly', priority: 0.3, lastModified },
    { url: `${baseUrl}/terms`, changeFrequency: 'yearly', priority: 0.3, lastModified },
  ];
}
