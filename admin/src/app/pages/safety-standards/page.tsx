'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { AdminShell } from '@/components/admin-shell';
import type { SafetyStandardsPageCMS } from '@/lib/types';

type LangTab = 'pl' | 'en';

export default function SafetyStandardsAdminPage() {
  const [cms, setCms] = useState<SafetyStandardsPageCMS | null>(null);
  const [lang, setLang] = useState<LangTab>('pl');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [fromFirestore, setFromFirestore] = useState(false);

  useEffect(() => {
    void fetch('/api/pages/safety-standards')
      .then((res) => res.json())
      .then((json: { cms?: SafetyStandardsPageCMS; fromFirestore?: boolean }) => {
        setCms(json.cms ?? null);
        setFromFirestore(Boolean(json.fromFirestore));
      });
  }, []);

  const save = async () => {
    if (!cms) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/pages/safety-standards', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cms),
      });
      const json = (await res.json()) as { cms?: SafetyStandardsPageCMS; error?: string };
      if (!res.ok) throw new Error(json.error ?? 'Nie udało się zapisać treści.');
      setCms(json.cms ?? cms);
      setFromFirestore(true);
      setMessage('Treść strony /standardy została zapisana.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Nie udało się zapisać treści.');
    } finally {
      setSaving(false);
    }
  };

  const updateLangField = <K extends keyof SafetyStandardsPageCMS['pl']>(field: K, value: string) => {
    setCms((current) => {
      if (!current) return current;
      return {
        ...current,
        [lang]: {
          ...current[lang],
          [field]: value,
        },
      };
    });
  };

  if (!cms) {
    return (
      <AdminShell title="Standardy bezpieczeństwa">
        <p className="text-ink-muted">Ładowanie treści strony…</p>
      </AdminShell>
    );
  }

  const entry = cms[lang];

  return (
    <AdminShell title="Standardy bezpieczeństwa dzieci (CSAE)">
      <div className="card max-w-4xl space-y-5 p-6">
        <div className="flex flex-col gap-3 border-b border-surface-border pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-ink-secondary">
              Publiczna strona:{' '}
              <Link href="/standardy" className="font-semibold text-brand hover:underline" target="_blank">
                /standardy
              </Link>
            </p>
            <p className="mt-1 text-xs text-ink-muted">
              {fromFirestore
                ? 'Treść pobierana z Firestore (site_pages/safety-standards).'
                : 'Wyświetlany jest domyślny fallback z kodu — zapisz, aby utworzyć wersję w Firestore.'}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className={lang === 'pl' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setLang('pl')}>
              PL
            </button>
            <button
              type="button"
              className={lang === 'en' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setLang('en')}>
              EN
            </button>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold">Tytuł ({lang.toUpperCase()})</label>
          <input className="input" value={entry.title} onChange={(e) => updateLangField('title', e.target.value)} />
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold">Opis SEO ({lang.toUpperCase()})</label>
          <input
            className="input"
            value={entry.metaDescription}
            onChange={(e) => updateLangField('metaDescription', e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold">Data ostatniej aktualizacji ({lang.toUpperCase()})</label>
          <input
            className="input"
            value={entry.lastUpdated}
            onChange={(e) => updateLangField('lastUpdated', e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold">Treść ({lang.toUpperCase()})</label>
          <textarea
            className="input min-h-[420px] font-mono text-sm leading-relaxed"
            value={entry.bodyText}
            onChange={(e) => updateLangField('bodyText', e.target.value)}
          />
          <p className="mt-2 text-xs text-ink-muted">
            Format: akapit oddziel podwójnym enterem, nagłówki sekcji zapisz jako <code>## Nagłówek</code>, listy
            wypunktowane jako <code>- punkt</code>. Adres e-mail w osobnej linii zostanie automatycznie podlinkowany.
          </p>
        </div>

        {message ? <p className="text-sm text-ink-secondary">{message}</p> : null}

        <div className="flex flex-wrap gap-3">
          <button className="btn-primary" onClick={() => void save()} disabled={saving}>
            {saving ? 'Zapisywanie…' : 'Zapisz stronę /standardy'}
          </button>
          <Link href="/standardy" className="btn-secondary" target="_blank">
            Podgląd publiczny
          </Link>
        </div>
      </div>
    </AdminShell>
  );
}
