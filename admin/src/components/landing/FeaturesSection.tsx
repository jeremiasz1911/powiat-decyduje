import { LANDING_FEATURES } from './landing-data';
import { SectionHeading, SectionShell } from './SectionShell';

export function FeaturesSection() {
  return (
    <SectionShell id="funkcje">
      <SectionHeading
        eyebrow="Funkcje"
        title="Wszystko, czego potrzebujesz jako mieszkaniec"
        description="Aplikacja łączy przeglądanie projektów, mapę, głosowanie i zgłaszanie inicjatyw w jednym, przejrzystym interfejsie."
        align="center"
      />
      <div className="grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
        {LANDING_FEATURES.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <article
              key={feature.title}
              className="landing-feature-card group bg-[#0d1320]/90 p-6 transition hover:bg-[#111827]"
              style={{ animationDelay: `${index * 60}ms` }}>
              <div className="mb-4 inline-flex rounded-lg border border-brand/20 bg-brand/10 p-2.5 text-brand transition group-hover:border-brand/40 group-hover:bg-brand/15">
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <h3 className="text-base font-semibold text-white">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/55">{feature.description}</p>
            </article>
          );
        })}
      </div>
    </SectionShell>
  );
}
