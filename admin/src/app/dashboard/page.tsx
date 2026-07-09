'use client';

import {
  FolderKanban,
  CheckCircle2,
  Clock3,
  XCircle,
  Users,
  Vote,
  MessageSquare,
  MapPin,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { AdminShell } from '@/components/admin-shell';
import { StatCard } from '@/components/stat-card';
import { StatusBadge, formatDate } from '@/components/status-badge';
import type { AdminProject, AdminSmsLog, AdminVoteActivity } from '@/lib/types';

type DashboardResponse = {
  stats: {
    projectsTotal: number;
    projectsApproved: number;
    projectsPending: number;
    projectsRejected: number;
    projectsWithLocation: number;
    usersTotal: number;
    votesTotal: number;
    smsSent: number;
    smsErrors: number;
  };
  recentProjects: AdminProject[];
  recentVotes: AdminVoteActivity[];
  recentSms: AdminSmsLog[];
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch('/api/dashboard')
      .then(async (res) => {
        const json = (await res.json()) as DashboardResponse & { error?: string };
        if (!res.ok) throw new Error(json.error ?? 'Błąd pobierania dashboardu.');
        setData(json);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <AdminShell title="Dashboard">
      {error ? <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      {!data ? (
        <p className="text-ink-muted">Ładowanie statystyk…</p>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Projekty" value={data.stats.projectsTotal} icon={FolderKanban} />
            <StatCard label="Zaakceptowane" value={data.stats.projectsApproved} icon={CheckCircle2} tone="success" />
            <StatCard label="Oczekujące" value={data.stats.projectsPending} icon={Clock3} tone="warning" />
            <StatCard label="Odrzucone" value={data.stats.projectsRejected} icon={XCircle} tone="danger" />
            <StatCard label="Konta użytkowników" value={data.stats.usersTotal} icon={Users} />
            <StatCard label="Oddane głosy" value={data.stats.votesTotal} icon={Vote} />
            <StatCard label="SMS wysłane" value={data.stats.smsSent} icon={MessageSquare} />
            <StatCard label="Na mapie" value={data.stats.projectsWithLocation} icon={MapPin} />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <section className="card p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-ink">Ostatnio dodane projekty</h2>
                <Link href="/projects" className="text-sm font-semibold text-brand">
                  Zobacz wszystkie
                </Link>
              </div>
              <div className="space-y-3">
                {data.recentProjects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="block rounded-xl border border-surface-border px-4 py-3 transition hover:bg-brand-soft/40">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-ink">{project.title}</p>
                        <p className="mt-1 text-xs text-ink-muted">
                          {project.commune} · {formatDate(project.createdAt)}
                        </p>
                      </div>
                      <StatusBadge status={project.status} />
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            <section className="card p-5">
              <h2 className="mb-4 text-lg font-bold text-ink">Ostatnia aktywność</h2>
              <div className="space-y-3">
                {data.recentVotes.map((vote) => (
                  <div key={`${vote.projectId}-${vote.id}`} className="rounded-xl border border-surface-border px-4 py-3">
                    <p className="text-sm font-semibold text-ink">Głos na: {vote.projectTitle}</p>
                    <p className="mt-1 text-xs text-ink-muted">
                      {vote.isAnonymous ? 'Głos anonimowy' : 'Głos jawny'} · {formatDate(vote.createdAt)}
                    </p>
                  </div>
                ))}
                {data.recentSms.map((sms) => (
                  <div key={sms.id} className="rounded-xl border border-surface-border px-4 py-3">
                    <p className="text-sm font-semibold text-ink">
                      SMS {sms.type === 'password_reset' ? 'reset hasła' : 'rejestracja'} — {sms.status}
                    </p>
                    <p className="mt-1 text-xs text-ink-muted">
                      {sms.phoneNumber} · {formatDate(sms.sentAt)}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
