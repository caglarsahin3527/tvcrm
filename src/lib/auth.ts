import crypto from 'crypto';
import { cookies } from 'next/headers';
import { prisma } from './prisma';

const AUTH_COOKIE_NAME = 'tvcrm_session';
const SECRET_KEY = process.env.AUTH_SECRET || 'tvcrm-secure-session-key-super-secret-2026';
const CURRENT_ITERATIONS = 100000;
const LEGACY_ITERATIONS = 1000;

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: string;
  exp: number;
}

/**
 * Timing-safe string comparison to prevent timing attacks
 */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf-8');
  const bufB = Buffer.from(b, 'utf-8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Hash password with salt using PBKDF2 with 100,000 iterations (OWASP Standard)
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, CURRENT_ITERATIONS, 64, 'sha512').toString('hex');
  return `v2:${CURRENT_ITERATIONS}:${salt}:${hash}`;
}

/**
 * Check if a stored hash needs to be upgraded to the latest security standard
 */
export function needsRehash(storedHash: string): boolean {
  if (!storedHash) return true;
  return !storedHash.startsWith(`v2:${CURRENT_ITERATIONS}:`);
}

/**
 * Verify password against stored hash with timing attack protection & multi-version backward compatibility
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash) return false;

  // Case 1: Latest Standard format: v2:<iterations>:<salt>:<hash>
  if (storedHash.startsWith('v2:')) {
    const parts = storedHash.split(':');
    if (parts.length === 4) {
      const iterations = parseInt(parts[1], 10) || CURRENT_ITERATIONS;
      const salt = parts[2];
      const originalHash = parts[3];
      const hash = crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512').toString('hex');
      return safeEqual(hash, originalHash);
    }
  }

  // Case 2: Legacy v1 PBKDF2 format: <salt>:<hash> (1,000 iterations)
  if (storedHash.includes(':')) {
    const [salt, originalHash] = storedHash.split(':');
    if (salt && originalHash) {
      const hash = crypto.pbkdf2Sync(password, salt, LEGACY_ITERATIONS, 64, 'sha512').toString('hex');
      return safeEqual(hash, originalHash);
    }
  }

  // Case 3: Plain text backward compatibility for any un-migrated legacy accounts
  return safeEqual(password, storedHash);
}

/**
 * Sign session token with HMAC-SHA256
 */
export function signSessionToken(payload: Omit<SessionPayload, 'exp'>, expiresInDays = 7): string {
  const exp = Date.now() + expiresInDays * 24 * 60 * 60 * 1000;
  const data: SessionPayload = { ...payload, exp };
  const encoded = Buffer.from(JSON.stringify(data)).toString('base64url');
  const signature = crypto.createHmac('sha256', SECRET_KEY).update(encoded).digest('base64url');
  return `${encoded}.${signature}`;
}

/**
 * Verify session token with timing-safe signature comparison
 */
export function verifySessionToken(token: string): SessionPayload | null {
  try {
    if (!token || !token.includes('.')) return null;
    const [encoded, signature] = token.split('.');
    const expectedSig = crypto.createHmac('sha256', SECRET_KEY).update(encoded).digest('base64url');
    
    if (!safeEqual(signature, expectedSig)) return null;

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
 * Fast session extraction without database query (0ms latency, HMAC-SHA256 verified)
 */
export async function getSessionUserFast(): Promise<{ id: string; email: string; name: string; role: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;

  const session = verifySessionToken(token);
  if (!session) return null;

  return {
    id: session.userId,
    email: session.email,
    name: session.name,
    role: session.role,
  };
}

/**
 * Get full session user from database (with phone, target, avatar)
 */
export async function getSessionUser() {
  const fast = await getSessionUserFast();
  if (!fast) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: fast.id },
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
