'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

import { FAQ_ITEMS } from './landing-data';
import { SectionHeading, SectionShell } from './SectionShell';

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <SectionShell id="faq" narrow>
      <SectionHeading eyebrow="FAQ" title="Najczęstsze pytania" align="center" />
      <div className="divide-y divide-white/10 rounded-2xl border border-white/10 bg-white/[0.03]">
        {FAQ_ITEMS.map((item, index) => {
          const isOpen = openIndex === index;
          return (
            <div key={item.question}>
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition hover:bg-white/[0.03]"
                aria-expanded={isOpen}>
                <span className="font-medium text-white">{item.question}</span>
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-white/50 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}>
                <p className="px-6 pb-5 text-sm leading-relaxed text-white/60">{item.answer}</p>
              </div>
            </div>
          );
        })}
      </div>
    </SectionShell>
  );
}
