import type { Metadata } from 'next';

import { LegalPageView } from '@/components/legal/LegalPageView';
import { fetchSafetyStandardsPageCMS } from '@/lib/data';
import { safetyStandardsCmsToLegalPages } from '@/lib/safety-standards-page';

export const metadata: Metadata = {
  title: 'Standardy bezpieczeństwa dzieci | Powiat Decyduje',
  description: 'Standardy bezpieczeństwa dzieci i przeciwdziałania CSAE w aplikacji Powiat Decyduje.',
  robots: { index: true, follow: true },
};

export const dynamic = 'force-dynamic';

export default async function StandardyPage() {
  const cms = await fetchSafetyStandardsPageCMS();
  const cmsContent = cms ? safetyStandardsCmsToLegalPages(cms) : undefined;

  return (
    <LegalPageView
      pageId="safety-standards"
      cmsContent={cmsContent}
      eyebrowPl="Bezpieczeństwo dzieci"
      eyebrowEn="Child safety"
    />
  );
}
