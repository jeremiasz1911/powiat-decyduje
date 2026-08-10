import Image from 'next/image';

import { APP_LINKS } from './landing-data';

type PlatformBadgesProps = {
  compact?: boolean;
};

export function PlatformBadges({ compact = false }: PlatformBadgesProps) {
  return (
    <div className={`landing-platform-badges w-full ${compact ? '' : 'mt-6 sm:mt-8'}`}>
      <p
        className={`font-semibold tracking-tight text-white ${
          compact ? 'text-sm sm:text-base' : 'text-base sm:text-lg'
        } text-center lg:text-left`}>
        Pobierz aplikację Powiat Decyduje
      </p>
      <p
        className={`mt-1 font-medium uppercase tracking-[0.16em] text-white/40 ${
          compact ? 'text-[10px]' : 'text-[11px]'
        } text-center lg:text-left`}>
        App Store · Google Play
      </p>
      <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center lg:justify-start">
        <a
          href={APP_LINKS.appStore}
          className="landing-store-badge landing-store-badge-animate"
          style={{ animationDelay: '0.05s' }}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Pobierz aplikację Powiat Decyduje w App Store">
          <Image
            src="/landing/appstore_badge.png"
            alt="Pobierz w App Store"
            width={160}
            height={48}
            className="h-12 w-auto sm:h-[3.15rem]"
            priority
          />
        </a>
        <a
          href={APP_LINKS.googlePlay}
          className="landing-store-badge landing-store-badge-animate"
          style={{ animationDelay: '0.18s' }}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Pobierz aplikację Powiat Decyduje w Google Play">
          <Image
            src="/landing/google_badge.png"
            alt="Pobierz z Google Play"
            width={160}
            height={48}
            className="h-12 w-auto sm:h-[3.15rem]"
            priority
          />
        </a>
      </div>
    </div>
  );
}
