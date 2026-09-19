
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Manrope, Playfair_Display, Abril_Fatface } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';
import { ConsentProvider } from '@/components/ConsentProvider';
import { AdSenseScript } from '@/components/ads/AdSenseScript';
import { ADSENSE_CLIENT_ID, siteConfig } from '@/lib/site-config';
import { FirebaseClientProvider } from '@/firebase';
import { RecipientProvider } from '@/context/RecipientContext';
import { FavoritesProvider } from '@/context/FavoritesContext';
import { VisitorTracker } from '@/components/VisitorTracker';
import { AppFooter } from '@/components/AppFooter';
import { ThemeProvider } from '@/components/ThemeProvider';
import { BottomNav } from '@/components/BottomNav';
import { MainLayout } from '@/components/MainLayout';
import { GatedAnalytics } from '@/components/GatedAnalytics';
import { CacheProvider } from '@/components/CacheProvider';

// ── Self-hosted fonts via next/font ──────────────────────────────────────────
// No external DNS lookup to fonts.googleapis.com, automatic font-display:swap,
// fonts served from Vercel edge — better LCP.

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['300', '400', '700'],
  variable: '--font-manrope',
  display: 'swap',
});

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  style: ['normal', 'italic'],
  variable: '--font-playfair',
  display: 'swap',
});

const abrilFatface = Abril_Fatface({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-abril',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Message in a Bottle',
    template: '%s | Message in a Bottle',
  },
  description: 'Write an anonymous message, address it to a name, and let it drift into a public ocean of letters that anyone can open and read.',
  keywords: ['anonymous message', 'message in a bottle', 'send anonymous message', 'secret message', 'digital ocean', 'anonymous letter'],
  metadataBase: new URL(siteConfig.url),
  // No `alternates.canonical` here on purpose. A canonical set on the root
  // layout cascades to every page that does not override it, so /donate,
  // /auth, /profile, /history and /settings were all telling Google they were
  // duplicates of the homepage. Each page now declares its own.
  manifest: '/manifest.json',
  // ── Icons — Google Search picks up the largest icon it can find ──────────
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Message in a Bottle',
  },
  openGraph: {
    title: 'Message in a Bottle',
    description: 'Write an anonymous message, address it to a name, and let it drift into a public ocean of letters anyone can read.',
    url: 'https://messageinabottle.sbs',
    siteName: 'Message in a Bottle',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: 'https://i.ibb.co/GvX9XMwm/bottle-default.png',
        width: 1200,
        height: 630,
        alt: 'Message in a Bottle',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Message in a Bottle',
    description: 'Send anonymous messages into the digital ocean.',
    images: ['https://i.ibb.co/GvX9XMwm/bottle-default.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  // AdSense ownership verification — server-rendered so the crawler sees it
  // without running JavaScript. This tag identifies the site to AdSense and
  // sets no cookie, so it is not gated behind consent.
  ...(ADSENSE_CLIENT_ID
    ? { other: { 'google-adsense-account': ADSENSE_CLIENT_ID } }
    : {}),
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${manrope.variable} ${playfairDisplay.variable} ${abrilFatface.variable}`}
    >
      <head>
        {/* Viewport comes from the `viewport` export below; declaring it here
            as well would emit a duplicate tag. Search Console ownership token
            stays — it is a verification marker, not a tracker. */}
        <meta name="google-site-verification" content="YLiLJ6ExznDUcI5rOKtyZqiJwXQaPRigc-yE_jrPQJ8" />
      </head>
      <body className="font-body antialiased">
        {/* Keyboard users land here first and can jump straight to content. */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-15px focus:bg-background focus:px-4 focus:py-2 focus:text-foreground focus:shadow-subtle focus:outline-none focus:ring-2 focus:ring-ring"
        >
          Skip to main content
        </a>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {/* ConsentProvider sets Google Consent Mode defaults to "denied"
              before any Google tag can load, then gates the AdSense script,
              Vercel Analytics and the geo visit ping on the visitor's choice. */}
          <ConsentProvider>
            <FirebaseClientProvider>
              <RecipientProvider>
                <FavoritesProvider>
                  <CacheProvider>
                    <VisitorTracker />
                    <MainLayout>
                      {children}
                    </MainLayout>
                    <Toaster />
                    <BottomNav />
                    <AppFooter />
                    <AdSenseScript />
                    <GatedAnalytics />
                  </CacheProvider>
                </FavoritesProvider>
              </RecipientProvider>
            </FirebaseClientProvider>
          </ConsentProvider>
        </ThemeProvider>
      </body>
    </html >
  );
}
