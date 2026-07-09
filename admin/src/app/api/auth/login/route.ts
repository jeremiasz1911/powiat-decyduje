import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import {
  createAdminSessionToken,
  getSessionCookieOptions,
  validateAdminCredentials,
  ADMIN_SESSION_COOKIE,
} from '@/lib/auth';
import { badRequest } from '@/lib/api-response';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { username?: string; password?: string };
    const username = body.username?.trim() ?? '';
    const password = body.password ?? '';

    if (!username || !password) {
      return badRequest('Podaj login i hasło.');
    }

    if (!validateAdminCredentials(username, password)) {
      return NextResponse.json({ error: 'Nieprawidłowy login lub hasło.' }, { status: 401 });
    }

    const token = await createAdminSessionToken();
    const response = NextResponse.json({ ok: true });
    response.cookies.set(ADMIN_SESSION_COOKIE, token, getSessionCookieOptions());
    return response;
  } catch {
    return NextResponse.json({ error: 'Nie udało się zalogować.' }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, '', { ...getSessionCookieOptions(), maxAge: 0 });
  return response;
}

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  return NextResponse.json({ authenticated: Boolean(token) });
}
