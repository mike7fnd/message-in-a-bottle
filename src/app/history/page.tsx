import type { Metadata } from 'next';
import HistoryPageContent from './history-client';

export const revalidate = 0; // Always dynamic — shows user's own sent messages

export const metadata: Metadata = {
  title: 'Message History',
  description: 'View and manage your recently sent messages.',
};

export default function HistoryPage() {
  return <HistoryPageContent />;
}
