'use client';

import Image from 'next/image';
import { useState } from 'react';

type PhoneMockupProps = {
  src: string;
  alt: string;
  label?: string;
  priority?: boolean;
  className?: string;
  variant?: 'default' | 'hero' | 'gallery';
  galleryIndex?: number;
};

export function PhoneMockup({
  src,
  alt,
  label,
  priority = false,
  className = '',
  variant = 'default',
  galleryIndex = 0,
}: PhoneMockupProps) {
  const [failed, setFailed] = useState(false);

  const variantClass =
    variant === 'hero'
      ? 'landing-phone-hero'
      : variant === 'gallery'
        ? `landing-phone-gallery landing-phone-gallery-${galleryIndex % 3}`
        : '';

  return (
    <div className={`landing-phone-wrap ${variantClass} ${className}`}>
      {variant !== 'default' ? <div className="landing-phone-glow" aria-hidden /> : null}
      <div className="landing-phone-device">
        <div className="landing-phone-notch" aria-hidden />
        <div className="landing-phone-screen">
          {!failed ? (
            <Image
              src={src}
              alt={alt}
              fill
              priority={priority}
              className="object-cover object-top"
              sizes="(max-width: 768px) 220px, 280px"
              onError={() => setFailed(true)}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-slate-800 via-slate-900 to-[#1a1020] px-4 text-center">
              <div className="h-10 w-10 rounded-full bg-brand/20 ring-1 ring-brand/30" />
              <p className="text-xs font-medium text-white/70">{label ?? 'Screenshot aplikacji'}</p>
              <p className="text-[10px] leading-relaxed text-white/40">Podmień obrazek w public/landing</p>
            </div>
          )}
        </div>
      </div>
      {label ? <p className="landing-phone-label">{label}</p> : null}
    </div>
  );
}
