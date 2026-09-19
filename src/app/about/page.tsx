import type { Metadata } from 'next';
import Link from 'next/link';
import AboutPageContent from './about-client';
import { AdBanner } from '@/components/ads/AdUnit';
import { AD_SLOTS, siteConfig } from '@/lib/site-config';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'About & Support',
  description:
    'What Message in a Bottle is, who runs it, how it works, and how to get in touch. Read community reviews and leave feedback.',
  alternates: { canonical: `${siteConfig.url}/about` },
  openGraph: {
    title: 'About Message in a Bottle',
    description:
      'What the site is, who runs it, and how anonymous messages work here.',
    url: `${siteConfig.url}/about`,
    siteName: siteConfig.name,
    type: 'website',
  },
};

/**
 * The introduction is rendered on the server rather than inside the client
 * component below it.
 *
 * The client part waits on a Firestore fetch and returns a skeleton until it
 * arrives, so anything placed there is invisible to a crawler and to anyone
 * with JavaScript off. The identity of the site and its operator is exactly
 * the content that has to be in the HTML, so it lives here.
 */
export default function AboutPage() {
  return (
    <div className="bg-background">
      <div className="container mx-auto max-w-2xl px-4 pt-8 md:pt-16">
        <h1 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl">
          About Message in a Bottle
        </h1>

        <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>
            Message in a Bottle is a place to write something you can&apos;t
            quite say out loud, address it to a name, and let go of it. You
            write a short note, put a first name on it, and it drifts into a
            public ocean of letters. You get a link you can pass on, or you can
            leave it to be found by whoever wanders past.
          </p>
          <p>
            It began as a hobby project and stayed one. There is no feed to
            scroll, no follower count, no likes to chase and nothing to sign up
            for. Most people who write here are saying something to someone who
            will probably never read it, which turns out to be the point.
          </p>

          <h2 className="pt-2 text-lg font-semibold text-foreground">
            How the bottles work
          </h2>
          <p>
            Every message is <strong className="text-foreground">public</strong>
            . Naming a recipient does not send them anything and does not keep
            anyone else out — it just files the note under that name, so all the
            messages written to &ldquo;Sam&rdquo; sit in Sam&apos;s bottle for
            anyone to open. There is no inbox and no notification. Treat
            anything you write here the way you would treat something pinned to
            a public noticeboard.
          </p>
          <p>
            Messages are unsigned. If you are signed in to an account, your
            messages are linked to it privately so you can edit or delete them
            later from your History page — readers still never see who wrote
            them. If you are not signed in, nothing at all connects the note to
            you.
          </p>
          <p>
            You can also seal a message until a chosen date, which turns it into
            a small time capsule: the text stays hidden behind a countdown until
            the day you picked.
          </p>

          <h2 className="pt-2 text-lg font-semibold text-foreground">
            Who runs it
          </h2>
          <p>
            The site is built and maintained by{' '}
            <strong className="text-foreground">{siteConfig.operator}</strong>,
            an independent developer in the Philippines. It is one person, not a
            company — no team, no investors, no marketing budget. It is free to
            use and paid for by advertising and the occasional donation.
          </p>
          <p>
            Anything you need — reporting a message, asking for something about
            you to be taken down, a privacy request, or just a bug — goes to the
            same place:{' '}
            <Link href="/contact" className="underline hover:text-foreground">
              the contact page
            </Link>
            , or{' '}
            <a
              href={`mailto:${siteConfig.contactEmail}`}
              className="underline hover:text-foreground"
            >
              {siteConfig.contactEmail}
            </a>
            . If a message names you, you can have it removed without an account
            and without proving who you are.
          </p>
          <p>
            The rules for what may be posted are in the{' '}
            <Link href="/terms" className="underline hover:text-foreground">
              Terms of Service
            </Link>
            , and what the site stores about you is set out in the{' '}
            <Link href="/privacy" className="underline hover:text-foreground">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>

      {/* Support, community reviews and the feedback form. */}
      <AboutPageContent />

      <div className="container mx-auto max-w-2xl px-4 pb-8">
        <AdBanner slot={AD_SLOTS.aboutFooter} />
      </div>
    </div>
  );
}
