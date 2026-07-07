import Image from 'next/image';

import { SectionHeading, SectionShell } from './SectionShell';

export function AboutSection() {
  return (
    <SectionShell id="o-aplikacji">
      <div className="grid items-center gap-12 lg:grid-cols-[1fr_280px]">
        <div>
          <SectionHeading
            eyebrow="O aplikacji"
            title="Twój głos w lokalnych decyzjach"
            description="Powiat Decyduje to aplikacja wspierająca udział mieszkańców w życiu lokalnej społeczności. Dzięki niej można sprawdzać aktualne projekty, lokalizacje inicjatyw, procedury, głosowania oraz najważniejsze informacje w jednym miejscu."
          />
          <div className="space-y-4 text-base leading-relaxed text-white/65">
            <p>
              Aplikacja pomaga mieszkańcom brać udział w lokalnych decyzjach — od przeglądania inicjatyw na mapie,
              przez głosowanie, po zgłaszanie własnych pomysłów.
            </p>
            <p>
              Upraszcza kontakt mieszkańca z samorządem powiatowym i sprawia, że informacje o projektach są
              przejrzyste, aktualne i dostępne z telefonu.
            </p>
          </div>
        </div>
        <div className="landing-reveal landing-reveal-delay flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-sm">
          <Image
            src="/landing/logo-powiat.png"
            alt="Herb Powiatu Mławskiego"
            width={96}
            height={96}
            className="h-24 w-24 object-contain"
          />
          <p className="text-sm font-semibold text-white">Powiat Mławski</p>
          <p className="text-xs leading-relaxed text-white/50">
            Oficjalna aplikacja wspierająca dialog między mieszkańcami a samorządem.
          </p>
        </div>
      </div>
    </SectionShell>
  );
}
