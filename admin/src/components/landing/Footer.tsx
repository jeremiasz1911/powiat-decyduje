import Image from 'next/image';
import Link from 'next/link';

import { APP_LINKS, LANDING_NAV } from './landing-data';
import { BrandLogo } from './BrandLogo';

const FOOTER_LEGAL = [
  { href: '/privacy', label: 'Polityka prywatności' },
  { href: '/terms', label: 'Regulamin' },
  { href: '/cookies', label: 'Polityka cookies' },
  { href: '/#contact', label: 'Kontakt' },
];

const FOOTER_MORE = [
  { href: '/support', label: 'Wsparcie' },
  { href: '/account-deletion', label: 'Usuwanie konta' },
  { href: '/standardy', label: 'Standardy bezpieczeństwa' },
];

export function Footer() {
  return (
    <footer className="relative border-t border-white/10 bg-[#060a12]/80">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[1.2fr_auto_auto] lg:items-start">
        <div>
          <div className="flex items-center gap-4">
            <BrandLogo height={48} />
            <Image
              src="/landing/logo-powiat.png"
              alt="Herb Powiatu Mławskiego"
              width={48}
              height={48}
              className="hidden h-12 w-12 object-contain sm:block"
            />
            <div>
              <p className="text-lg font-semibold text-white">Powiat Decyduje</p>
              <p className="text-sm text-white/50">Powiat Mławski</p>
            </div>
          </div>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-white/50">
            Aplikacja wspierająca udział mieszkańców w lokalnych decyzjach.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href={APP_LINKS.appStore}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-white/55 transition hover:text-white">
              App Store
            </a>
            <span className="text-white/20">·</span>
            <a
              href={APP_LINKS.googlePlay}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-white/55 transition hover:text-white">
              Google Play
            </a>
          </div>
        </div>

        <nav className="flex flex-col gap-2" aria-label="Nawigacja">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-white/35">Nawigacja</p>
          {LANDING_NAV.map((item) => (
            <a key={item.href} href={item.href} className="text-sm text-white/60 transition hover:text-white">
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex flex-col gap-8 sm:flex-row sm:gap-12 lg:flex-col lg:gap-8">
          <nav className="flex flex-col gap-2" aria-label="Informacje prawne">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-white/35">Informacje prawne</p>
            {FOOTER_LEGAL.map((item) => (
              <Link key={item.href} href={item.href} className="text-sm text-white/60 transition hover:text-white">
                {item.label}
              </Link>
            ))}
          </nav>
          <nav className="flex flex-col gap-2" aria-label="Więcej">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-white/35">Więcej</p>
            {FOOTER_MORE.map((item) => (
              <Link key={item.href} href={item.href} className="text-sm text-white/60 transition hover:text-white">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      <div className="border-t border-white/5 px-5 py-6 text-center text-xs text-white/35 sm:px-8">
        <div>© {new Date().getFullYear()} Jeremiasz Wiśniewski · Powiat Decyduje</div>
        <div className="mt-1">Aplikacja wspierająca udział mieszkańców Powiatu Mławskiego w lokalnych decyzjach.</div>
      </div>
    </footer>
  );
}
