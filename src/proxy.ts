import { NextResponse } from 'next/server';

// =====================================================================
// Edge proxy (Next 16 replacement for middleware): security headers + cheap cookie-based route gating.
// (Full authorisation is always re-checked server-side in layouts/APIs.)
// =====================================================================

const SESSION_COOKIE = process.env.NODE_ENV === 'production'
  ? '__Secure-spis.session-token'
  : 'spis.session-token';

export function proxy(req: Request) {
  const url = new URL(req.url);
  const path = url.pathname;
  const hasSession = Boolean(req.headers.get('cookie')?.includes(`${SESSION_COOKIE}=`));

  // Gate staff & portal areas at the edge (cheap redirect only)
  const isProtected = path.startsWith('/dashboard') || path.startsWith('/portal');
  if (isProtected && !hasSession) {
    const login = new URL('/login', url);
    login.searchParams.set('callbackUrl', path);
    return NextResponse.redirect(login);
  }

  const res = NextResponse.next();
  // Security headers
  res.headers.set('X-Frame-Options', 'SAMEORIGIN');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.headers.set('X-XSS-Protection', '1; mode=block');
  res.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'self'",
    ].join('; '),
  );
  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/auth|api/webhooks).*)'],
};
