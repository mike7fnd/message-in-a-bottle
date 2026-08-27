import type { Metadata } from 'next';
import PrivacyPolicyPage from './privacy-client';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Read our privacy policy.',
};

export default function PrivacyPage() {
  return <PrivacyPolicyPage />;
}
