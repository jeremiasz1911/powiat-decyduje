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
    <header className="landing-hero relative min-h-[92vh] overflow-hidden pt-24 sm:pt-20">
      <div className="landing-hero-spotlight pointer-events-none absolute inset-0" aria-hidden />

      <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-10 px-5 pb-20 pt-4 sm:px-8 lg:grid-cols-2 lg:gap-16 lg:pb-28">
        <div className="landing-reveal order-1">
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <BrandLogo height={48} priority />
            <span className="rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-medium text-brand">
              Aplikacja obywatelska
            </span>
          </div>
          <h1 className="text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
            Powiat <span className="text-brand">Decyduje</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/70 sm:text-xl">
            Aplikacja dla mieszkańców Powiatu Mławskiego do zgłaszania, przeglądania i wspierania lokalnych
            inicjatyw.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <a href="/#screenshots" className="landing-btn landing-btn-primary">
              Zobacz aplikację
            </a>
            <a href="/#about" className="landing-btn landing-btn-secondary">
              Dowiedz się więcej
            </a>
            <a href="/#features" className="landing-btn landing-btn-ghost">
              Funkcjonalności
            </a>
          </div>
          <PlatformBadges />
        </div>

        <div className="landing-reveal landing-reveal-delay order-2 flex justify-center overflow-visible lg:justify-end">
          <div className="landing-hero-phone-stage">
            <button
              type="button"
              className="inline-flex cursor-zoom-in"
              onClick={() => setOpen(true)}
              aria-label="Otwórz podgląd screenshotu z hero">
              <PhoneMockup
                src={HERO_PHONE_SCREENSHOT}
                alt="Podgląd aplikacji Powiat Decyduje"
                label="Ekran startowy"
                priority
                variant="hero"
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
        className="absolute bottom-8 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-1 text-white/40 transition hover:text-white/70 sm:flex"
        aria-label="Przewiń w dół">
        <span className="text-xs">Więcej</span>
        <ArrowDown className="h-4 w-4 animate-bounce" />
      </a>
    </header>
  );
}
