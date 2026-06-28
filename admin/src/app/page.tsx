import { redirect } from 'next/navigation';

import { getAdminSessionFromCookies } from '@/lib/auth';

export default async function HomePage() {
  const authenticated = await getAdminSessionFromCookies();
  redirect(authenticated ? '/dashboard' : '/login');
}
