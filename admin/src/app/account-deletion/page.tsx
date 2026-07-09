import type { Metadata } from 'next';

import { LegalPageView } from '@/components/legal/LegalPageView';
import { LEGAL_PAGES } from '@/components/legal/legal-content';

export const metadata: Metadata = {
  title: LEGAL_PAGES.pl['account-deletion'].title,
  description: LEGAL_PAGES.pl['account-deletion'].metaDescription,
};

export default function AccountDeletionPage() {
  return <LegalPageView pageId="account-deletion" />;
}
