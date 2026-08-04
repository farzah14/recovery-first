export type BillingRateLimiter = Readonly<{
  isAllowed: (key: string) => boolean;
}>;

type RateLimitOptions = Readonly<{
  maxRequests: number;
  windowMs: number;
  now?: () => number;
}>;

export function createBillingRateLimiter(options: RateLimitOptions): BillingRateLimiter {
  const now = options.now ?? Date.now;
  const windows = new Map<string, { startedAt: number; count: number }>();

  return {
    isAllowed(key: string): boolean {
      const currentTime = now();
      const current = windows.get(key);
      if (!current || currentTime - current.startedAt >= options.windowMs) {
        windows.set(key, { startedAt: currentTime, count: 1 });
        return true;
      }

      if (current.count >= options.maxRequests) {
        return false;
      }

      current.count += 1;
      return true;
    },
  };
}
