'use client';

import { useEffect, useState } from 'react';

import { AdminShell } from '@/components/admin-shell';
import type { AppSettings } from '@/lib/types';

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void fetch('/api/settings')
      .then((res) => res.json())
      .then((json: { settings?: AppSettings }) => setSettings(json.settings ?? null));
  }, []);

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const json = (await res.json()) as { settings?: AppSettings; error?: string };
      if (!res.ok) throw new Error(json.error ?? 'Nie udało się zapisać ustawień.');
      setSettings(json.settings ?? settings);
      setMessage('Ustawienia zapisane.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Nie udało się zapisać ustawień.');
    } finally {
      setSaving(false);
    }
  };

  if (!settings) {
    return (
      <AdminShell title="Ustawienia">
        <p className="text-ink-muted">Ładowanie ustawień…</p>
      </AdminShell>
    );
  }

  return (
    <AdminShell title="Ustawienia aplikacji">
      <div className="card max-w-3xl space-y-4 p-6">
        <div>
          <label className="mb-1 block text-sm font-semibold">Nazwa aplikacji</label>
          <input className="input" value={settings.appName} onChange={(e) => setSettings({ ...settings, appName: e.target.value })} />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={settings.votingEnabled} onChange={(e) => setSettings({ ...settings, votingEnabled: e.target.checked })} />
          Aktywne głosowanie
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={settings.projectSubmissionEnabled} onChange={(e) => setSettings({ ...settings, projectSubmissionEnabled: e.target.checked })} />
          Można zgłaszać projekty
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={settings.anonymousVotingEnabled} onChange={(e) => setSettings({ ...settings, anonymousVotingEnabled: e.target.checked })} />
          Można głosować anonimowo
        </label>

        <div>
          <label className="mb-1 block text-sm font-semibold">Limit głosów na użytkownika</label>
          <input
            className="input"
            type="number"
            min={1}
            value={settings.maxVotesPerUser}
            onChange={(e) => setSettings({ ...settings, maxVotesPerUser: Number(e.target.value) })}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold">Tekst informacyjny</label>
          <textarea className="input min-h-28" value={settings.infoText} onChange={(e) => setSettings({ ...settings, infoText: e.target.value })} />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-semibold">E-mail kontaktowy</label>
            <input className="input" value={settings.contactEmail} onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold">Telefon kontaktowy</label>
            <input className="input" value={settings.contactPhone} onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })} />
          </div>
        </div>

        {message ? <p className="text-sm text-ink-secondary">{message}</p> : null}

        <button className="btn-primary" onClick={() => void save()} disabled={saving}>
          {saving ? 'Zapisywanie…' : 'Zapisz ustawienia'}
        </button>
      </div>
    </AdminShell>
  );
}
