import {
  LEGAL_PAGES,
  type LegalLang,
  type LegalPageContent,
} from '@/components/legal/legal-content';
import { legalBlocksToText, legalTextToBlocks } from '@/components/legal/legal-text-utils';
import type { SafetyStandardsLangContent, SafetyStandardsPageCMS } from '@/lib/types';

const SAFETY_STANDARDS_DOC_ID = 'safety-standards';

export function getDefaultSafetyStandardsCMS(): SafetyStandardsPageCMS {
  const toLangContent = (lang: LegalLang): SafetyStandardsLangContent => {
    const page = LEGAL_PAGES[lang]['safety-standards'];
    return {
      title: page.title,
      metaDescription: page.metaDescription,
      lastUpdated: page.lastUpdated,
      bodyText: legalBlocksToText(page.blocks),
    };
  };

  return {
    pl: toLangContent('pl'),
    en: toLangContent('en'),
    updatedAt: null,
  };
}

export function safetyStandardsCmsToLegalPages(cms: SafetyStandardsPageCMS): Record<LegalLang, LegalPageContent> {
  const toPage = (lang: LegalLang): LegalPageContent => {
    const entry = cms[lang];
    return {
      title: entry.title,
      metaDescription: entry.metaDescription,
      lastUpdated: entry.lastUpdated,
      blocks: legalTextToBlocks(entry.bodyText),
    };
  };

  return {
    pl: toPage('pl'),
    en: toPage('en'),
  };
}

export { SAFETY_STANDARDS_DOC_ID };
