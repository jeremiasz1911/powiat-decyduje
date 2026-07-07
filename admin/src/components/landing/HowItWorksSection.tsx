import { HOW_IT_WORKS_STEPS } from './landing-data';
import { SectionHeading, SectionShell } from './SectionShell';

export function HowItWorksSection() {
  return (
    <SectionShell id="jak-to-dziala">
      <SectionHeading
        eyebrow="Jak to działa"
        title="Pięć prostych kroków"
        description="Od pierwszego spojrzenia na mapę po śledzenie własnego projektu — proces jest przejrzysty i przyjazny."
        align="center"
      />
      <ol className="relative space-y-0">
        {HOW_IT_WORKS_STEPS.map((item, index) => (
          <li key={item.step} className="landing-step relative flex gap-6 pb-10 last:pb-0">
            {index < HOW_IT_WORKS_STEPS.length - 1 ? (
              <span className="absolute left-5 top-12 h-[calc(100%-2rem)] w-px bg-gradient-to-b from-brand/50 to-white/10" />
            ) : null}
            <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-brand/40 bg-brand/15 text-sm font-bold text-brand">
              {item.step}
            </div>
            <div className="pt-1">
              <h3 className="text-lg font-semibold text-white">{item.title}</h3>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/60">{item.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </SectionShell>
  );
}
