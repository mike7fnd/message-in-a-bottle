
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase';
import { VisitorTracker } from '@/components/VisitorTracker';
import { RecipientProvider } from '@/context/RecipientContext';
import { MessageCacheProvider } from '@/context/MessageCacheContext';
import { AppFooter } from '@/components/AppFooter';
import { ThemeProvider } from '@/components/ThemeProvider';

export const metadata: Metadata = {
  metadataBase: new URL('https://messageinthebottle.vercel.app'),
  title: {
    default: 'Message in a Bottle',
    template: '%s | Message in a Bottle',
  },
  description: 'Send anonymous messages into the digital ocean. A place to share thoughts, feelings, and secrets without revealing who you are.',
   icons: {
    icon: [
      { url: '/favicon.ico' },
    ],
    apple: [
      { url: '/favicon.ico', sizes: '180x180' },
    ],
  },
keywords: [
  'anonymous message',
  'anonymous messaging',
  'send anonymous message',
  'receive anonymous messages',
  'anonymous confessions',
  'private confession',
  'secret confession',
  'secret message',
  'send secret message',
  'hidden message',
  'private message online',

  'message in a bottle',
  'digital message in a bottle',
  'virtual message in a bottle',
  'online message in a bottle',
  'mitb',
  'digital ocean',
  'messages in the ocean',
  'throw a message into the ocean',

  'dedication message',
  'write a dedication',
  'emotional dedication',
  'personal dedication message',
  'love dedication',
  'farewell message',

  'confession',
  'online confession',
  'anonymous confession site',
  'confess secrets online',
  'share secrets anonymously',

  'share thoughts',
  'share feelings',
  'express emotions',
  'emotional writing',
  'thought sharing platform',
  'safe space to share thoughts',

  'digital diary',
  'anonymous diary',
  'online journal',
  'private online journal',

  'mental health expression',
  'emotional release',
  'vent anonymously',
  'write your thoughts',

  'story sharing',
  'short anonymous stories',
  'personal stories online',

  'message sharing platform',
  'anonymous social platform',
  'privacy focused messaging',
  'no login messaging'
]
  ,
  openGraph: {
    title: 'Message in a Bottle',
    description: 'Send anonymous messages into the digital ocean.',
    type: 'website',
    locale: 'en_US',
    url: 'https://messagethebottle.vercel.app',
    siteName: 'Message in a Bottle',
    images: [
      {
        url: 'https://images.pexels.com/photos/35230228/pexels-photo-35230228.png',
        width: 1200,
        height: 630,
        alt: 'A glass bottle with a message inside on a sandy beach.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Message in a Bottle',
    description: 'Send anonymous messages into the digital ocean.',
    images: ['https://images.pexels.com/photos/35230228/pexels-photo-35230228.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
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
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
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
        </ThemeProvider>
      </body>
    </html>
  );
}
