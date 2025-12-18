/**
 * Rate limiting middleware for API routes
 * Prevents abuse of authentication endpoints
 */

interface RateLimitStore {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitStore>();

// Cleanup old entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of store.entries()) {
    if (value.resetTime < now) {
      store.delete(key);
    }
  }
}, 10 * 60 * 1000);

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  max: number; // Max requests per window
}

export function rateLimit(config: RateLimitConfig) {
  return (identifier: string): { allowed: boolean; retryAfter?: number } => {
    const now = Date.now();
    const record = store.get(identifier);

    if (!record || record.resetTime < now) {
      // New window
      store.set(identifier, {
        count: 1,
        resetTime: now + config.windowMs,
      });
      return { allowed: true };
    }

    if (record.count < config.max) {
      // Within limit
      record.count++;
      return { allowed: true };
    }

    // Rate limited
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    return { allowed: false, retryAfter };
  };
}

// Pre-configured rate limiters
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 login attempts per 15 minutes per IP
});

export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
});
