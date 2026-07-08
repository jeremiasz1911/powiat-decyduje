import type { Metadata } from 'next';

import { LegalPageView } from '@/components/legal/LegalPageView';
import { LEGAL_PAGES } from '@/components/legal/legal-content';

export const metadata: Metadata = {
  title: LEGAL_PAGES.pl.terms.title,
  description: LEGAL_PAGES.pl.terms.metaDescription,
};

export default function TermsPage() {
  return <LegalPageView pageId="terms" />;
}
