import { NextResponse } from 'next/server';

import { fetchSafetyStandardsPageCMS, saveSafetyStandardsPageCMS } from '@/lib/data';
import { getDefaultSafetyStandardsCMS } from '@/lib/safety-standards-page';
import type { SafetyStandardsPageCMS } from '@/lib/types';

export async function GET() {
  try {
    const cms = await fetchSafetyStandardsPageCMS();
    return NextResponse.json({ cms: cms ?? getDefaultSafetyStandardsCMS(), fromFirestore: Boolean(cms) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Nie udało się pobrać treści strony.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as Partial<SafetyStandardsPageCMS>;
    const defaults = getDefaultSafetyStandardsCMS();
    const current = (await fetchSafetyStandardsPageCMS()) ?? defaults;

    const next: SafetyStandardsPageCMS = {
      pl: {
        title: body.pl?.title?.trim() || current.pl.title,
        metaDescription: body.pl?.metaDescription?.trim() || current.pl.metaDescription,
        lastUpdated: body.pl?.lastUpdated?.trim() || current.pl.lastUpdated,
        bodyText: body.pl?.bodyText?.trim() || current.pl.bodyText,
      },
      en: {
        title: body.en?.title?.trim() || current.en.title,
        metaDescription: body.en?.metaDescription?.trim() || current.en.metaDescription,
        lastUpdated: body.en?.lastUpdated?.trim() || current.en.lastUpdated,
        bodyText: body.en?.bodyText?.trim() || current.en.bodyText,
      },
      updatedAt: current.updatedAt,
    };

    if (!next.pl.title || !next.en.title) {
      return NextResponse.json({ error: 'Tytuł PL i EN są wymagane.' }, { status: 400 });
    }

    if (!next.pl.bodyText || !next.en.bodyText) {
      return NextResponse.json({ error: 'Treść PL i EN są wymagane.' }, { status: 400 });
    }

    await saveSafetyStandardsPageCMS(next);
    const saved = await fetchSafetyStandardsPageCMS();
    return NextResponse.json({ cms: saved ?? next });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Nie udało się zapisać treści strony.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
