import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConsentSettingsButton } from '@/components/ConsentSettingsButton';
import { POLICY_LAST_UPDATED, siteConfig } from '@/lib/site-config';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'What Message in a Bottle stores, which third parties are involved, how cookies and local storage are used, and how to exercise your privacy rights.',
  alternates: { canonical: `${siteConfig.url}/privacy` },
};

/**
 * Server-rendered, and deliberately not wrapped in a fixed-height ScrollArea
 * any more — the previous version hid a long policy inside a 32rem scroll box,
 * which is poor reading UX and makes the text easy to miss.
 *
 * Everything below describes behaviour that exists in this repository. When
 * you change what the app collects, change this page in the same commit and
 * bump POLICY_LAST_UPDATED in src/lib/site-config.ts.
 */
export default function PrivacyPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <div className="container mx-auto max-w-2xl px-4 py-8 md:py-16">
        <div className="mb-4">
          <Button asChild variant="link" className="pl-0 text-muted-foreground">
            <Link href="/about">
              <ChevronLeft className="mr-1 h-4 w-4" /> Back to About
            </Link>
          </Button>
        </div>

        <h1 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Last updated: {POLICY_LAST_UPDATED}
        </p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section className="space-y-3">
            <p>
              Message in a Bottle ({siteConfig.url.replace(/^https:\/\//, '')})
              is run by {siteConfig.operator}, an individual developer based in
              the Philippines. It is not a company. This page describes what the
              site stores, who else can see it, and what you can ask for.
            </p>
            <p className="rounded-20px border border-border bg-muted/40 p-4 text-foreground">
              <strong>Read this part if you read nothing else.</strong> Every
              message sent through this site is public. Anyone can browse them
              and anyone who types or guesses a name can read the messages
              addressed to it. There is no private inbox and no delivery to a
              specific person. Do not put anything in a message that you would
              not put on a public noticeboard — no addresses, phone numbers,
              passwords, financial details, or anything you would not want a
              stranger to read.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              1. What is collected
            </h2>

            <h3 className="font-semibold text-foreground">
              Automatic, for everyone
            </h3>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong className="text-foreground">
                  An anonymous account.
                </strong>{' '}
                The moment you open the site you are signed in anonymously with
                Firebase Authentication and given a random identifier. This is
                what lets the database accept a message from you without
                letting anyone impersonate anyone else. It is not linked to your
                name or email, and it is stored in your browser.
              </li>
              <li>
                <strong className="text-foreground">Server logs.</strong> The
                host (Vercel) records standard request information including IP
                address, user agent and the URL requested. These are Vercel&apos;s
                operational logs, not something this site reads or keeps
                separately.
              </li>
            </ul>

            <h3 className="font-semibold text-foreground">
              Only if you do the thing
            </h3>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong className="text-foreground">Messages you send.</strong>{' '}
                The text, the recipient name you typed (stored in lower case),
                the time, and — if you added them — an attached image, a Spotify
                track id, and an &ldquo;opens on&rdquo; date. If you are signed
                in to an account, your user id is stored with the message so you
                can edit or delete it later. If you are not, no identifier is
                attached and the message cannot be traced back to you by us.
              </li>
              <li>
                <strong className="text-foreground">An account, if you make one.</strong>{' '}
                Email address and password, handled by Firebase Authentication —
                the password is never visible to this site. If you sign in with
                Google instead, Google provides your email address, display name
                and profile picture URL. You can also set a display name and
                avatar yourself.
              </li>
              <li>
                <strong className="text-foreground">Reviews.</strong> If you
                leave a review, the star rating, the text, your display name and
                your user id are stored and shown publicly on the About page.
              </li>
              <li>
                <strong className="text-foreground">
                  Contact and feedback messages.
                </strong>{' '}
                What you write, the topic you picked, the time, your user id,
                and the email address you give if you want a reply. Only{' '}
                {siteConfig.operator} can read these.
              </li>
              <li>
                <strong className="text-foreground">
                  Country and city, if you allow analytics.
                </strong>{' '}
                Your IP address is sent to ip-api.com, which returns an
                approximate country and city. Only that country and city are
                stored — the IP address itself is not written to the database.
                This happens once per browsing session and only after you accept
                the analytics category. No precise or GPS location is ever
                collected.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              2. Cookies and browser storage
            </h2>
            <p>
              This site sets no cookies of its own. It uses your browser&apos;s
              local storage, which stays on your device. Third parties listed in
              section 4 may set their own cookies.
            </p>

            <h3 className="font-semibold text-foreground">
              Strictly necessary — always on
            </h3>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                Firebase Authentication stores your sign-in session (including
                the anonymous one) in your browser&apos;s IndexedDB.
              </li>
              <li>
                <code className="text-foreground">theme</code> — whether you
                chose light or dark.
              </li>
              <li>
                <code className="text-foreground">messageDraft</code> — an
                unsent message, so you do not lose it on a refresh.
              </li>
              <li>
                <code className="text-foreground">messageFavorites</code> —
                messages you hearted. Stored only on your device; we cannot see
                them.
              </li>
              <li>
                <code className="text-foreground">mitb_last_sent</code> — when
                you last sent a message, used for the sending cooldown.
              </li>
              <li>
                <code className="text-foreground">mitb_cache:…</code> — a copy
                of pages you have already loaded, so the site is fast and works
                offline.
              </li>
              <li>
                <code className="text-foreground">miab_consent_v1</code> — the
                cookie choice you made on this page banner.
              </li>
              <li>
                <code className="text-foreground">miab_contact_last_sent</code>{' '}
                — when you last used the contact form, to limit spam.
              </li>
            </ul>

            <h3 className="font-semibold text-foreground">
              Analytics — only with your consent
            </h3>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <code className="text-foreground">mitb_visitor_tracked</code> —
                a session flag so one visit is counted once.
              </li>
              <li>
                Vercel Analytics, which counts page views. It does not use
                cookies and does not build a profile of you across sites.
              </li>
            </ul>

            <h3 className="font-semibold text-foreground">
              Advertising
            </h3>
            <p>
              The site is free because it carries Google AdSense, so the AdSense
              script loads on every page. What your choice controls is whether
              the ads are <em>personalised</em>. Until you opt in, Google is
              told to deny advertising storage — it still serves ads, but
              generic ones, chosen without building a profile of you and without
              setting advertising cookies. Turning personalised advertising on
              lets Google use cookies to tailor and measure them.
            </p>

            <p className="pt-2">
              <ConsentSettingsButton />
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              3. Advertising and Google
            </h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                Third-party vendors, including Google, use cookies to serve ads
                based on your prior visits to this and other websites.
              </li>
              <li>
                Google&apos;s use of advertising cookies enables it and its
                partners to serve ads to you based on your visit to this site
                and/or other sites on the internet.
              </li>
              <li>
                You may opt out of personalised advertising by visiting{' '}
                <a
                  href="https://www.google.com/settings/ads"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-foreground"
                >
                  Google Ads Settings
                </a>
                . You can opt out of a third-party vendor&apos;s use of cookies
                for personalised advertising at{' '}
                <a
                  href="https://www.aboutads.info/choices/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-foreground"
                >
                  aboutads.info
                </a>
                .
              </li>
              <li>
                More detail on how Google uses data from sites that use its
                services is at{' '}
                <a
                  href="https://policies.google.com/technologies/partner-sites"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-foreground"
                >
                  policies.google.com/technologies/partner-sites
                </a>
                .
              </li>
            </ul>
            <p>
              If you are in the European Economic Area, the United Kingdom or
              Switzerland, ads are not personalised unless a valid consent
              signal has been given. Advertising storage, ad user data and ad
              personalisation all start denied on every page load and are only
              granted if you choose to grant them.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              4. Third parties involved
            </h2>
            <p>These are every external service this site actually uses.</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong className="text-foreground">
                  Google Firebase (Authentication, Firestore)
                </strong>{' '}
                — accounts and the message database.{' '}
                <a
                  href="https://firebase.google.com/support/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-foreground"
                >
                  Privacy
                </a>
              </li>
              <li>
                <strong className="text-foreground">Google AdSense</strong> —
                advertising, only with consent.{' '}
                <a
                  href="https://policies.google.com/technologies/ads"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-foreground"
                >
                  Ad policy
                </a>
              </li>
              <li>
                <strong className="text-foreground">Vercel</strong> — hosting,
                and page-view analytics with consent.{' '}
                <a
                  href="https://vercel.com/legal/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-foreground"
                >
                  Privacy
                </a>
              </li>
              <li>
                <strong className="text-foreground">Spotify</strong> — song
                search, and the player embedded in messages that have a track
                attached. The player loads with the message, so opening a
                message that has a song lets Spotify see your IP address and set
                its own cookies, whether or not you press play. Song search runs
                on our server, so Spotify does not see you while you are
                choosing a track.{' '}
                <a
                  href="https://www.spotify.com/legal/privacy-policy/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-foreground"
                >
                  Privacy
                </a>
              </li>
              <li>
                <strong className="text-foreground">ip-api.com</strong> —
                converts an IP address into an approximate country and city,
                only with analytics consent.{' '}
                <a
                  href="https://ip-api.com/docs/legal"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-foreground"
                >
                  Legal
                </a>
              </li>
              <li>
                <strong className="text-foreground">Google Fonts</strong> —
                typefaces are downloaded at build time and served from this
                site&apos;s own domain, so your browser never contacts Google to
                fetch them.
              </li>
              <li>
                <strong className="text-foreground">
                  Image hosts (i.ibb.co, image2url.com and others)
                </strong>{' '}
                — illustrations are loaded from these, which means they see your
                IP address as any image host would.
              </li>
            </ul>
            <p>
              Nothing is sold, and nothing is shared for advertising beyond what
              Google receives through AdSense as described above.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              5. How long things are kept
            </h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong className="text-foreground">Messages</strong> stay until
                they are deleted. If you were signed in when you sent one, you
                can delete it yourself from your History page. If you sent it
                anonymously you cannot delete it yourself — ask via the{' '}
                <Link href="/contact" className="underline hover:text-foreground">
                  contact page
                </Link>{' '}
                and include the link.
              </li>
              <li>
                <strong className="text-foreground">Reviews</strong> stay until
                you or the operator delete them.
              </li>
              <li>
                <strong className="text-foreground">
                  Contact and feedback messages
                </strong>{' '}
                are kept while they are being dealt with and then removed.
              </li>
              <li>
                <strong className="text-foreground">Visit records</strong>{' '}
                (country and city only) are kept as aggregate history.
              </li>
              <li>
                <strong className="text-foreground">Local storage</strong> stays
                until you clear your browser data. Clearing it removes your
                favorites and drafts permanently.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              6. Your rights
            </h2>
            <p>
              Depending on where you live — for example under the GDPR in the
              EEA and UK, or the Data Privacy Act 2012 in the Philippines — you
              may have the right to ask for a copy of your data, to correct it,
              to have it deleted, to restrict or object to how it is used, and
              to complain to your data protection authority.
            </p>
            <p>
              To exercise any of these, write to{' '}
              <a
                href={`mailto:${siteConfig.contactEmail}`}
                className="underline hover:text-foreground"
              >
                {siteConfig.contactEmail}
              </a>{' '}
              or use the{' '}
              <Link href="/contact" className="underline hover:text-foreground">
                contact form
              </Link>
              . Requests are handled by one person, so please allow a few days.
            </p>
            <p>
              A practical note on anonymous messages: because they carry no
              identifier, there is no way to prove which ones are yours. If you
              want an anonymous message removed, send the link and say why — it
              will be taken down without asking you to identify yourself.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              7. Children
            </h2>
            <p>
              This site is not intended for children under 13, and accounts are
              not knowingly created for them. If you believe a child has
              provided personal information here, write to{' '}
              <a
                href={`mailto:${siteConfig.contactEmail}`}
                className="underline hover:text-foreground"
              >
                {siteConfig.contactEmail}
              </a>{' '}
              and it will be deleted.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              8. Security, honestly stated
            </h2>
            <p>
              Traffic is served over HTTPS and database access is restricted by
              server-side security rules. But this is a small project run by one
              person in his spare time, not an audited service. No site can
              promise perfect security, and this one makes no such promise.
              Please treat everything you post as public and permanent.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              9. Changes
            </h2>
            <p>
              If this policy changes, the date at the top changes with it.
              Material changes will be noted on the site.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              10. Contact
            </h2>
            <p>
              {siteConfig.operator} —{' '}
              <a
                href={`mailto:${siteConfig.contactEmail}`}
                className="underline hover:text-foreground"
              >
                {siteConfig.contactEmail}
              </a>
              . There is also a{' '}
              <Link href="/contact" className="underline hover:text-foreground">
                contact form
              </Link>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
