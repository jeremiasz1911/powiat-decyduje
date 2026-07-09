import { Mail, Phone, ExternalLink } from 'lucide-react';

import { CONTACT } from './landing-data';
import { SectionHeading, SectionShell } from './SectionShell';

export function ContactSection() {
  return (
    <SectionShell id="contact" narrow>
      <SectionHeading
        eyebrow="Kontakt"
        title="Masz pytania?"
        description="Skontaktuj się w sprawie aplikacji, projektów obywatelskich lub procedur zgłaszania inicjatyw."
        align="center"
      />
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur-sm">
        <div className="space-y-5">
          <a
            href={`mailto:${CONTACT.email}`}
            className="flex items-center gap-4 rounded-xl border border-white/8 bg-white/[0.03] px-5 py-4 transition hover:border-brand/30 hover:bg-brand/5">
            <Mail className="h-5 w-5 text-brand" />
            <div>
              <p className="text-xs text-white/45">E-mail</p>
              <p className="font-medium text-white">{CONTACT.email}</p>
            </div>
          </a>
          <div className="flex items-center gap-4 rounded-xl border border-white/8 bg-white/[0.03] px-5 py-4">
            <Phone className="h-5 w-5 text-brand" />
            <div>
              <p className="text-xs text-white/45">Telefon</p>
              {/* TODO: Uzupełnij numer telefonu w landing-data.ts */}
              <p className="font-medium text-white">{CONTACT.phone}</p>
            </div>
          </div>
          <a
            href={CONTACT.website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 rounded-xl border border-white/8 bg-white/[0.03] px-5 py-4 transition hover:border-brand/30 hover:bg-brand/5">
            <ExternalLink className="h-5 w-5 text-brand" />
            <div>
              <p className="text-xs text-white/45">Strona internetowa</p>
              <p className="font-medium text-white">{CONTACT.websiteLabel}</p>
            </div>
          </a>
        </div>
      </div>
    </SectionShell>
  );
}
