'use client';

import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect } from 'react';

import type { LandingScreenshot } from './landing-data';

type LightboxProps = {
  shots: LandingScreenshot[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
};

export function Lightbox({ shots, index, onClose, onPrev, onNext }: LightboxProps) {
  const shot = shots[index];
  const hasNav = shots.length > 1;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (!hasNav) return;
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [hasNav, onClose, onNext, onPrev]);

  return (
    <div className="landing-lightbox" role="dialog" aria-modal="true" aria-label="Podgląd screenshotu">
      <button type="button" className="landing-lightbox-backdrop" onClick={onClose} aria-label="Zamknij" />
      <div className="landing-lightbox-panel">
        <div className="landing-lightbox-top">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{shot.label}</p>
            <p className="text-xs text-white/45">{shot.alt}</p>
          </div>
          <button type="button" className="landing-lightbox-close" onClick={onClose}>
            Zamknij
          </button>
        </div>

        <div className="landing-lightbox-content">
          <button
            type="button"
            className="landing-lightbox-nav"
            onClick={onPrev}
            aria-label="Poprzedni"
            disabled={!hasNav}>
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="landing-lightbox-imageWrap">
            <div className="relative aspect-[9/19.5] w-[min(86vw,420px)] overflow-hidden rounded-2xl border border-white/10 bg-black/20">
              <Image src={shot.src} alt={shot.alt} fill className="object-cover object-top" sizes="420px" />
            </div>
          </div>
          <button
            type="button"
            className="landing-lightbox-nav"
            onClick={onNext}
            aria-label="Następny"
            disabled={!hasNav}>
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

