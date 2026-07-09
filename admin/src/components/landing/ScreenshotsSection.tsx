'use client';

import { useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { LANDING_SCREENSHOTS } from './landing-data';
import { Lightbox } from './Lightbox';
import { PhoneMockup } from './PhoneMockup';
import { SectionHeading, SectionShell } from './SectionShell';

const TAP_MOVE_THRESHOLD = 14;

type TapState = {
  x: number;
  y: number;
  time: number;
};

function ScreenshotCard({
  index,
  shot,
  onOpen,
}: {
  index: number;
  shot: (typeof LANDING_SCREENSHOTS)[number];
  onOpen: (index: number) => void;
}) {
  const tapRef = useRef<TapState>({ x: 0, y: 0, time: 0 });

  const onTapStart = (clientX: number, clientY: number) => {
    tapRef.current = { x: clientX, y: clientY, time: Date.now() };
  };

  const onTapEnd = (clientX: number, clientY: number) => {
    const dx = Math.abs(clientX - tapRef.current.x);
    const dy = Math.abs(clientY - tapRef.current.y);
    const dt = Date.now() - tapRef.current.time;

    if (dx <= TAP_MOVE_THRESHOLD && dy <= TAP_MOVE_THRESHOLD && dt < 700) {
      onOpen(index);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      className="landing-screenshot-item shrink-0 snap-center text-left"
      aria-label={`Otwórz podgląd: ${shot.label}`}
      onPointerDown={(e) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        onTapStart(e.clientX, e.clientY);
      }}
      onPointerUp={(e) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        onTapEnd(e.clientX, e.clientY);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen(index);
        }
      }}>
      <PhoneMockup src={shot.src} alt={shot.alt} label={shot.label} variant="gallery" galleryIndex={index} />
    </div>
  );
}

export function ScreenshotsSection() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStateRef = useRef<{ active: boolean; startX: number; scrollLeft: number }>({
    active: false,
    startX: 0,
    scrollLeft: 0,
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

  const onScrollPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    if ((e.target as HTMLElement).closest('.landing-screenshot-item')) return;

    const el = scrollRef.current;
    if (!el) return;

    dragStateRef.current = {
      active: true,
      startX: e.clientX,
      scrollLeft: el.scrollLeft,
    };
    setIsDragging(true);
    el.setPointerCapture(e.pointerId);
  };

  const onScrollPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStateRef.current.active) return;

    const el = scrollRef.current;
    if (!el) return;

    const delta = e.clientX - dragStateRef.current.startX;
    el.scrollLeft = dragStateRef.current.scrollLeft - delta;
  };

  const endScrollDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStateRef.current.active) return;

    dragStateRef.current.active = false;
    setIsDragging(false);

    const el = scrollRef.current;
    if (el?.hasPointerCapture(e.pointerId)) {
      el.releasePointerCapture(e.pointerId);
    }
  };

  return (
    <SectionShell id="screenshots">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <SectionHeading
          eyebrow="Aplikacja w działaniu"
          title="Zobacz, jak to wygląda"
          description="Podgląd ekranów aplikacji — dotknij zdjęcia, aby otworzyć podgląd."
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
        onPointerDown={onScrollPointerDown}
        onPointerMove={onScrollPointerMove}
        onPointerUp={endScrollDrag}
        onPointerCancel={endScrollDrag}>
        {shots.map((shot, index) => (
          <ScreenshotCard key={shot.id} index={index} shot={shot} onOpen={openLightbox} />
        ))}
      </div>

      <p className="mt-4 text-center text-xs text-white/35 lg:hidden">Przesuń palcem w bok lub dotknij zdjęcia</p>

      {lightboxIndex !== null ? (
        <Lightbox shots={shots} index={lightboxIndex} onClose={closeLightbox} onPrev={goPrev} onNext={goNext} />
      ) : null}
    </SectionShell>
  );
}
