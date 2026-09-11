import crypto from 'crypto';
import { cookies } from 'next/headers';
import { prisma } from './prisma';

const AUTH_COOKIE_NAME = 'tvcrm_session';
const SECRET_KEY = process.env.AUTH_SECRET || 'tvcrm-secure-session-key-super-secret-2026';

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: string;
  exp: number;
}

/**
 * Hash password with salt using PBKDF2
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verify password against stored salt:hash
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash || !storedHash.includes(':')) {
    // Backward compatibility if plain text exists in legacy data
    return password === storedHash;
  }
  const [salt, originalHash] = storedHash.split(':');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === originalHash;
}

/**
 * Sign session token
 */
export function signSessionToken(payload: Omit<SessionPayload, 'exp'>, expiresInDays = 7): string {
  const exp = Date.now() + expiresInDays * 24 * 60 * 60 * 1000;
  const data: SessionPayload = { ...payload, exp };
  const encoded = Buffer.from(JSON.stringify(data)).toString('base64url');
  const signature = crypto.createHmac('sha256', SECRET_KEY).update(encoded).digest('base64url');
  return `${encoded}.${signature}`;
}

/**
 * Verify session token
 */
export function verifySessionToken(token: string): SessionPayload | null {
  try {
    if (!token || !token.includes('.')) return null;
    const [encoded, signature] = token.split('.');
    const expectedSig = crypto.createHmac('sha256', SECRET_KEY).update(encoded).digest('base64url');
    
    if (signature !== expectedSig) return null;

    const json = Buffer.from(encoded, 'base64url').toString('utf-8');
    const data: SessionPayload = JSON.parse(json);

    if (Date.now() > data.exp) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

/**
 * Get current session user from cookies (for Server Actions & Route Handlers)
 */
export async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;

  const session = verifySessionToken(token);
  if (!session) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        target: true,
        phone: true,
        avatar: true,
        createdAt: true,
      },
    });
    return user;
  } catch {
    return null;
  }
}

export { AUTH_COOKIE_NAME };
