import { NextResponse } from 'next/server';

import { fetchUsers } from '@/lib/data';

export async function GET() {
  try {
    const users = await fetchUsers();
    return NextResponse.json({ users });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Nie udało się pobrać użytkowników.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
