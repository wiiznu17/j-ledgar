import { cookies } from 'next/headers';

const CSRF_SECRET = process.env.CSRF_SECRET || 'jledger-local-dev-csrf-secret';

export async function generateCSRFToken(): Promise<string> {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2);
  const token = Buffer.from(`${timestamp}.${random}.${CSRF_SECRET}`).toString('base64');
  return token;
}

export async function validateCSRFToken(token: string): Promise<boolean> {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const parts = decoded.split('.');

    if (parts.length !== 3) return false;

    const [timestampStr, secret] = parts;
    const timestamp = parseInt(timestampStr!, 10);

    if (isNaN(timestamp)) return false;

    // Check if token is expired (1 hour)
    const tokenAge = Date.now() - timestamp;
    if (tokenAge > 60 * 60 * 1000) return false;

    // Check secret
    if (secret !== CSRF_SECRET) return false;

    return true;
  } catch (error) {
    console.error('CSRF validation failed:', error);
    return false;
  }
}

export async function getCSRFToken(): Promise<string> {
  const cookieStore = await cookies();
  const existingToken = cookieStore.get('csrf_token')?.value;

  if (existingToken) {
    const isValid = await validateCSRFToken(existingToken);
    if (isValid) return existingToken;
  }

  const newToken = await generateCSRFToken();
  cookieStore.set('csrf_token', newToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60, // 1 hour
    path: '/',
  });

  return newToken;
}
