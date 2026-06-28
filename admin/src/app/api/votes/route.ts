import { NextResponse } from 'next/server';

import { fetchRecentVotes } from '@/lib/data';

export async function GET() {
  try {
    const votes = await fetchRecentVotes(100);
    return NextResponse.json({ votes });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Nie udało się pobrać głosów.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
