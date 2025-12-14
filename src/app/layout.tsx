
'use client';
import { usePathname } from 'next/navigation';
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase';
import { VisitorTracker } from '@/components/VisitorTracker';
import { RecipientProvider } from '@/context/RecipientContext';
import { MessageCacheProvider } from '@/context/MessageCacheContext';

// Since we are using a hook (usePathname), we can't export metadata from here.
// We can move it to a template or a specific page if needed.
// export const metadata: Metadata = {
//   title: {
//     default: 'Message in a Bottle',
//     template: '%s | Message in a Bottle',
//   },
//   description: 'Send anonymous messages into the digital ocean.',
// };

function AppFooter() {
  const pathname = usePathname();
  const isAdminPage = pathname.startsWith('/admin');

  if (isAdminPage) {
    return null;
  }

  return (
    <footer className="py-6 text-center text-sm text-muted-foreground">
      © {new Date().getFullYear()} Message in a Bottle. All Rights Reserved.
    </footer>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;700&display=swap"
          rel="stylesheet"
        />
        <title>Message in a Bottle</title>
        <meta name="description" content="Send anonymous messages into the digital ocean." />
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
