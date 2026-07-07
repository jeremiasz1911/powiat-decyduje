'use client';

import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { LANDING_SCREENSHOTS } from './landing-data';
import { PhoneMockup } from './PhoneMockup';
import { SectionHeading, SectionShell } from './SectionShell';

export function ScreenshotsSection() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = direction === 'left' ? -el.clientWidth * 0.7 : el.clientWidth * 0.7;
    el.scrollBy({ left: amount, behavior: 'smooth' });
  };

  return (
    <SectionShell id="screenshots">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <SectionHeading
          eyebrow="Aplikacja w działaniu"
          title="Zobacz, jak to wygląda"
          description="Podgląd ekranów aplikacji — podmień placeholdery na prawdziwe screenshoty w folderze public/landing."
          align="left"
        />
        <div className="mb-12 flex shrink-0 gap-2 sm:mb-0">
          <button
            type="button"
            onClick={() => scroll('left')}
            className="rounded-xl border border-white/15 bg-white/5 p-2.5 text-white transition hover:bg-white/10"
            aria-label="Poprzedni screenshot">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => scroll('right')}
            className="rounded-xl border border-white/15 bg-white/5 p-2.5 text-white transition hover:bg-white/10"
            aria-label="Następny screenshot">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="landing-screenshots-scroll flex snap-x snap-mandatory gap-8 overflow-x-auto pb-4 pt-2">
        {LANDING_SCREENSHOTS.map((shot, index) => (
          <div
            key={shot.id}
            className="landing-screenshot-item shrink-0 snap-center"
            style={{ animationDelay: `${index * 100}ms` }}>
            <PhoneMockup src={shot.src} alt={shot.alt} label={shot.label} />
          </div>
        ))}
      </div>
      <p className="mt-6 text-center text-xs text-white/35">
        {/* TODO: Dodaj pliki screenshot-*.png w admin/public/landing/ */}
        Oczekiwane pliki: screenshot-start.png, screenshot-mapa.png, screenshot-projekty.png, screenshot-szczegoly.png,
        screenshot-profil.png
      </p>
    </SectionShell>
  );
}
