import { NextResponse } from 'next/server';

import {
  countProjectsByStatus,
  fetchAllProjects,
  fetchRecentVotes,
  fetchSmsLogs,
  fetchUsers,
} from '@/lib/data';

export async function GET() {
  try {
    const [projects, users, smsLogs, recentVotes] = await Promise.all([
      fetchAllProjects(),
      fetchUsers(),
      fetchSmsLogs(20),
      fetchRecentVotes(8),
    ]);

    const projectStats = countProjectsByStatus(projects);
    const smsSent = smsLogs.filter((log) => log.status === 'sent').length;
    const smsErrors = smsLogs.filter((log) => log.status === 'error').length;

    return NextResponse.json({
      stats: {
        projectsTotal: projectStats.total,
        projectsApproved: projectStats.approved,
        projectsPending: projectStats.pending,
        projectsRejected: projectStats.rejected,
        projectsWithLocation: projectStats.withLocation,
        usersTotal: users.length,
        votesTotal: projectStats.totalVotes,
        smsSent,
        smsErrors,
      },
      recentProjects: projects.slice(0, 6),
      recentVotes,
      recentSms: smsLogs.slice(0, 6),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Nie udało się pobrać statystyk.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
