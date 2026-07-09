import type { Metadata } from 'next';

import { LegalPageView } from '@/components/legal/LegalPageView';
import { LEGAL_PAGES } from '@/components/legal/legal-content';

export const metadata: Metadata = {
  title: LEGAL_PAGES.pl.privacy.title,
  description: LEGAL_PAGES.pl.privacy.metaDescription,
};

export default function PrivacyPage() {
  return <LegalPageView pageId="privacy" />;
}
