interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting
const store = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetTime) {
      store.delete(key);
    }
  }
}, 60000); // Clean every 1 minute

export interface RateLimitOptions {
  maxAttempts?: number;
  windowMs?: number;
}

/**
 * Check if an identifier (e.g. IP or email) has exceeded rate limit
 */
export function checkRateLimit(
  key: string,
  options: RateLimitOptions = {}
): { isBlocked: boolean; remainingAttempts: number; retryAfterSeconds: number } {
  const maxAttempts = options.maxAttempts ?? 5;
  const windowMs = options.windowMs ?? 5 * 60 * 1000; // 5 minutes default
  const now = Date.now();

  const entry = store.get(key);

  if (!entry || now > entry.resetTime) {
    return {
      isBlocked: false,
      remainingAttempts: maxAttempts,
      retryAfterSeconds: 0,
    };
  }

  if (entry.count >= maxAttempts) {
    const retryAfterSeconds = Math.ceil((entry.resetTime - now) / 1000);
    return {
      isBlocked: true,
      remainingAttempts: 0,
      retryAfterSeconds: Math.max(retryAfterSeconds, 1),
    };
  }

  return {
    isBlocked: false,
    remainingAttempts: maxAttempts - entry.count,
    retryAfterSeconds: 0,
  };
}

/**
 * Record a failed attempt
 */
export function recordFailedAttempt(
  key: string,
  options: RateLimitOptions = {}
): void {
  const windowMs = options.windowMs ?? 5 * 60 * 1000;
  const now = Date.now();

  const entry = store.get(key);
  if (!entry || now > entry.resetTime) {
    store.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
  } else {
    entry.count += 1;
  }
}

/**
 * Reset rate limit on success
 */
export function resetRateLimit(key: string): void {
  store.delete(key);
}
