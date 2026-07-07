import Image from 'next/image';
import Link from 'next/link';

import { LANDING_NAV } from './landing-data';

export function Footer() {
  return (
    <footer className="relative border-t border-white/10 bg-[#060a12]/80">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[1fr_auto] lg:items-start">
        <div>
          <div className="flex items-center gap-4">
            <Image
              src="/landing/logo-powiat.png"
              alt="Herb Powiatu Mławskiego"
              width={48}
              height={48}
              className="h-12 w-12 object-contain"
            />
            <div>
              <p className="text-lg font-semibold text-white">Powiat Decyduje</p>
              <p className="text-sm text-white/50">Powiat Mławski</p>
            </div>
          </div>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-white/50">
            Aplikacja wspierająca udział mieszkańców w lokalnych decyzjach.
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-8 gap-y-3">
          {LANDING_NAV.map((item) => (
            <a key={item.href} href={item.href} className="text-sm text-white/60 transition hover:text-white">
              {item.label}
            </a>
          ))}
          <Link href="/login" className="text-sm text-white/60 transition hover:text-white">
            Panel administratora
          </Link>
        </nav>
      </div>
      <div className="border-t border-white/5 px-5 py-6 text-center text-xs text-white/35 sm:px-8">
        © {new Date().getFullYear()} Powiat Mławski · Powiat Decyduje
      </div>
    </footer>
  );
}
