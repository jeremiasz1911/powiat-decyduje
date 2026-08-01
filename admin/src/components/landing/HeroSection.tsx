'use client';

import { ArrowDown } from 'lucide-react';
import { useMemo, useState } from 'react';

import { BrandLogo } from './BrandLogo';
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
    <header className="landing-hero relative overflow-hidden pt-[calc(4.25rem+env(safe-area-inset-top,0px))] lg:min-h-[92vh] lg:pt-20">
      <div className="landing-hero-spotlight pointer-events-none absolute inset-0" aria-hidden />

      <div className="landing-hero-grid relative z-10 mx-auto max-w-6xl px-4 pb-10 pt-1 sm:px-8 sm:pb-20 lg:grid lg:grid-cols-2 lg:items-center lg:gap-16 lg:pb-28">
        {/* Mobile: screenshot pierwszy */}
        <div className="landing-hero-visual order-1 flex justify-center lg:order-2 lg:justify-end">
          <div className="landing-hero-phone-stage w-full max-w-[min(100%,220px)] sm:max-w-[260px] lg:max-w-none">
            <button
              type="button"
              className="landing-hero-phone-tap mx-auto flex w-full cursor-zoom-in justify-center"
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

        {/* Mobile: treść pod screenshotem */}
        <div className="landing-hero-copy order-2 mt-4 text-center lg:order-1 lg:mt-0 lg:text-left">
          <div className="flex flex-col items-center gap-3 lg:items-start lg:gap-4">
            <BrandLogo height={44} priority className="lg:hidden" />
            <span className="rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-medium text-brand">
              Aplikacja obywatelska · Powiat Mławski
            </span>
          </div>

          <h1 className="mt-4 text-[1.85rem] font-bold leading-[1.1] tracking-tight text-white sm:mt-5 sm:text-5xl lg:mt-4 lg:text-6xl">
            Powiat <span className="text-brand">Decyduje</span>
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-[0.95rem] leading-relaxed text-white/70 sm:mt-6 sm:text-lg lg:mx-0 lg:text-xl">
            Aplikacja dla mieszkańców Powiatu Mławskiego do zgłaszania, przeglądania i wspierania lokalnych
            inicjatyw.
          </p>

          <div className="landing-hero-actions mt-6 flex flex-col gap-2.5 sm:mt-10 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-3 lg:justify-start">
            <a href="/#screenshots" className="landing-btn landing-btn-primary w-full sm:w-auto">
              Zobacz aplikację
            </a>
            <a href="/#about" className="landing-btn landing-btn-secondary w-full sm:w-auto">
              Dowiedz się więcej
            </a>
            <a href="/#features" className="landing-btn landing-btn-ghost w-full sm:w-auto">
              Funkcjonalności
            </a>
          </div>

          <div className="flex justify-center lg:justify-start">
            <PlatformBadges />
          </div>
        </div>
      </div>

      {open ? (
        <Lightbox shots={heroShots} index={0} onClose={() => setOpen(false)} onPrev={() => {}} onNext={() => {}} />
      ) : null}

      <a
        href="/#about"
        className="absolute bottom-6 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-1 text-white/40 transition hover:text-white/70 lg:flex"
        aria-label="Przewiń w dół">
        <span className="text-xs">Więcej</span>
        <ArrowDown className="h-4 w-4 animate-bounce" />
      </a>
    </header>
  );
}
