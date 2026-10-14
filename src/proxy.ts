import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_NAME, validSession } from './lib/auth';

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  if (path === '/login' || path === '/api/auth/login' || path === '/api/health') return NextResponse.next();
  const configured = Boolean(process.env.TRACKER_PASSWORD && process.env.TRACKER_PASSWORD.length >= 8);
  if (!configured) {
    if (process.env.NODE_ENV !== 'production') return NextResponse.next();
    return path.startsWith('/api/')
      ? NextResponse.json({ error: 'Set TRACKER_PASSWORD (min 8 characters) in your Vercel environment.' }, { status: 503 })
      : new NextResponse('Configure TRACKER_PASSWORD in your Vercel environment before using this private tracker.', { status: 503 });
  }
  if (await validSession(req.cookies.get(COOKIE_NAME)?.value)) return NextResponse.next();
  if (path.startsWith('/api/')) return NextResponse.json({ error: 'Please log in first.' }, { status: 401 });
  const url = req.nextUrl.clone();
  url.pathname = '/login';
  url.search = '';
  return NextResponse.redirect(url);
}
export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };
