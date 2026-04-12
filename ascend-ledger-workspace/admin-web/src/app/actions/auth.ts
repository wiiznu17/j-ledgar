'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function login(formData: FormData) {
  // In a real application, you would validate credentials against an Auth service.
  const email = formData.get('email');
  const password = formData.get('password');
  
  if (email && password) {
    const cookieStore = await cookies();
    cookieStore.set('admin_session', 'dummy_token_12345', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
    });
    
    redirect('/dashboard');
  }
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('admin_session');
  redirect('/login');
}
