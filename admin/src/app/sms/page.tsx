'use client';

import { useEffect, useState } from 'react';

import { AdminShell } from '@/components/admin-shell';
import { StatCard } from '@/components/stat-card';
import { formatDate } from '@/components/status-badge';
import type { AdminSmsLog } from '@/lib/types';
import { CheckCircle2, XCircle, MessageSquare } from 'lucide-react';

export default function SmsPage() {
  const [logs, setLogs] = useState<AdminSmsLog[]>([]);
  const [stats, setStats] = useState({ sent: 0, errors: 0, total: 0 });

  useEffect(() => {
    void fetch('/api/sms')
      .then((res) => res.json())
      .then((json: { logs?: AdminSmsLog[]; stats?: typeof stats }) => {
        setLogs(json.logs ?? []);
        setStats(json.stats ?? { sent: 0, errors: 0, total: 0 });
      });
  }, []);

  return (
    <AdminShell title="SMS-y">
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <StatCard label="Wysłane SMS" value={stats.sent} icon={CheckCircle2} tone="success" />
        <StatCard label="Błędy SMS" value={stats.errors} icon={XCircle} tone="danger" />
        <StatCard label="Łącznie logów" value={stats.total} icon={MessageSquare} />
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Telefon</th>
              <th>Typ</th>
              <th>Status</th>
              <th>Data</th>
              <th>Błąd</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td>{log.phoneNumber}</td>
                <td>{log.type === 'password_reset' ? 'Reset hasła' : log.type === 'registration' ? 'Rejestracja' : log.type}</td>
                <td>{log.status}</td>
                <td>{formatDate(log.sentAt)}</td>
                <td className="text-red-600">{log.errorMessage ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
