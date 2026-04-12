'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { API_BASE_URL } from '@/lib/api-config';

export async function login(formData: FormData) {
  const email = formData.get('email');
  const password = formData.get('password');
  
  if (!email || !password) return;

  let success = false;
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      // For now, handle errors simply. In a real app, return an error message to display in UI.
      return;
    }

    const data = await response.json();
    const cookieStore = await cookies();
    
    // JWT Token for authentication
    cookieStore.set('admin_session', data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
    });
    
    // Storing role separately for easier access in UI components
    cookieStore.set('user_role', data.role, {
      httpOnly: false, // Accessible by client-side components if needed, or stick to Server side
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24,
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
  cookieStore.delete('admin_session');
  redirect('/login');
}
