import type { ReactNode } from 'react';

import { ScrollReveal } from './ScrollReveal';

type SectionShellProps = {
  id?: string;
  children: ReactNode;
  className?: string;
  narrow?: boolean;
};

export function SectionShell({ id, children, className = '', narrow = false }: SectionShellProps) {
  return (
    <section id={id} className={`relative scroll-mt-28 px-5 py-20 sm:px-8 lg:py-28 ${className}`}>
      <ScrollReveal>
        <div className={`relative z-10 mx-auto ${narrow ? 'max-w-3xl' : 'max-w-6xl'}`}>{children}</div>
      </ScrollReveal>
    </section>
  );
}

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
};

export function SectionHeading({ eyebrow, title, description, align = 'left' }: SectionHeadingProps) {
  const alignClass = align === 'center' ? 'text-center mx-auto' : '';

  return (
    <div className={`mb-12 max-w-2xl ${alignClass}`}>
      {eyebrow ? (
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-brand">{eyebrow}</p>
      ) : null}
      <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">{title}</h2>
      {description ? <p className="mt-4 text-base leading-relaxed text-white/65 sm:text-lg">{description}</p> : null}
    </div>
  );
}
