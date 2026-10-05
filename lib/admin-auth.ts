import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

export const ADMIN_SESSION_COOKIE = 'admin_session';
const ADMIN_SESSION_MAX_AGE = 60 * 60 * 24 * 7;

function getSessionSecret() {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD;
}

function signSession(payload: string, secret: string) {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

export function isValidAdminPassword(password: unknown): password is string {
  const expected = process.env.ADMIN_PASSWORD;
  if (typeof password !== 'string' || !expected || password.length > 1024) return false;

  const submittedHash = createHmac('sha256', 'admin-password-check').update(password.trim()).digest();
  const expectedHash = createHmac('sha256', 'admin-password-check').update(expected.trim()).digest();
  return timingSafeEqual(submittedHash, expectedHash);
}

export async function createAdminSession() {
  const secret = getSessionSecret();
  if (!secret) throw new Error('ADMIN_PASSWORD ou ADMIN_SESSION_SECRET não configurada.');

  const payload = Buffer.from(JSON.stringify({
    expiresAt: Date.now() + ADMIN_SESSION_MAX_AGE * 1000,
    nonce: randomUUID(),
  })).toString('base64url');
  const token = `${payload}.${signSession(payload, secret)}`;
  const cookieStore = await cookies();

  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: ADMIN_SESSION_MAX_AGE,
    path: '/',
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
}

export async function isAdminAuthenticated() {
  const secret = getSessionSecret();
  if (!secret) return false;

  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return false;

  const [payload, signature, extra] = token.split('.');
  if (!payload || !signature || extra) return false;

  const expectedSignature = Buffer.from(signSession(payload, secret));
  const actualSignature = Buffer.from(signature);
  if (
    expectedSignature.length !== actualSignature.length ||
    !timingSafeEqual(expectedSignature, actualSignature)
  ) {
    return false;
  }

  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      expiresAt?: unknown;
      nonce?: unknown;
    };
    return typeof session.expiresAt === 'number' &&
      session.expiresAt > Date.now() &&
      typeof session.nonce === 'string';
  } catch {
    return false;
  }
}
