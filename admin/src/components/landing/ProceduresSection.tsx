import { CheckCircle2 } from 'lucide-react';

import { PROCEDURE_ITEMS } from './landing-data';
import { SectionHeading, SectionShell } from './SectionShell';

export function ProceduresSection() {
  return (
    <SectionShell id="procedures">
      <SectionHeading
        eyebrow="Procedury"
        title="Prosto o formalnościach"
        description="Aplikacja nie zastępuje przepisów — ale pomaga się w nich odnaleźć. Każdy etap jest czytelny i zrozumiały dla mieszkańca."
      />
      <ul className="grid gap-4 sm:grid-cols-2">
        {PROCEDURE_ITEMS.map((item) => (
          <li
            key={item.title}
            className="flex gap-4 rounded-xl border border-white/8 bg-white/[0.03] p-5 transition hover:border-white/15 hover:bg-white/[0.05]">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand" strokeWidth={1.75} />
            <div>
              <h3 className="font-semibold text-white">{item.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-white/60">{item.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </SectionShell>
  );
}
