import type { Metadata } from 'next';
import SettingsPage from './settings-client';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Settings',
  description: 'Manage your app preferences.',
};

export default function SettingsPage() {
  return <SettingsPage />;
}
