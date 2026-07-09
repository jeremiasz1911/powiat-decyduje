import type { Metadata } from 'next';

import { LegalPageView } from '@/components/legal/LegalPageView';
import { LEGAL_PAGES } from '@/components/legal/legal-content';

export const metadata: Metadata = {
  title: LEGAL_PAGES.pl.support.title,
  description: LEGAL_PAGES.pl.support.metaDescription,
};

export default function SupportPage() {
  return <LegalPageView pageId="support" />;
}
