import { jwtVerify, SignJWT } from 'jose';

export interface JWTPayload {
  sub: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

function getSecret() {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) {
    console.warn('[JWT] ADMIN_JWT_SECRET is not defined in environment! Falling back to dev secret.');
  }
  return new TextEncoder().encode(secret || 'jledger-admin-super-secret-2024-dev-key-32chars');
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
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
    .sign(getSecret());
  return token;
}

