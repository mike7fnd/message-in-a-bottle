import type { Metadata } from 'next';
import AboutPageContent from './about-client';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'About & Support',
  description: 'Support the Message in a Bottle developers, read community reviews, and leave feedback. Join over 100,000 users.',
  alternates: {
    canonical: 'https://messageinabottle.sbs/about',
  },
};

export default function AboutPage() {
  return <AboutPageContent />;
}
