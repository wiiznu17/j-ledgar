import { NextResponse, NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode('JLedgerSecretKeyForJWTSecurityPhase7_2024_Placeholder');

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Exclude public files and auth APIs
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname === '/login' ||
    pathname === '/' ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get('admin_session')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const { payload } = await jwtVerify(token, SECRET);
    const role = payload.role as string;

    // RBAC Redirect Logic
    if (role === 'SUPPORT_STAFF' && pathname === '/reconcile') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    if (role === 'RECONCILER' && (pathname === '/accounts' || pathname === '/users')) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    if (role !== 'SUPER_ADMIN' && pathname === '/users') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
  } catch (err) {
    console.error('JWT verification failed:', err);
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
