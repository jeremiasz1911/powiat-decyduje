'use client';

import Image from 'next/image';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import type { LandingScreenshot } from './landing-data';

type LightboxProps = {
  shots: LandingScreenshot[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
};

const SWIPE_THRESHOLD = 40;

export function Lightbox({ shots, index, onClose, onPrev, onNext }: LightboxProps) {
  const shot = shots[index];
  const hasNav = shots.length > 1;
  const [mounted, setMounted] = useState(false);
  const touchRef = useRef<{ startX: number; startY: number; active: boolean }>({
    startX: 0,
    startY: 0,
    active: false,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    const prevBodyPaddingRight = body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
      body.style.paddingRight = prevBodyPaddingRight;
    };
  }, []);

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

  const onTouchStart = (e: React.TouchEvent) => {
    if (!hasNav || e.touches.length !== 1) return;
    touchRef.current = {
      active: true,
      startX: e.touches[0].clientX,
      startY: e.touches[0].clientY,
    };
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!hasNav || !touchRef.current.active) return;
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchRef.current.startX;
    const deltaY = touch.clientY - touchRef.current.startY;
    touchRef.current.active = false;

    if (Math.abs(deltaX) < SWIPE_THRESHOLD || Math.abs(deltaX) < Math.abs(deltaY)) return;
    if (deltaX > 0) onPrev();
    else onNext();
  };

  if (!mounted) return null;

  return createPortal(
    <div className="landing-lightbox" role="dialog" aria-modal="true" aria-label="Podgląd screenshotu">
      <button type="button" className="landing-lightbox-backdrop" onClick={onClose} aria-label="Zamknij podgląd" />

      <div
        className="landing-lightbox-panel"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onTouchCancel={() => {
          touchRef.current.active = false;
        }}>
        <header className="landing-lightbox-top">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white sm:text-base">{shot.label}</p>
            {hasNav ? (
              <p className="mt-0.5 text-xs text-white/45">
                {index + 1} / {shots.length}
              </p>
            ) : (
              <p className="mt-0.5 text-xs text-white/45 lg:hidden">Przesuń palcem lub dotknij tła, aby zamknąć</p>
            )}
          </div>
          <button type="button" className="landing-lightbox-close" onClick={onClose} aria-label="Zamknij">
            <X className="h-6 w-6" />
          </button>
        </header>

        <div className="landing-lightbox-body">
          {hasNav ? (
            <button
              type="button"
              className="landing-lightbox-nav landing-lightbox-nav-side"
              onClick={onPrev}
              aria-label="Poprzedni">
              <ChevronLeft className="h-6 w-6" />
            </button>
          ) : null}

          <div className="landing-lightbox-imageWrap">
            <div className="landing-lightbox-frame">
              <Image
                src={shot.src}
                alt={shot.alt}
                fill
                className="object-contain object-center"
                sizes="(max-width: 640px) 100vw, 420px"
                priority
              />
            </div>
          </div>

          {hasNav ? (
            <button
              type="button"
              className="landing-lightbox-nav landing-lightbox-nav-side"
              onClick={onNext}
              aria-label="Następny">
              <ChevronRight className="h-6 w-6" />
            </button>
          ) : null}
        </div>

        {hasNav ? (
          <footer className="landing-lightbox-bottom">
            <button type="button" className="landing-lightbox-nav landing-lightbox-nav-wide" onClick={onPrev}>
              <ChevronLeft className="h-5 w-5 shrink-0" />
              <span>Poprzedni</span>
            </button>
            <button type="button" className="landing-lightbox-nav landing-lightbox-nav-wide" onClick={onNext}>
              <span>Następny</span>
              <ChevronRight className="h-5 w-5 shrink-0" />
            </button>
          </footer>
        ) : (
          <footer className="landing-lightbox-bottom landing-lightbox-bottom-single">
            <button type="button" className="landing-lightbox-nav landing-lightbox-nav-wide" onClick={onClose}>
              Zamknij podgląd
            </button>
          </footer>
        )}
      </div>
    </div>,
    document.body,
  );
}
