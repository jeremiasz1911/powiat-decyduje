'use client';

import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { AdminShell } from '@/components/admin-shell';
import { StatusBadge, formatDate } from '@/components/status-badge';
import type { AdminProject } from '@/lib/types';

export default function ProjectDetailsPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const editMode = searchParams.get('edit') === '1';

  const [project, setProject] = useState<AdminProject | null>(null);
  const [form, setForm] = useState<Partial<AdminProject>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const res = await fetch(`/api/projects?id=${encodeURIComponent(params.id)}`);
    const json = (await res.json()) as { project?: AdminProject; error?: string };
    if (!res.ok) {
      setError(json.error ?? 'Nie udało się pobrać projektu.');
      return;
    }
    setProject(json.project ?? null);
    setForm(json.project ?? {});
  };

  useEffect(() => {
    const loadProject = async () => {
      const res = await fetch(`/api/projects?id=${encodeURIComponent(params.id)}`);
      const json = (await res.json()) as { project?: AdminProject; error?: string };
      if (!res.ok) {
        setError(json.error ?? 'Nie udało się pobrać projektu.');
        return;
      }
      setProject(json.project ?? null);
      setForm(json.project ?? {});
    };

    void loadProject();
  }, [params.id]);

  const reviewStatus = async (nextStatus: 'approved' | 'rejected') => {
    if (!project) return;

    let rejectionReason: string | undefined;
    if (nextStatus === 'rejected') {
      const reason = window.prompt('Podaj powód odrzucenia (opcjonalnie):');
      if (reason === null) return;
      rejectionReason = reason;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: project.id, status: nextStatus, rejectionReason }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? 'Nie udało się zmienić statusu.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nie udało się zmienić statusu.');
    } finally {
      setSaving(false);
    }
  };

  const save = async () => {
    if (!project) return;
    setSaving(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: project.id,
          title: form.title,
          description: form.description,
          category: form.category,
          commune: form.commune,
          markerColor: form.markerColor,
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? 'Nie udało się zapisać.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nie udało się zapisać.');
    } finally {
      setSaving(false);
    }
  };

  if (!project && !error) {
    return (
      <AdminShell title="Szczegóły projektu">
        <p className="text-ink-muted">Ładowanie…</p>
      </AdminShell>
    );
  }

  if (!project) {
    return (
      <AdminShell title="Szczegóły projektu">
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      </AdminShell>
    );
  }

  const images = project.imageUrls?.length ? project.imageUrls : project.imageUrl ? [project.imageUrl] : [];

  return (
    <AdminShell title="Szczegóły projektu">
      <div className="mb-4">
        <Link href="/projects" className="text-sm font-semibold text-brand">
          ← Wróć do listy projektów
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <section className="card space-y-4 p-6">
          {editMode ? (
            <>
              <input className="input" value={form.title ?? ''} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
              <textarea
                className="input min-h-40"
                value={form.description ?? ''}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              />
              <div className="grid gap-3 md:grid-cols-2">
                <input className="input" value={form.category ?? ''} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} />
                <input className="input" value={form.commune ?? ''} onChange={(e) => setForm((p) => ({ ...p, commune: e.target.value }))} />
                <input className="input" value={form.markerColor ?? ''} onChange={(e) => setForm((p) => ({ ...p, markerColor: e.target.value }))} />
              </div>
              <button className="btn-primary" onClick={() => void save()} disabled={saving}>
                {saving ? 'Zapisywanie…' : 'Zapisz zmiany'}
              </button>
            </>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-bold text-ink">{project.title}</h2>
                <StatusBadge status={project.status} />
              </div>
              <p className="whitespace-pre-wrap text-sm leading-7 text-ink-secondary">{project.description}</p>
            </>
          )}
        </section>

        <aside className="space-y-4">
          <div className="card space-y-3 p-5 text-sm">
            <p><span className="font-semibold">Autor:</span> {project.createdByResidentLabel}</p>
            <p><span className="font-semibold">Gmina:</span> {project.commune}</p>
            <p><span className="font-semibold">Kategoria:</span> {project.category}</p>
            <p><span className="font-semibold">Głosy:</span> {project.votesCount}</p>
            <p><span className="font-semibold">Data zgłoszenia:</span> {formatDate(project.createdAt)}</p>
            <p><span className="font-semibold">Ostatnia aktualizacja:</span> {formatDate(project.updatedAt)}</p>
            {project.reviewedAt ? (
              <p><span className="font-semibold">Weryfikacja:</span> {formatDate(project.reviewedAt)} ({project.reviewedBy ?? 'admin'})</p>
            ) : null}
            {project.rejectionReason ? (
              <p><span className="font-semibold">Powód odrzucenia:</span> {project.rejectionReason}</p>
            ) : null}
            <p><span className="font-semibold">Lokalizacja:</span> {project.locationLabel || project.village}</p>
            <p>
              <span className="font-semibold">Współrzędne:</span>{' '}
              {project.location
                ? `${project.location.latitude}, ${project.location.longitude}`
                : 'Brak'}
            </p>
            <p className="flex items-center gap-2">
              <span className="font-semibold">Kolor pinezki:</span>
              <span className="inline-block h-4 w-4 rounded-full border" style={{ backgroundColor: project.markerColor ?? '#E30613' }} />
              {project.markerColor ?? '#E30613'}
            </p>
          </div>

          {images.length > 0 ? (
            <div className="card p-4">
              <h3 className="mb-3 font-bold text-ink">Zdjęcia</h3>
              <div className="grid grid-cols-2 gap-3">
                {images.map((url) => (
                  <a key={url} href={url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl border">
                    <img src={url} alt="" className="h-28 w-full object-cover" />
                  </a>
                ))}
              </div>
            </div>
          ) : null}

          {!editMode && project.status === 'submitted' ? (
            <div className="card space-y-3 p-5">
              <h3 className="font-bold text-ink">Weryfikacja projektu</h3>
              <div className="flex flex-wrap gap-2">
                <button className="btn-primary" disabled={saving} onClick={() => void reviewStatus('approved')}>
                  Zaakceptuj
                </button>
                <button className="btn-secondary text-red-600" disabled={saving} onClick={() => void reviewStatus('rejected')}>
                  Odrzuć
                </button>
              </div>
            </div>
          ) : null}
        </aside>
      </div>
    </AdminShell>
  );
}
