import type { Metadata } from 'next';
import Link from 'next/link';
import { siteConfig } from '@/lib/site-config';
import { ContactForm } from './contact-form';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Get in touch with the person who runs Message in a Bottle — report a message, ask a question, request removal of something you wrote, or raise a privacy request.',
  alternates: { canonical: `${siteConfig.url}/contact` },
  openGraph: {
    title: 'Contact — Message in a Bottle',
    description:
      'Report a message, ask a question, or make a privacy request. Messages reach the site operator directly.',
    url: `${siteConfig.url}/contact`,
    siteName: siteConfig.name,
    type: 'website',
  },
};

/**
 * Server-rendered so the address and the reasons to write are in the HTML
 * without running JavaScript. Only the form itself is a client component.
 */
export default function ContactPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <div className="container mx-auto max-w-2xl px-4 py-8 md:py-16">
        <h1 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl">
          Contact
        </h1>
        <p className="mt-2 text-muted-foreground">
          Message in a Bottle is run by one person, {siteConfig.operator}. Mail
          reaches him directly and he answers it himself, so please allow a few
          days.
        </p>

        <h2 className="mt-8 text-xl font-semibold tracking-tight">
          Reach him by email
        </h2>
        <p className="mt-2 text-muted-foreground">
          The fastest route is email, especially for anything urgent or legal:
        </p>
        <p className="mt-2">
          <a
            href={`mailto:${siteConfig.contactEmail}`}
            className="text-lg font-medium underline underline-offset-4 hover:text-muted-foreground"
          >
            {siteConfig.contactEmail}
          </a>
        </p>

        <h2 className="mt-8 text-xl font-semibold tracking-tight">
          What people usually write about
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-muted-foreground">
          <li>
            <span className="font-medium text-foreground">
              Reporting a message.
            </span>{' '}
            Anything abusive, threatening, sexual involving a minor, or that
            exposes someone&apos;s private information. Include the link to the
            message. These are read first.
          </li>
          <li>
            <span className="font-medium text-foreground">
              Removing something.
            </span>{' '}
            If a message names you or was written about you, it can be taken
            down. You do not need an account and you do not need to prove who
            you are — send the link and say why.
          </li>
          <li>
            <span className="font-medium text-foreground">
              Privacy requests.
            </span>{' '}
            Access, correction or deletion of data held about you. See the{' '}
            <Link href="/privacy" className="underline hover:text-foreground">
              Privacy Policy
            </Link>{' '}
            for what is actually stored.
          </li>
          <li>
            <span className="font-medium text-foreground">
              Copyright complaints.
            </span>{' '}
            Tell him which message reproduces your work and where the original
            lives.
          </li>
          <li>
            <span className="font-medium text-foreground">
              Bugs and suggestions.
            </span>{' '}
            Something broken, or an idea for the site.
          </li>
        </ul>

        <h2 className="mt-10 text-xl font-semibold tracking-tight">
          Or use this form
        </h2>
        <ContactForm />
      </div>
    </div>
  );
}
