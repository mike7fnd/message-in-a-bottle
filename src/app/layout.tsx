
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
  title: {
    default: 'Message in a Bottle',
    template: '%s | Message in a Bottle',
  },
  description: 'Send anonymous messages into the digital ocean.',
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
