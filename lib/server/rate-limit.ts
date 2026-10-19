interface Window {
  count: number;
  resetAt: number;
}

/**
 * Fixed-window, in-memory limiter. Per-instance only: good enough to stop a
 * single client hammering the paid model API, not a distributed quota.
 */
export function createRateLimiter({ limit, windowMs }: { limit: number; windowMs: number }) {
  const windows = new Map<string, Window>();

  return function check(key: string, now = Date.now()): { allowed: boolean; retryAfterS: number } {
    if (windows.size > 10_000) {
      for (const [k, w] of windows) if (w.resetAt <= now) windows.delete(k);
    }

    const current = windows.get(key);
    if (!current || current.resetAt <= now) {
      windows.set(key, { count: 1, resetAt: now + windowMs });
      return { allowed: true, retryAfterS: 0 };
    }

    if (current.count >= limit) {
      return { allowed: false, retryAfterS: Math.ceil((current.resetAt - now) / 1000) };
    }
    current.count += 1;
    return { allowed: true, retryAfterS: 0 };
  };
}
