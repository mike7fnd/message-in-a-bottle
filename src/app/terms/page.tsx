import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { POLICY_LAST_UPDATED, siteConfig } from '@/lib/site-config';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'The rules for using Message in a Bottle: what you may post, what happens to what you write, how to report or remove a message, and the limits of the service.',
  alternates: { canonical: `${siteConfig.url}/terms` },
};

export default function TermsPage() {
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
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Last updated: {POLICY_LAST_UPDATED}
        </p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted-foreground">
          <p>
            These terms cover your use of Message in a Bottle at{' '}
            {siteConfig.url.replace(/^https:\/\//, '')} (the &ldquo;Service&rdquo;),
            run by {siteConfig.operator}. By using it you agree to them. If you
            do not, please do not use the Service.
          </p>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              1. What the Service actually is
            </h2>
            <p>
              You write a short message and address it to a name. The message is
              published publicly and given a link. Anyone can browse all
              messages and read the ones addressed to any name.
            </p>
            <p className="rounded-20px border border-border bg-muted/40 p-4 text-foreground">
              Nothing is delivered to anybody. Typing a name does not send that
              person anything and does not mean they will ever see it. There is
              no private inbox, no notification, and no guarantee the intended
              person exists or reads it.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              2. Who may use it
            </h2>
            <p>
              You must be at least 13 years old. If you are under the age of
              majority where you live, use it only with a parent or
              guardian&apos;s agreement. No account is needed to send or read
              messages.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              3. What you write
            </h2>
            <p>
              You keep ownership of what you write. By posting it you give{' '}
              {siteConfig.operator} a non-exclusive, worldwide, royalty-free
              licence to store, display and distribute it as part of running the
              Service. That licence ends when the message is deleted.
            </p>
            <p>
              You are responsible for what you post, and you confirm you have
              the right to post it.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              4. What you must not post
            </h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                Anything illegal, threatening, harassing, defamatory, or
                intended to bully or intimidate a specific person.
              </li>
              <li>
                Sexual content involving minors, in any form. This is reported
                to the authorities.
              </li>
              <li>
                Someone else&apos;s private information — home address, phone
                number, workplace, financial details, identity documents, or
                intimate images — whether or not you know them.
              </li>
              <li>
                Hate speech or incitement to violence or discrimination on the
                basis of race, ethnicity, national origin, religion, sex, gender
                identity, sexual orientation, disability or age.
              </li>
              <li>
                Content that infringes anyone&apos;s copyright, trademark or
                other rights.
              </li>
              <li>Spam, advertising, scams, malware or chain messages.</li>
              <li>
                Impersonation of a real person or organisation, or writing
                designed to look like it comes from them.
              </li>
            </ul>
            <p>
              Messages that break these rules are removed when found or
              reported, without notice.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              5. Reporting and removal
            </h2>
            <p>
              Every message has a &ldquo;Report&rdquo; control, and you can also
              use the{' '}
              <Link href="/contact" className="underline hover:text-foreground">
                contact page
              </Link>{' '}
              or write to{' '}
              <a
                href={`mailto:${siteConfig.contactEmail}`}
                className="underline hover:text-foreground"
              >
                {siteConfig.contactEmail}
              </a>
              . Reports about a named private person, sexual content involving
              minors, or threats are looked at first.
            </p>
            <p>
              If a message is about you, or names you, you can have it removed.
              You do not need an account and you do not need to prove who you
              are — send the link and say why.
            </p>
            <p>
              Moderation is done by one person by hand, and is reactive rather
              than automatic. Content is not reviewed before it appears.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              6. Editing and deleting your own messages
            </h2>
            <p>
              If you were signed in to an account when you sent a message, you
              can edit or delete it from your History page. If you sent it
              without an account, it carries no identifier, so there is no way
              for the Service to know it was yours and you cannot remove it
              yourself — ask, with the link, and it will be removed.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              7. Sending limits
            </h2>
            <p>
              Sending is rate-limited per browser to keep the ocean readable.
              Deliberately working around that limit, scripting the Service, or
              scraping it in bulk is not permitted.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              8. Advertising
            </h2>
            <p>
              The Service shows advertisements supplied by Google AdSense. Ads
              are chosen by Google, not by {siteConfig.operator}, and their
              content is not endorsed here. Ads appear only after you accept the
              advertising category in the cookie banner. Please do not click ads
              you are not genuinely interested in — artificial clicks put the
              site&apos;s advertising account at risk.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              9. Accounts
            </h2>
            <p>
              Keep your password to yourself; you are responsible for activity
              under your account. Accounts that break these terms may be
              suspended or removed. You can ask for your account to be deleted
              at any time.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              10. Availability
            </h2>
            <p>
              The Service is free and provided &ldquo;as is&rdquo;, with no
              warranty of any kind. It may be slow, unavailable, changed or
              discontinued at any time, and messages could be lost through
              failure or error. Please keep your own copy of anything you would
              be sorry to lose.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              11. Limitation of liability
            </h2>
            <p>
              To the fullest extent the law allows, {siteConfig.operator} is not
              liable for indirect, incidental, special or consequential damages
              arising from your use of, or inability to use, the Service,
              including anything arising from content other people post. Nothing
              here limits liability that cannot be limited by law.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              12. Other sites
            </h2>
            <p>
              Messages and pages may link to or embed third-party content, such
              as a Spotify player. Those services have their own terms and
              privacy policies and are not controlled from here.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              13. Intellectual property
            </h2>
            <p>
              The name, design, illustrations and code of the Service belong to{' '}
              {siteConfig.operator}, excluding content posted by users and
              material owned by third parties such as album artwork supplied by
              Spotify. Do not copy or reuse them without permission.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              14. Changes
            </h2>
            <p>
              These terms may change; the date at the top will change with them.
              Continuing to use the Service after a change means you accept it.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              15. Governing law
            </h2>
            <p>
              These terms are governed by the laws of the{' '}
              {siteConfig.jurisdiction}, without regard to conflict of law
              rules. This does not remove any protection you have under the
              mandatory law of the country you live in.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              16. Contact
            </h2>
            <p>
              {siteConfig.operator} —{' '}
              <a
                href={`mailto:${siteConfig.contactEmail}`}
                className="underline hover:text-foreground"
              >
                {siteConfig.contactEmail}
              </a>
              . See also the{' '}
              <Link href="/privacy" className="underline hover:text-foreground">
                Privacy Policy
              </Link>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
