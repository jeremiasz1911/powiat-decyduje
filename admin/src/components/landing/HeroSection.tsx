'use client';

import { ArrowDown } from 'lucide-react';
import { useMemo, useState } from 'react';

import { HERO_PHONE_SCREENSHOT } from './landing-data';
import { Lightbox } from './Lightbox';
import { PhoneMockup } from './PhoneMockup';
import { PlatformBadges } from './PlatformBadges';

export function HeroSection() {
  const [open, setOpen] = useState(false);
  const heroShots = useMemo(
    () => [
      {
        id: 'hero',
        src: HERO_PHONE_SCREENSHOT,
        label: 'Ekran startowy',
        alt: 'Podgląd aplikacji Powiat Decyduje — ekran startowy',
      },
    ],
    [],
  );

  return (
    <header className="landing-hero relative overflow-hidden pt-[calc(5.5rem+env(safe-area-inset-top,0px))] sm:pt-[calc(5rem+env(safe-area-inset-top,0px))] lg:min-h-[92vh] lg:pt-20">
      <div className="landing-hero-spotlight pointer-events-none absolute inset-0" aria-hidden />

      <div className="landing-hero-grid relative z-10 mx-auto flex max-w-6xl flex-col px-4 pb-12 pt-2 sm:px-8 sm:pb-20 lg:grid lg:min-h-[calc(92vh-5rem)] lg:grid-cols-2 lg:items-center lg:gap-16 lg:pb-28">
        {/* Tekst + pobieranie — na mobile na górze */}
        <div className="landing-hero-copy landing-reveal order-1 text-center lg:order-1 lg:text-left">
          <span className="landing-hero-pill inline-flex rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-medium text-brand">
            Aplikacja obywatelska · Powiat Mławski
          </span>

          <h1 className="landing-hero-title mt-4 text-[2rem] font-bold leading-[1.08] tracking-tight text-white sm:mt-5 sm:text-5xl lg:text-6xl">
            Powiat <span className="text-brand">Decyduje</span>
          </h1>

          <p className="landing-hero-lead mx-auto mt-3 max-w-md text-[0.95rem] leading-relaxed text-white/65 sm:mt-5 sm:max-w-xl sm:text-lg lg:mx-0 lg:text-xl">
            Zgłaszaj, przeglądaj i wspieraj lokalne inicjatywy — prosto z telefonu.
          </p>

          <div className="landing-reveal landing-reveal-delay mt-6 flex justify-center lg:mt-8 lg:justify-start">
            <PlatformBadges compact />
          </div>
        </div>

        {/* Telefon */}
        <div className="landing-hero-visual landing-reveal landing-reveal-delay order-2 mt-8 flex justify-center lg:order-2 lg:mt-0 lg:justify-end">
          <div className="landing-hero-phone-stage relative w-full max-w-[min(100%,200px)] sm:max-w-[260px] lg:max-w-none">
            <div className="landing-hero-orbit" aria-hidden />
            <button
              type="button"
              className="landing-hero-phone-tap relative z-[1] mx-auto flex w-full cursor-zoom-in justify-center"
              onClick={() => setOpen(true)}
              aria-label="Otwórz podgląd screenshotu aplikacji">
              <PhoneMockup
                src={HERO_PHONE_SCREENSHOT}
                alt="Podgląd aplikacji Powiat Decyduje"
                label="Ekran startowy"
                priority
                variant="hero"
                showLabel={false}
              />
            </button>
          </div>
        </div>
      </div>

      {open ? (
        <Lightbox shots={heroShots} index={0} onClose={() => setOpen(false)} onPrev={() => {}} onNext={() => {}} />
      ) : null}

      <a
        href="/#about"
        className="landing-hero-scroll-hint absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-1 text-white/35 transition hover:text-white/60"
        aria-label="Przewiń w dół">
        <span className="text-[11px] tracking-wide">Przewiń</span>
        <ArrowDown className="h-4 w-4 animate-bounce" />
      </a>
    </header>
  );
}
