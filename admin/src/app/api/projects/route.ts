import { NextResponse } from 'next/server';

import { badRequest } from '@/lib/api-response';
import { deleteProjectById, fetchAllProjects, fetchProjectById } from '@/lib/data';
import { getFirestore } from '@/lib/firebase-admin';
import type { ProjectStatus } from '@/lib/types';

const ALLOWED_STATUSES = new Set<ProjectStatus>(['submitted', 'approved', 'rejected']);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const project = await fetchProjectById(id);
      if (!project) {
        return NextResponse.json({ error: 'Projekt nie istnieje.' }, { status: 404 });
      }
      return NextResponse.json({ project });
    }

    const projects = await fetchAllProjects();
    return NextResponse.json({ projects });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Nie udało się pobrać projektów.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as {
      id?: string;
      status?: string;
      title?: string;
      description?: string;
      category?: string;
      commune?: string;
      markerColor?: string;
      rejectionReason?: string | null;
    };

    if (!body.id) {
      return badRequest('Brak identyfikatora projektu.');
    }

    const db = getFirestore();
    const ref = db.collection('projects').doc(body.id);
    const updates: Record<string, unknown> = { updatedAt: new Date() };

    if (body.title) updates.title = body.title;
    if (body.description) updates.description = body.description;
    if (body.category) updates.category = body.category;
    if (body.commune) updates.commune = body.commune;
    if (body.markerColor) updates.markerColor = body.markerColor;

    if (body.status) {
      if (!ALLOWED_STATUSES.has(body.status as ProjectStatus)) {
        return badRequest('Nieprawidłowy status projektu.');
      }

      const nextStatus = body.status as ProjectStatus;
      updates.status = nextStatus;
      updates.reviewedAt = new Date();
      updates.reviewedBy = process.env.ADMIN_USERNAME ?? 'admin';

      if (nextStatus === 'rejected') {
        updates.rejectionReason = body.rejectionReason?.trim() || 'Projekt nie spełnia wymagań.';
      } else {
        updates.rejectionReason = null;
      }
    }

    await ref.update(updates);
    const project = await fetchProjectById(body.id);
    return NextResponse.json({ project });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Nie udało się zaktualizować projektu.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return badRequest('Brak identyfikatora projektu.');
    }

    await deleteProjectById(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Nie udało się usunąć projektu.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
