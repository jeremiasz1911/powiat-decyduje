import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { LandingPage } from '@/components/landing/LandingPage';
import { getAdminSessionFromCookies } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'Powiat Decyduje — aplikacja dla mieszkańców Powiatu Mławskiego',
  description:
    'Aplikacja dla mieszkańców Powiatu Mławskiego do zgłaszania, przeglądania i wspierania lokalnych inicjatyw.',
};

export default async function HomePage() {
  const authenticated = await getAdminSessionFromCookies();
  if (authenticated) {
    redirect('/dashboard');
  }

  return <LandingPage />;
}
