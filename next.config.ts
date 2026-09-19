
import type { NextConfig } from 'next';
import withPWAInit from '@ducanh2912/next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  extendManifest: (manifest) => {
    manifest.theme_color = '#ffffff';
    manifest.background_color = '#ffffff';
    manifest.display = 'standalone';
    manifest.orientation = 'portrait';
    manifest.scope = '/';
    manifest.start_url = '/';
    manifest.icons = [
      ...(manifest.icons || []),
      {
        src: 'https://image2url.com/images/1766464071847-041ccf8f-4b13-4f01-883e-3357567042c4.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ];
    return manifest;
  },
});

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // ── Canonical host ──────────────────────────────────────────────────────────
  // Both www and apex were answering 200, so every page existed at two URLs.
  // All canonical tags, the sitemap and ads.txt point at the apex, so www is
  // redirected there permanently. (Vercel can also do this at the domain level;
  // keeping it here means the rule travels with the code.)
  async redirects() {
    const host = new URL(
      process.env.NEXT_PUBLIC_SITE_URL || 'https://messageinabottle.sbs'
    ).host;

    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: `www.${host}` }],
        destination: `https://${host}/:path*`,
        permanent: true,
      },
    ];
  },

  // ── HTTP headers ────────────────────────────────────────────────────────────
  async headers() {
    return [
      // Baseline security headers on every response.
      //
      // No Content-Security-Policy is set here on purpose: AdSense injects
      // scripts, frames and images from a wide and changing set of Google
      // origins, and a CSP tightened by guesswork would silently break ad
      // serving. See ADSENSE-READINESS.md for how to roll one out in
      // report-only mode first.
      {
        source: '/:path*',
        headers: [
          // Stop browsers from MIME-sniffing a response into something else.
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Send only the origin cross-site, keep full path same-origin.
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Nothing here needs camera, mic or geolocation.
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          // Clickjacking protection. SAMEORIGIN rather than DENY so ad and
          // Spotify iframes keep working.
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
      // Immutable static assets (Next.js hashes filenames — safe to cache forever)
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Public assets: icons, manifest, images — version via filename if needed
      {
        source: '/icons/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=86400',
          },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, stale-while-revalidate=3600',
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'toppng.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.pinimg.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.scdn.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.ibb.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'image2url.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'img.freepik.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
};

export default withPWA(nextConfig);
