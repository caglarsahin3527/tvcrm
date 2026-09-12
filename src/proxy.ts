import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function isTokenValid(token: string | undefined): boolean {
  if (!token || !token.includes('.')) return false;
  try {
    const [encoded] = token.split('.');
    if (!encoded) return false;
    // Decode base64url
    const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const jsonStr = atob(base64);
    const data = JSON.parse(jsonStr);
    if (!data || !data.exp || typeof data.exp !== 'number') return false;
    if (Date.now() > data.exp) return false;
    return true;
  } catch {
    return false;
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken = request.cookies.get('tvcrm_session')?.value;

  const isAuthPage = pathname.startsWith('/login');
  const isApiAuth = pathname.startsWith('/api/auth');
  const isStatic = 
    pathname.startsWith('/_next') || 
    pathname.startsWith('/favicon.ico') || 
    pathname.startsWith('/file.svg') ||
    pathname.startsWith('/globe.svg') ||
    pathname.startsWith('/next.svg') ||
    pathname.startsWith('/vercel.svg') ||
    pathname.startsWith('/window.svg');

  if (isStatic || isApiAuth) {
    return NextResponse.next();
  }

  const valid = isTokenValid(sessionToken);

  // If token exists but is invalid/expired, remove it automatically
  if (sessionToken && !valid) {
    if (!isAuthPage) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      const res = NextResponse.redirect(loginUrl);
      res.cookies.delete('tvcrm_session');
      return res;
    } else {
      const res = NextResponse.next();
      res.cookies.delete('tvcrm_session');
      return res;
    }
  }

  // If user is not logged in and tries to access protected page
  if (!valid && !isAuthPage) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

