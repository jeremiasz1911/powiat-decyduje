import { NextResponse } from 'next/server';

import { fetchSmsLogs } from '@/lib/data';

export async function GET() {
  try {
    const logs = await fetchSmsLogs(100);
    const sent = logs.filter((item) => item.status === 'sent').length;
    const errors = logs.filter((item) => item.status === 'error').length;

    return NextResponse.json({
      stats: { sent, errors, total: logs.length },
      logs,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Nie udało się pobrać logów SMS.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
