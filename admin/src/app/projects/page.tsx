'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Eye, Pencil, Trash2 } from 'lucide-react';

import { AdminShell } from '@/components/admin-shell';
import { StatusBadge, formatDate } from '@/components/status-badge';
import type { AdminProject } from '@/lib/types';

const STATUS_OPTIONS = [
  { value: '', label: 'Wszystkie statusy' },
  { value: 'submitted', label: 'Zgłoszony' },
  { value: 'approved', label: 'Zaakceptowany' },
  { value: 'rejected', label: 'Odrzucony' },
];

export default function ProjectsPage() {
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [commune, setCommune] = useState('');
  const [category, setCategory] = useState('');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/projects');
      const json = (await res.json()) as { projects?: AdminProject[]; error?: string };
      if (!res.ok) throw new Error(json.error ?? 'Błąd pobierania projektów.');
      setProjects(json.projects ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Błąd pobierania projektów.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const communes = useMemo(
    () => [...new Set(projects.map((p) => p.commune).filter(Boolean))].sort(),
    [projects]
  );
  const categories = useMemo(
    () => [...new Set(projects.map((p) => p.category).filter(Boolean))].sort(),
    [projects]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projects.filter((project) => {
      if (status && project.status !== status) return false;
      if (commune && project.commune !== commune) return false;
      if (category && project.category !== category) return false;
      if (!q) return true;
      return [project.title, project.description, project.createdByResidentLabel]
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [projects, search, status, commune, category]);

  const updateStatus = async (id: string, nextStatus: string) => {
    let rejectionReason: string | undefined;
    if (nextStatus === 'rejected') {
      const reason = window.prompt('Podaj powód odrzucenia (opcjonalnie):');
      if (reason === null) {
        return;
      }
      rejectionReason = reason;
    }

    await fetch('/api/projects', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: nextStatus, rejectionReason }),
    });
    await load();
  };

  const removeProject = async (id: string) => {
    if (!confirm('Czy na pewno usunąć ten projekt?')) return;
    await fetch(`/api/projects?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    await load();
  };

  return (
    <AdminShell title="Projekty">
      <div className="mb-4 grid gap-3 md:grid-cols-4">
        <input className="input md:col-span-2" placeholder="Szukaj po tytule, opisie, autorze…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select className="input" value={commune} onChange={(e) => setCommune(e.target.value)}>
          <option value="">Wszystkie gminy</option>
          {communes.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">Wszystkie kategorie</option>
          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      {error ? <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      {loading ? <p className="text-ink-muted">Ładowanie projektów…</p> : null}

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Tytuł</th>
              <th>Autor</th>
              <th>Gmina</th>
              <th>Kategoria</th>
              <th>Status</th>
              <th>Głosy</th>
              <th>Data</th>
              <th>Akcje</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((project) => (
              <tr key={project.id}>
                <td className="font-semibold text-ink">{project.title}</td>
                <td>{project.createdByResidentLabel}</td>
                <td>{project.commune}</td>
                <td>{project.category}</td>
                <td>
                  <div className="flex flex-col gap-2">
                    <StatusBadge status={project.status} />
                    <select
                      className="input !py-1 text-xs"
                      value={project.status}
                      onChange={(e) => void updateStatus(project.id, e.target.value)}>
                      {STATUS_OPTIONS.filter((o) => o.value).map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </td>
                <td>{project.votesCount}</td>
                <td>{formatDate(project.createdAt)}</td>
                <td>
                  <div className="flex items-center gap-2">
                    <Link href={`/projects/${project.id}`} className="btn-secondary !px-2.5 !py-2" title="Podgląd">
                      <Eye size={15} />
                    </Link>
                    <Link href={`/projects/${project.id}?edit=1`} className="btn-secondary !px-2.5 !py-2" title="Edycja">
                      <Pencil size={15} />
                    </Link>
                    <button className="btn-secondary !px-2.5 !py-2 text-red-600" onClick={() => void removeProject(project.id)} title="Usuń">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
