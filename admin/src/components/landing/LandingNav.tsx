'use client';

import Image from 'next/image';
import { Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { LANDING_NAV } from './landing-data';

export function LandingNav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <nav
      className={`landing-nav fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? 'border-b border-white/10 bg-[#0a0f1a]/92 shadow-lg shadow-black/20 backdrop-blur-xl' : 'border-b border-white/5 bg-[#0a0f1a]/70 backdrop-blur-md'
      }`}>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5 sm:px-8 sm:py-4">
        <a href="#" className="flex min-w-0 items-center gap-3" onClick={() => setOpen(false)}>
          <Image
            src="/landing/logo-powiat.png"
            alt="Herb Powiatu Mławskiego"
            width={40}
            height={40}
            className="h-9 w-9 shrink-0 object-contain sm:h-10 sm:w-10"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">Powiat Decyduje</p>
            <p className="hidden text-[11px] text-white/50 sm:block">Powiat Mławski</p>
          </div>
        </a>

        <div className="hidden items-center gap-1 lg:flex">
          {LANDING_NAV.map((item) => (
            <a key={item.href} href={item.href} className="landing-nav-link rounded-lg px-3 py-2 text-sm">
              {item.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <a href="/#screenshots" className="landing-btn landing-btn-primary hidden px-4 py-2 text-sm sm:inline-flex">
            Zobacz aplikację
          </a>
          <button
            type="button"
            className="inline-flex rounded-xl border border-white/15 bg-white/5 p-2.5 text-white lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? 'Zamknij menu' : 'Otwórz menu'}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-white/10 bg-[#0a0f1a]/98 px-5 py-4 lg:hidden">
          <div className="flex flex-col gap-1">
            {LANDING_NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="landing-nav-link rounded-xl px-4 py-3 text-base"
                onClick={() => setOpen(false)}>
                {item.label}
              </a>
            ))}
            <a
              href="/#screenshots"
              className="landing-btn landing-btn-primary mt-2 justify-center"
              onClick={() => setOpen(false)}>
              Zobacz aplikację
            </a>
          </div>
        </div>
      ) : null}
    </nav>
  );
}
