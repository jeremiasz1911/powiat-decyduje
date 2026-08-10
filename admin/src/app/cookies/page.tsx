import type { Metadata } from 'next';

import { LegalPageView } from '@/components/legal/LegalPageView';
import { LEGAL_PAGES } from '@/components/legal/legal-content';

export const metadata: Metadata = {
  title: LEGAL_PAGES.pl.cookies.title,
  description: LEGAL_PAGES.pl.cookies.metaDescription,
};

export default function CookiesPage() {
  return <LegalPageView pageId="cookies" />;
}
