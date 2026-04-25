import { NextResponse, NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { verifyToken } from '@/lib/auth/jwt';

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'jledger-local-dev-jwt-secret');

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

  // Verify token and check expiration
  const payload = verifyToken(token);
  if (!payload) {
    // Token is invalid or expired, clear cookies and redirect
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('admin_session');
    response.cookies.delete('refresh_token');
    response.cookies.delete('user_id');
    response.cookies.delete('user_role');
    return response;
  }

  try {
    const { payload: jwtPayload } = await jwtVerify(token, SECRET);
    const role = jwtPayload.role as string;

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
    // Clear cookies on error
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('admin_session');
    response.cookies.delete('refresh_token');
    response.cookies.delete('user_id');
    response.cookies.delete('user_role');
    return response;
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
