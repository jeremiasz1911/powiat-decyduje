'use client';

import { useEffect, useState } from 'react';

import { AdminShell } from '@/components/admin-shell';
import { formatDate } from '@/components/status-badge';
import type { AdminUser } from '@/lib/types';

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch('/api/users')
      .then(async (res) => {
        const json = (await res.json()) as { users?: AdminUser[]; error?: string };
        if (!res.ok) throw new Error(json.error ?? 'Błąd pobierania użytkowników.');
        setUsers(json.users ?? []);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <AdminShell title="Użytkownicy / Konta">
      {error ? <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Imię i nazwisko</th>
              <th>Telefon</th>
              <th>E-mail</th>
              <th>Gmina</th>
              <th>Weryfikacja</th>
              <th>Głosy</th>
              <th>Rejestracja</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td className="font-semibold">{user.fullName || '—'}</td>
                <td>{user.phoneNumber || '—'}</td>
                <td>{user.email || '—'}</td>
                <td>{user.commune || '—'}</td>
                <td>{user.phoneVerified ? 'Zweryfikowany' : 'Niezweryfikowany'}</td>
                <td>{user.votesUsed}</td>
                <td>{formatDate(user.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
