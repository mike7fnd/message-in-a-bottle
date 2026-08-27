import type { Metadata } from 'next';
import TermsOfServicePage from './terms-client';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Read our terms of service.',
};

export default function TermsPage() {
  return <TermsOfServicePage />;
}
