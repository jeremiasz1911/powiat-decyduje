'use client';

import Link from 'next/link';
import { useState } from 'react';

import { AnimatedBackground } from '@/components/landing/AnimatedBackground';
import { Footer } from '@/components/landing/Footer';
import { LandingNav } from '@/components/landing/LandingNav';

import {
  LEGAL_PAGES,
  type LegalBlock,
  type LegalLang,
  type LegalPageContent,
  type LegalPageId,
} from './legal-content';

type LegalPageViewProps = {
  pageId: LegalPageId;
  /** Treść z CMS (np. Firestore) — nadpisuje domyślny fallback z kodu. */
  cmsContent?: Record<LegalLang, LegalPageContent>;
  eyebrowPl?: string;
  eyebrowEn?: string;
};

function renderText(text: string) {
  if (text.includes('TODO:')) {
    return <span className="legal-todo">{text}</span>;
  }
  return text;
}

function LegalBlockRenderer({ block }: { block: LegalBlock }) {
  if (block.type === 'h2') {
    return <h2 className="legal-h2">{block.text}</h2>;
  }
  if (block.type === 'p') {
    return <p className="legal-p">{renderText(block.text)}</p>;
  }
  if (block.type === 'ul') {
    return (
      <ul className="legal-ul">
        {block.items.map((item) => (
          <li key={item}>{renderText(item)}</li>
        ))}
      </ul>
    );
  }
  const isExternal = block.href.startsWith('http') || block.href.startsWith('mailto:');
  return (
    <p className="legal-p">
      {block.before}
      {isExternal ? (
        <a href={block.href} className="legal-link">
          {block.label}
        </a>
      ) : (
        <Link href={block.href} className="legal-link">
          {block.label}
        </Link>
      )}
      {block.after}
    </p>
  );
}

export function LegalPageView({
  pageId,
  cmsContent,
  eyebrowPl = 'Dokument prawny',
  eyebrowEn = 'Legal document',
}: LegalPageViewProps) {
  const [lang, setLang] = useState<LegalLang>('pl');
  const content = cmsContent?.[lang] ?? LEGAL_PAGES[lang][pageId];

  return (
    <div className="landing-page legal-page relative min-h-screen overflow-x-hidden bg-[#080d18] text-white">
      <AnimatedBackground />
      <LandingNav />
      <main className="relative z-10 px-5 pb-20 pt-28 sm:px-8">
        <article className="legal-article mx-auto max-w-3xl">
          <div className="mb-10 flex flex-col gap-4 border-b border-white/10 pb-8 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
                {lang === 'pl' ? eyebrowPl : eyebrowEn}
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">{content.title}</h1>
            </div>
            <div className="legal-lang-toggle" role="group" aria-label="Language">
              <button
                type="button"
                className={lang === 'pl' ? 'legal-lang-btn legal-lang-btn-active' : 'legal-lang-btn'}
                onClick={() => setLang('pl')}>
                PL
              </button>
              <button
                type="button"
                className={lang === 'en' ? 'legal-lang-btn legal-lang-btn-active' : 'legal-lang-btn'}
                onClick={() => setLang('en')}>
                EN
              </button>
            </div>
          </div>

          <div className="legal-body">
            {content.blocks.map((block, index) => (
              <LegalBlockRenderer key={`${lang}-${index}`} block={block} />
            ))}
          </div>

          <p className="legal-disclaimer mt-12 border-t border-white/10 pt-8 text-xs leading-relaxed text-white/40">
            {lang === 'pl'
              ? 'Treści prawne są szablonem i powinny zostać zweryfikowane przez administratora danych lub prawnika przed publikacją.'
              : 'Legal content is a template and should be reviewed by the data controller or legal counsel before publication.'}
          </p>
        </article>
      </main>
      <Footer />
    </div>
  );
}
