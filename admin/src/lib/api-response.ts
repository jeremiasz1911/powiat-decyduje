import { NextResponse } from 'next/server';

export function unauthorizedResponse() {
  return NextResponse.json({ error: 'Brak autoryzacji administratora.' }, { status: 401 });
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function serverError(message = 'Wewnętrzny błąd serwera.') {
  return NextResponse.json({ error: message }, { status: 500 });
}
