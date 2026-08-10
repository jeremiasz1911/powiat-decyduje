'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { LANDING_SCREENSHOTS } from './landing-data';
import { Lightbox } from './Lightbox';
import { PhoneMockup } from './PhoneMockup';
import { SectionHeading, SectionShell } from './SectionShell';

const SWIPE_THRESHOLD = 40;

/**
 * Karuzela bez overflow-x-auto — pionowy scroll strony działa zawsze.
 * Przesuwanie: strzałki, swipe, drag myszką.
 */
export function ScreenshotsSection() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{
    active: boolean;
    moved: boolean;
    startX: number;
    lastX: number;
  }>({ active: false, moved: false, startX: 0, lastX: 0 });

  const shots = useMemo(() => LANDING_SCREENSHOTS, []);
  const maxIndex = Math.max(0, shots.length - 1);

  const goTo = (index: number) => {
    setActive(Math.max(0, Math.min(maxIndex, index)));
    setDragOffset(0);
  };

  const goPrev = () => goTo(active - 1);
  const goNext = () => goTo(active + 1);

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);
  const lightboxPrev = () =>
    setLightboxIndex((i) => (i === null ? i : (i + shots.length - 1) % shots.length));
  const lightboxNext = () => setLightboxIndex((i) => (i === null ? i : (i + 1) % shots.length));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const section = document.getElementById('screenshots');
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const inView = rect.top < window.innerHeight && rect.bottom > 0;
      if (!inView || lightboxIndex !== null) return;
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, lightboxIndex, maxIndex]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    dragRef.current = { active: true, moved: false, startX: e.clientX, lastX: e.clientX };
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active) return;
    const delta = e.clientX - dragRef.current.startX;
    if (Math.abs(delta) > 8) dragRef.current.moved = true;
    dragRef.current.lastX = e.clientX;
    setDragOffset(delta);
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active) return;
    const delta = e.clientX - dragRef.current.startX;
    dragRef.current.active = false;
    setIsDragging(false);
    setDragOffset(0);

    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }

    if (Math.abs(delta) >= SWIPE_THRESHOLD) {
      if (delta > 0) goPrev();
      else goNext();
    }
  };

  const slidePercent = 100 / shots.length;
  const trackStyle = {
    width: `${shots.length * 100}%`,
    transform: `translate3d(calc(-${active * slidePercent}% + ${dragOffset}px), 0, 0)`,
    transition: isDragging ? 'none' : 'transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)',
  };

  return (
    <SectionShell id="screenshots">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <SectionHeading
          eyebrow="Aplikacja w działaniu"
          title="Zobacz, jak to wygląda"
          description="Podgląd ekranów aplikacji — kliknij zdjęcie, aby otworzyć podgląd."
          align="left"
        />
        <div className="mb-4 flex shrink-0 gap-2 sm:mb-0">
          <button
            type="button"
            onClick={goPrev}
            disabled={active === 0}
            className="landing-carousel-nav"
            aria-label="Poprzedni screenshot">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={active === maxIndex}
            className="landing-carousel-nav"
            aria-label="Następny screenshot">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* overflow:hidden tylko clipuje — NIE przechwytuje wheel scrolla strony */}
      <div
        ref={trackRef}
        className="landing-screenshots-viewport relative touch-pan-y"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}>
        <div className="landing-screenshots-track flex" style={trackStyle}>
          {shots.map((shot, index) => (
            <div
              key={shot.id}
              className="landing-screenshot-slide flex shrink-0 justify-center px-2 sm:px-4"
              style={{ width: `${slidePercent}%` }}>
              <button
                type="button"
                className={`landing-screenshot-item text-left transition-transform duration-500 ${
                  index === active ? 'landing-screenshot-item-active' : 'landing-screenshot-item-dim'
                }`}
                aria-label={`Otwórz podgląd: ${shot.label}`}
                onClick={() => {
                  if (dragRef.current.moved) {
                    dragRef.current.moved = false;
                    return;
                  }
                  openLightbox(index);
                }}>
                <PhoneMockup
                  src={shot.src}
                  alt={shot.alt}
                  label={shot.label}
                  variant="gallery"
                  galleryIndex={index}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-center gap-2" role="tablist" aria-label="Screenshoty">
        {shots.map((shot, index) => (
          <button
            key={shot.id}
            type="button"
            role="tab"
            aria-selected={index === active}
            aria-label={shot.label}
            className={`landing-carousel-dot ${index === active ? 'is-active' : ''}`}
            onClick={() => goTo(index)}
          />
        ))}
      </div>

      <p className="mt-3 text-center text-xs text-white/35">
        {active + 1} / {shots.length} · przesuń w bok lub użyj strzałek
      </p>

      {lightboxIndex !== null ? (
        <Lightbox
          shots={shots}
          index={lightboxIndex}
          onClose={closeLightbox}
          onPrev={lightboxPrev}
          onNext={lightboxNext}
        />
      ) : null}
    </SectionShell>
  );
}
