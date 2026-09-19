import { getContent } from '@/lib/content';
import HomeClient from './home-client';
import type { Metadata } from 'next';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Message in a Bottle — Send Anonymous Messages',
  description: 'Send anonymous messages into the digital ocean. Share your feelings with songs, photos, and sketches. Your message floats to whoever needs to hear it.',
  keywords: ['anonymous message', 'message in a bottle', 'send anonymous message', 'digital ocean', 'secret message', 'anonymous letter'],
  alternates: {
    canonical: 'https://messageinabottle.sbs',
  },
  openGraph: {
    title: 'Message in a Bottle — Send Anonymous Messages',
    description: 'Send anonymous messages into the digital ocean. Share your feelings with songs, photos, and sketches.',
    url: 'https://messageinabottle.sbs',
    siteName: 'Message in a Bottle',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: 'https://i.ibb.co/GvX9XMwm/bottle-default.png',
        width: 1200,
        height: 630,
        alt: 'Message in a Bottle — Send Anonymous Messages',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Message in a Bottle — Send Anonymous Messages',
    description: 'Send anonymous messages into the digital ocean. Share your feelings with songs, photos, and sketches.',
    images: ['https://i.ibb.co/GvX9XMwm/bottle-default.png'],
  },
};

export default async function Home() {
  const content = await getContent();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Message in a Bottle',
    url: 'https://messageinabottle.sbs',
    description: 'Send anonymous messages into the digital ocean. Share your feelings with songs, photos, and sketches.',
    applicationCategory: 'SocialNetworkingApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    // No aggregateRating here. It previously declared a hardcoded 4.8 from 100
    // ratings, which no data backs up — the real reviews live in the Firestore
    // `reviews` collection. Fabricated review markup is a structured-data
    // policy violation as well as an AdSense content problem, so it is gone
    // rather than guessed at.
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomeClient content={content} />
    </>
  );
}
