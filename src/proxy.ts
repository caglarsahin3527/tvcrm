import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { consumeRateLimit } from '@/lib/rateLimit';

const AUTH_COOKIE_NAME = 'tvcrm_session';

// Public routes that don't require authentication
const PUBLIC_PATHS = ['/login', '/api/auth/login'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Skip static files, Next.js internal paths, and public assets
  if (
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico' ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.ico')
  ) {
    return NextResponse.next();
  }

  // 2. Global Rate Limiting for all API routes (300 req / min per IP) to prevent DoS / scraping
  if (pathname.startsWith('/api/')) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local-client';
    const rate = consumeRateLimit(`global_api:${ip}`, { maxAttempts: 300, windowMs: 60 * 1000 });
    if (rate.isBlocked) {
      return NextResponse.json(
        {
          success: false,
          error: `Çok fazla istek yapıldı. Lütfen ${rate.retryAfterSeconds} saniye sonra tekrar deneyiniz.`,
        },
        { status: 429 }
      );
    }
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const isPublicPath = PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(path + '/'));

  // 3. If user has session token and is accessing /login, redirect to dashboard /
  if (token && isPublicPath && pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 4. If accessing protected routes without token
  if (!token && !isPublicPath) {
    // If it's an API route, return 401 Unauthorized JSON
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, error: 'Oturum açılmalıdır.' },
        { status: 401 }
      );
    }

    // If it's a page route, redirect to /login
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
