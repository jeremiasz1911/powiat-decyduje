import Image from 'next/image';
import Link from 'next/link';
import { ArrowDown, Smartphone } from 'lucide-react';

import { APP_LINKS, HERO_PHONE_SCREENSHOT, LANDING_NAV } from './landing-data';
import { PhoneMockup } from './PhoneMockup';

export function HeroSection() {
  return (
    <header className="relative min-h-[90vh] overflow-hidden pt-24">
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-[#0a0f1a]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <a href="#" className="flex items-center gap-3">
            <Image
              src="/landing/logo-powiat.png"
              alt="Herb Powiatu Mławskiego"
              width={40}
              height={40}
              className="h-10 w-10 object-contain"
            />
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-white">Powiat Decyduje</p>
              <p className="text-[11px] text-white/50">Powiat Mławski</p>
            </div>
          </a>
          <div className="hidden items-center gap-6 md:flex">
            {LANDING_NAV.map((item) => (
              <a key={item.href} href={item.href} className="text-sm text-white/70 transition hover:text-white">
                {item.label}
              </a>
            ))}
          </div>
          <Link
            href="/login"
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:border-white/25 hover:bg-white/10">
            Panel administratora
          </Link>
        </div>
      </nav>

      <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-8 sm:px-8 lg:grid-cols-2 lg:gap-16 lg:pb-28">
        <div className="landing-reveal order-1">
          <div className="mb-6 flex items-center gap-3">
            <Image
              src="/landing/logo-app.png"
              alt="Logo Powiat Decyduje"
              width={48}
              height={48}
              className="h-12 w-12 object-contain"
            />
            <span className="rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-medium text-brand">
              Aplikacja obywatelska
            </span>
          </div>
          <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl">
            Powiat Decyduje
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/70 sm:text-xl">
            Aplikacja dla mieszkańców Powiatu Mławskiego do zgłaszania, przeglądania i wspierania lokalnych
            inicjatyw.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <a href="#funkcje" className="landing-btn landing-btn-primary">
              Zobacz projekty
            </a>
            <a href="#o-aplikacji" className="landing-btn landing-btn-secondary">
              Dowiedz się więcej
            </a>
            <a href={APP_LINKS.openApp} className="landing-btn landing-btn-ghost">
              <Smartphone className="h-4 w-4" />
              Pobierz aplikację
            </a>
          </div>
          <p className="mt-4 text-xs text-white/40">
            {/* TODO: Uzupełnij linki do App Store / Google Play w landing-data.ts */}
            Link do sklepu z aplikacją — do uzupełnienia
          </p>
        </div>

        <div className="landing-reveal landing-reveal-delay order-2 flex justify-center lg:justify-end">
          <PhoneMockup
            src={HERO_PHONE_SCREENSHOT}
            alt="Podgląd aplikacji Powiat Decyduje"
            label="Ekran startowy"
            priority
            float
          />
        </div>
      </div>

      <a
        href="#o-aplikacji"
        className="absolute bottom-8 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-1 text-white/40 transition hover:text-white/70 sm:flex"
        aria-label="Przewiń w dół">
        <span className="text-xs">Więcej</span>
        <ArrowDown className="h-4 w-4 animate-bounce" />
      </a>
    </header>
  );
}
