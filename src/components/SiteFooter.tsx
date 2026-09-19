'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useConsent } from '@/components/ConsentProvider';
import { siteConfig } from '@/lib/site-config';

/**
 * Only the links that need a permanent home live here.
 *
 * Home, Browse and Send are deliberately left out — they are already in the
 * bottom nav on mobile and the sidebar on desktop, and repeating them just
 * made the footer noisy. What remains is the set that has to stay reachable
 * from the page itself.
 */
const FOOTER_LINKS = [
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
];

export function SiteFooter({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  const { openPreferences } = useConsent();

  return (
    <footer className={className} style={style}>
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <nav aria-label="Footer">
          <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm">
            {FOOTER_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Button
                variant="link"
                onClick={openPreferences}
                className="h-auto p-0 text-sm font-normal text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                Cookies
              </Button>
            </li>
          </ul>
        </nav>

        <p className="mt-5 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} {siteConfig.name}
        </p>
      </div>
    </footer>
  );
}
