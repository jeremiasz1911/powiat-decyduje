import { APP_LINKS } from './landing-data';

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
      <path d="M16.365 1.43c0 1.14-.42 2.09-1.24 2.86-.9.84-2.02 1.25-3.28 1.18-.14-1.1.4-2.2 1.18-2.94.88-.82 2.2-1.28 3.34-1.1zM20.74 17.09c-.58 1.34-.86 1.94-1.61 3.13-1.04 1.62-2.51 3.64-4.33 3.66-1.62.02-2.04-1.05-4.24-1.05-2.2 0-2.66 1.07-4.28 1.07-1.8 0-3.17-1.72-4.21-3.34-2.88-4.5-3.18-9.78-1.4-12.6 1.26-2.02 3.25-3.2 5.12-3.2 1.9 0 3.1 1.07 4.67 1.07 1.52 0 2.45-1.07 4.63-1.07 1.65 0 3.4.9 4.66 2.46-4.1 2.24-3.43 8.07.98 9.87z" />
    </svg>
  );
}

function AndroidIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
      <path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85a.637.637 0 0 0-.86.26l-1.86 3.22a7.77 7.77 0 0 0-7.32 0L7.18 5.71a.643.643 0 0 0-.87-.26c-.3.16-.42.54-.26.85l1.84 3.18C4.86 11.5 3.5 14.13 3.5 17h17c0-2.87-1.36-5.5-3.9-7.52zM8.5 15.25a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5zm7 0a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5z" />
    </svg>
  );
}

export function PlatformBadges() {
  return (
    <div className="mt-8 flex flex-col gap-3">
      <p className="text-xs font-medium uppercase tracking-wider text-white/45">Dostępne na</p>
      <div className="flex flex-wrap gap-3">
        <a
          href={APP_LINKS.appStore}
          className="landing-platform-badge group"
          aria-label="Dostępne na iOS — App Store">
          <AppleIcon />
          <span>iOS</span>
        </a>
        <a
          href={APP_LINKS.googlePlay}
          className="landing-platform-badge group"
          aria-label="Dostępne na Android — Google Play">
          <AndroidIcon />
          <span>Android</span>
        </a>
      </div>
      {/* TODO: Uzupełnij linki App Store / Google Play w landing-data.ts */}
    </div>
  );
}
