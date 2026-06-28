'use client';

import { useEffect, useState } from 'react';

import { AdminShell } from '@/components/admin-shell';
import { formatDate } from '@/components/status-badge';
import type { AdminVoteActivity } from '@/lib/types';

export default function VotesPage() {
  const [votes, setVotes] = useState<AdminVoteActivity[]>([]);

  useEffect(() => {
    void fetch('/api/votes')
      .then((res) => res.json())
      .then((json: { votes?: AdminVoteActivity[] }) => setVotes(json.votes ?? []));
  }, []);

  return (
    <AdminShell title="Głosy">
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Projekt</th>
              <th>Typ głosu</th>
              <th>Data</th>
            </tr>
          </thead>
          <tbody>
            {votes.map((vote) => (
              <tr key={`${vote.projectId}-${vote.id}`}>
                <td className="font-semibold">{vote.projectTitle}</td>
                <td>{vote.isAnonymous ? 'Anonimowy' : 'Jawny'}</td>
                <td>{formatDate(vote.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
