'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useConsent } from '@/components/ConsentProvider';
import { siteConfig } from '@/lib/site-config';

const FOOTER_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/browse', label: 'Browse' },
  { href: '/send', label: 'Send' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms of Service' },
];

/**
 * Site-wide footer. Rendered on every non-admin page on both mobile and
 * desktop, so the legal pages are reachable from anywhere in one tap.
 */
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
      <div className="container mx-auto max-w-4xl px-4 py-10">
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
                Cookie settings
              </Button>
            </li>
          </ul>
        </nav>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} {siteConfig.name}. Built and run by{' '}
          {siteConfig.operator}.
        </p>
        <p className="mt-1 text-center text-xs text-muted-foreground">
          Messages posted here are public. Please don&apos;t share anything
          private.
        </p>
      </div>
    </footer>
  );
}
