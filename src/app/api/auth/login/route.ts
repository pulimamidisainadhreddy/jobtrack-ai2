import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_NAME, makeSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const expected = process.env.TRACKER_PASSWORD;
  if (!expected || expected.length < 8) return NextResponse.json({ error: 'Server password not configured.' }, { status: 503 });
  const body = await request.json().catch(() => ({}));
  // Compare complete values; password is not included in logs or API responses.
  if (typeof body.password !== 'string' || body.password !== expected) {
    return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, await makeSession(), {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 7 * 24 * 60 * 60
  });
  return response;
}
