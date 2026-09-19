import type { Metadata } from 'next';
import AdminShell from './admin-shell';

/**
 * Server layout wrapping the client-side admin shell.
 *
 * It exists so the whole /admin subtree can carry a robots directive: the
 * shell is a client component and client components cannot export `metadata`.
 * robots.txt already disallows crawling here, but that only stops the fetch —
 * a disallowed URL can still be indexed from an external link. `noindex` is
 * what actually keeps it out of results.
 */
export const metadata: Metadata = {
  title: 'Admin',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminShell>{children}</AdminShell>;
}
