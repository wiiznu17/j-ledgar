import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { middleware } from '../src/middleware';

// Mock jose
jest.mock('jose', () => ({
  jwtVerify: jest.fn(),
}));

// Mock next/server
jest.mock('next/server', () => ({
  NextResponse: {
    next: jest.fn().mockReturnValue({ type: 'next' }),
    redirect: jest.fn().mockImplementation((url) => ({ type: 'redirect', url })),
  },
}));

describe('Middleware RBAC Logic', () => {
  const mockUrl = 'http://localhost:3000';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function createRequest(pathname: string, token?: string) {
    const req = {
      nextUrl: { pathname, url: mockUrl + pathname },
      url: mockUrl + pathname,
      cookies: {
        get: jest.fn().mockReturnValue(token ? { value: token } : undefined),
      },
    } as unknown as NextRequest;
    return req;
  }

  it('redirects to /login if no token is present', async () => {
    const req = createRequest('/dashboard');
    const res = await middleware(req);

    expect(NextResponse.redirect).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/login' }),
    );
    expect(res).toEqual({ type: 'redirect', url: expect.anything() });
  });

  it('allows access to public paths without a token', async () => {
    const req = createRequest('/login');
    const res = await middleware(req);

    expect(NextResponse.next).toHaveBeenCalled();
    expect(res).toEqual({ type: 'next' });
  });

  it('redirects SUPPORT_STAFF from /reconcile to /dashboard', async () => {
    (jwtVerify as jest.Mock).mockResolvedValue({
      payload: { role: 'SUPPORT_STAFF' },
    });

    const req = createRequest('/reconcile', 'valid-token');
    const res = await middleware(req);

    expect(NextResponse.redirect).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/dashboard' }),
    );
  });

  it('redirects RECONCILER from /accounts to /dashboard', async () => {
    (jwtVerify as jest.Mock).mockResolvedValue({
      payload: { role: 'RECONCILER' },
    });

    const req = createRequest('/accounts', 'valid-token');
    const res = await middleware(req);

    expect(NextResponse.redirect).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/dashboard' }),
    );
  });

  it('allows SUPER_ADMIN to access everywhere', async () => {
    (jwtVerify as jest.Mock).mockResolvedValue({
      payload: { role: 'SUPER_ADMIN' },
    });

    const req = createRequest('/users', 'valid-token');
    const res = await middleware(req);

    expect(NextResponse.next).toHaveBeenCalled();
    expect(res).toEqual({ type: 'next' });
  });
});
