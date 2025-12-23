
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase';
import { RecipientProvider } from '@/context/RecipientContext';
import { MessageCacheProvider } from '@/context/MessageCacheContext';
import { VisitorTracker } from '@/components/VisitorTracker';
import { AppFooter } from '@/components/AppFooter';
import { ThemeProvider } from '@/components/ThemeProvider';
import { BottomNav } from '@/components/BottomNav';
import { MainLayout } from '@/components/MainLayout';
import { PageCache } from '@/components/PageCache';


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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6787998625628876"
     crossOrigin="anonymous"></script>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Abril+Fatface&family=Manrope:wght@300;400;700&family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
            <FirebaseClientProvider>
              <RecipientProvider>
                <MessageCacheProvider>
                  <VisitorTracker />
                  <MainLayout>
                    <PageCache>
                      {children}
                    </PageCache>
                  </MainLayout>
                  <Toaster />
                  <BottomNav />
                  <AppFooter />
                </MessageCacheProvider>
              </RecipientProvider>
            </FirebaseClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
