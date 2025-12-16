
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase';
import { VisitorTracker } from '@/components/VisitorTracker';
import { RecipientProvider } from '@/context/RecipientContext';
import { MessageCacheProvider } from '@/context/MessageCacheContext';
import { AppFooter } from '@/components/AppFooter';

const baseUrl = 'https://message-in-a-bottle-gilt.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'Message in a Bottle',
    template: '%s | Message in a Bottle',
  },
  description: 'Send anonymous messages into the digital ocean. A modern twist on a classic way to connect.',
  keywords: ['anonymous message', 'digital message', 'message in a bottle', 'send message', 'online message'],
  openGraph: {
    title: 'Message in a Bottle',
    description: 'Send anonymous messages into the digital ocean.',
    url: baseUrl,
    siteName: 'Message in a Bottle',
    images: [
      {
        url: '/og-image.png', // It's good practice to have a dedicated OG image
        width: 1200,
        height: 630,
        alt: 'A message in a glass bottle on a beach.',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Message in a Bottle',
    description: 'Send anonymous messages into the digital ocean.',
    images: ['/og-image.png'],
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
};

const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    url: baseUrl,
    name: 'Message in a Bottle',
    description: 'Send anonymous messages into the digital ocean.',
    potentialAction: {
        '@type': 'SearchAction',
        target: `${baseUrl}/browse?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
    },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <head>
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;700&family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <FirebaseClientProvider>
          <RecipientProvider>
            <MessageCacheProvider>
              <VisitorTracker />
              <div className="flex min-h-dvh flex-col">{children}</div>
              <Toaster />
              <AppFooter />
            </MessageCacheProvider>
          </RecipientProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
