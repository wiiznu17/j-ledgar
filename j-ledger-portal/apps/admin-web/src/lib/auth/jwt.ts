import { jwtVerify, SignJWT } from 'jose';

const ADMIN_JWT_SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET ||
    'jledger-admin-super-secret-2024-dev-key-32chars',
);

export interface JWTPayload {
  sub: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, ADMIN_JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

export async function createToken(
  payload: Omit<JWTPayload, 'iat' | 'exp'>,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const token = await new SignJWT({ ...payload, iat: now })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('15m')
    .sign(ADMIN_JWT_SECRET);
  return token;
}
