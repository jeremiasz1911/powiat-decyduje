import { Sparkles } from 'lucide-react';

import { RESIDENT_BENEFITS } from './landing-data';
import { SectionHeading, SectionShell } from './SectionShell';

export function ResidentBenefitsSection() {
  return (
    <SectionShell id="dla-mieszkanca">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <SectionHeading
          eyebrow="Dla mieszkańca"
          title="Korzyści na co dzień"
          description="Aplikacja została zaprojektowana tak, by ułatwić codzienny kontakt z lokalnymi inicjatywami — bez zbędnych formalności i bez szukania informacji po wielu miejscach."
        />
        <ul className="space-y-4">
          {RESIDENT_BENEFITS.map((benefit) => (
            <li
              key={benefit}
              className="flex items-start gap-3 rounded-xl border border-white/8 bg-gradient-to-r from-white/[0.04] to-transparent px-5 py-4 transition hover:border-brand/20 hover:from-brand/5">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-brand" strokeWidth={1.75} />
              <span className="text-sm leading-relaxed text-white/75">{benefit}</span>
            </li>
          ))}
        </ul>
      </div>
    </SectionShell>
  );
}
