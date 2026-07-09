import Image from 'next/image';

type BrandLogoProps = {
  className?: string;
  /** Wysokość logo — szerokość dopasowuje się automatycznie */
  height?: number;
  priority?: boolean;
};

/** Logo aplikacji — wersja jasna (biała) na ciemnym tle landingu. */
export function BrandLogo({ className = '', height = 48, priority = false }: BrandLogoProps) {
  const width = Math.round(height * 2.4);

  return (
    <Image
      src="/landing/logo-app.png"
      alt="Powiat Decyduje"
      width={width}
      height={height}
      priority={priority}
      className={`object-contain brightness-0 invert ${className}`}
      style={{ width, height }}
    />
  );
}
