import { NextResponse } from 'next/server';

import { badRequest } from '@/lib/api-response';
import { fetchAppSettings, saveAppSettings } from '@/lib/data';
import type { AppSettings } from '@/lib/types';

export async function GET() {
  try {
    const settings = await fetchAppSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Nie udało się pobrać ustawień.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as Partial<AppSettings>;
    const current = await fetchAppSettings();
    const next: AppSettings = {
      ...current,
      ...body,
      maxVotesPerUser:
        typeof body.maxVotesPerUser === 'number' && body.maxVotesPerUser > 0
          ? body.maxVotesPerUser
          : current.maxVotesPerUser,
    };

    if (!next.appName.trim()) {
      return badRequest('Nazwa aplikacji nie może być pusta.');
    }

    await saveAppSettings(next);
    return NextResponse.json({ settings: next });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Nie udało się zapisać ustawień.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
