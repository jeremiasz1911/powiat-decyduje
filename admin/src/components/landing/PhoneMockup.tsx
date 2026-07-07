'use client';

import Image from 'next/image';
import { useState } from 'react';

type PhoneMockupProps = {
  src: string;
  alt: string;
  label?: string;
  priority?: boolean;
  className?: string;
  float?: boolean;
};

export function PhoneMockup({ src, alt, label, priority = false, className = '', float = false }: PhoneMockupProps) {
  const [failed, setFailed] = useState(false);

  return (
    <div
      className={`relative mx-auto w-[220px] sm:w-[240px] lg:w-[260px] ${float ? 'landing-float' : ''} ${className}`}>
      <div className="relative rounded-[2.2rem] border border-white/10 bg-gradient-to-b from-slate-800 to-slate-950 p-2 shadow-2xl shadow-black/40 ring-1 ring-white/5">
        <div className="absolute left-1/2 top-3 z-10 h-1.5 w-16 -translate-x-1/2 rounded-full bg-black/60" />
        <div className="relative aspect-[9/19.5] overflow-hidden rounded-[1.7rem] bg-slate-900">
          {!failed ? (
            <Image
              src={src}
              alt={alt}
              fill
              priority={priority}
              className="object-cover object-top"
              sizes="(max-width: 768px) 220px, 260px"
              onError={() => setFailed(true)}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-slate-800 via-slate-900 to-[#1a1020] px-4 text-center">
              <div className="h-10 w-10 rounded-full bg-brand/20 ring-1 ring-brand/30" />
              <p className="text-xs font-medium text-white/70">{label ?? 'Screenshot aplikacji'}</p>
              <p className="text-[10px] leading-relaxed text-white/40">
                {/* TODO: Dodaj plik {src} w admin/public/landing/ */}
                Podmień obrazek w public/landing
              </p>
            </div>
          )}
        </div>
      </div>
      {label ? (
        <p className="mt-3 text-center text-sm font-medium text-white/60">{label}</p>
      ) : null}
    </div>
  );
}
