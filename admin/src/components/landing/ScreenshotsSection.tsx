'use client';

import { useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { LANDING_SCREENSHOTS } from './landing-data';
import { Lightbox } from './Lightbox';
import { PhoneMockup } from './PhoneMockup';
import { SectionHeading, SectionShell } from './SectionShell';

export function ScreenshotsSection() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStateRef = useRef<{ active: boolean; startX: number; scrollLeft: number; moved: boolean }>({
    active: false,
    startX: 0,
    scrollLeft: 0,
    moved: false,
  });

  const shots = useMemo(() => LANDING_SCREENSHOTS, []);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = direction === 'left' ? -el.clientWidth * 0.7 : el.clientWidth * 0.7;
    el.scrollBy({ left: amount, behavior: 'smooth' });
  };

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);
  const goPrev = () => setLightboxIndex((i) => (i === null ? i : (i + shots.length - 1) % shots.length));
  const goNext = () => setLightboxIndex((i) => (i === null ? i : (i + 1) % shots.length));

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Na dotyku zostaw natywny scroll — custom drag blokuje tap i lightbox.
    if (e.pointerType !== 'mouse') return;
    const el = scrollRef.current;
    if (!el) return;
    dragStateRef.current.active = true;
    dragStateRef.current.startX = e.clientX;
    dragStateRef.current.scrollLeft = el.scrollLeft;
    dragStateRef.current.moved = false;
    setIsDragging(true);
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') return;
    const el = scrollRef.current;
    const state = dragStateRef.current;
    if (!el || !state.active) return;
    const delta = e.clientX - state.startX;
    if (Math.abs(delta) > 10) state.moved = true;
    el.scrollLeft = state.scrollLeft - delta;
  };

  const endDrag = () => {
    dragStateRef.current.active = false;
    setIsDragging(false);
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
        className={`landing-screenshots-scroll landing-drag-scroll flex snap-x snap-mandatory gap-6 overflow-x-auto pb-4 pt-2 sm:gap-8 ${
          isDragging ? 'is-dragging' : ''
        }`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={endDrag}>
        {shots.map((shot, index) => (
          <button
            key={shot.id}
            type="button"
            className="landing-screenshot-item shrink-0 snap-center text-left"
            onClick={() => {
              // If user dragged, don't treat as click.
              if (dragStateRef.current.moved) return;
              openLightbox(index);
            }}
            aria-label={`Otwórz podgląd: ${shot.label}`}>
            <PhoneMockup src={shot.src} alt={shot.alt} label={shot.label} variant="gallery" galleryIndex={index} />
          </button>
        ))}
      </div>
      <p className="mt-6 text-center text-xs text-white/35">
        {/* TODO: Dodaj pliki screenshot-*.png w admin/public/landing/ */}
        Oczekiwane pliki: screenshot-start.png, screenshot-mapa.png, screenshot-projekty.png, screenshot-szczegoly.png,
        screenshot-profil.png
      </p>

      {lightboxIndex !== null ? (
        <Lightbox shots={shots} index={lightboxIndex} onClose={closeLightbox} onPrev={goPrev} onNext={goNext} />
      ) : null}
    </SectionShell>
  );
}
