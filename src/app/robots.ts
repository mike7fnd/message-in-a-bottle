import type { MetadataRoute } from 'next';
import { siteConfig } from '@/lib/site-config';

export const dynamic = 'force-static';

/**
 * Replaces the former public/robots.txt so the sitemap URL and the canonical
 * host come from one place.
 *
 * Everything a visitor can read without signing in stays crawlable — that
 * includes /browse, /bottle/* and /message/*, which are the site's actual
 * content. Only personal areas and the admin console are disallowed. Those
 * pages also carry their own `noindex` directives, because robots.txt stops
 * crawling, not indexing.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',      // operator console
          '/auth',        // sign-in / sign-up
          '/profile',     // per-user page
          '/history',     // per-user page
          '/settings',    // per-user page
          '/api/',        // JSON endpoints, nothing for a reader here
        ],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
