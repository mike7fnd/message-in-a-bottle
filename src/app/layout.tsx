
import type { Metadata } from 'next';
import './globals.css';
import { Manrope, Playfair_Display, Abril_Fatface } from 'next/font/google';
import Script from 'next/script';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase';
import { RecipientProvider } from '@/context/RecipientContext';
import { MessageCacheProvider } from '@/context/MessageCacheContext';
import { FavoritesProvider } from '@/context/FavoritesContext';
import { VisitorTracker } from '@/components/VisitorTracker';
import { AppFooter } from '@/components/AppFooter';
import { ThemeProvider } from '@/components/ThemeProvider';
import { BottomNav } from '@/components/BottomNav';
import { MainLayout } from '@/components/MainLayout';
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
  description: 'Send anonymous messages into the digital ocean.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Message in a Bottle',
  },
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
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="google-site-verification" content="YLiLJ6ExznDUcI5rOKtyZqiJwXQaPRigc-yE_jrPQJ8" />
        <meta name="google-adsense-account" content="ca-pub-2022366633301528" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className="font-body antialiased">
        {/* AdSense loads after page is interactive — does not block first paint */}
        <Script
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2022366633301528"
          strategy="lazyOnload"
          crossOrigin="anonymous"
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <FirebaseClientProvider>
            <RecipientProvider>
              <MessageCacheProvider>
                <FavoritesProvider>
                  <CacheProvider>
                    <VisitorTracker />
                    <MainLayout>
                      {children}
                    </MainLayout>
                    <Toaster />
                    <BottomNav />
                    <AppFooter />
                  </CacheProvider>
                </FavoritesProvider>
              </MessageCacheProvider>
            </RecipientProvider>
          </FirebaseClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
