'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { authRequester } from '@/lib/requesters';

export async function login(formData: FormData) {
  const email = formData.get('email');
  const password = formData.get('password');

  if (!email || !password) return;

  let success = false;
  try {
    const data = await authRequester.login({ email, password });
    
    const cookieStore = await cookies();

    // Access Token (short-lived)
    cookieStore.set('admin_session', data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 15, // 15 minutes
      path: '/',
    });

    // Refresh Token (long-lived)
    cookieStore.set('refresh_token', data.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    // User Metadata
    cookieStore.set('user_id', data.userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    cookieStore.set('user_role', data.role, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    success = true;
  } catch (error) {
    console.error('Login error:', error);
  }

  if (success) {
    redirect('/dashboard');
  }
}

export async function logout() {
  const cookieStore = await cookies();
  
  try {
    await authRequester.logout();
  } catch (e) {
    console.error('Remote logout failed', e);
  }

  cookieStore.delete('admin_session');
  cookieStore.delete('refresh_token');
  cookieStore.delete('user_id');
  cookieStore.delete('user_role');
  redirect('/login');
}

export async function refreshSession() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get('refresh_token')?.value;
  const userId = cookieStore.get('user_id')?.value;

  if (!refreshToken || !userId) {
    return null;
  }

  try {
    const data = await authRequester.refresh({ userId, refreshToken });

    // Update session cookies
    cookieStore.set('admin_session', data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 15,
      path: '/',
    });

    cookieStore.set('refresh_token', data.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return data.token;
  } catch (error) {
    console.error('Session refresh error:', error);
    return null;
  }
}
