import type { Metadata } from 'next';
import AboutPageContent from './about-client';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'About & Support',
  description: 'Support the developers, read community reviews, and leave feedback.',
};

export default function AboutPage() {
  return <AboutPageContent />;
}
