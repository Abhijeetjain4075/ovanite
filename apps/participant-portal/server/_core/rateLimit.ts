import type { NextFunction, Request, Response } from "express";

/**
 * Dependency-free sliding-window rate limiter.
 *
 * The portal previously relied only on a per-staff assessment quota, which does
 * not protect sign-in, OAuth callbacks, anonymous reads, draft saves or callback
 * ingress. This module supplies a bounded, process-local limiter for those
 * surfaces. It is deliberately not a distributed limiter: a multi-instance
 * deployment must also enforce limits at the edge/gateway.
 */

export type RateLimitRule = { windowMs: number; max: number };

export type RateLimitDecision = {
  allowed: boolean;
  /** Seconds until the caller may retry. Zero when the request is allowed. */
  retryAfterSeconds: number;
  /** Remaining requests in the current window after this decision. */
  remaining: number;
};

export type RateLimiter = {
  check(key: string, ruleName: string, at?: number): RateLimitDecision;
  reset(): void;
};

/** Hard cap on tracked buckets so hostile unique-IP traffic cannot grow memory without bound. */
const MAX_TRACKED_KEYS = 50_000;

export function createRateLimiter(rules: Record<string, RateLimitRule>): RateLimiter {
  const buckets = new Map<string, number[]>();

  return {
    check(key: string, ruleName: string, at: number = Date.now()): RateLimitDecision {
      const rule = rules[ruleName];
      if (!rule) throw new Error(`Unknown rate-limit rule: ${ruleName}`);

      const bucketKey = `${ruleName}:${key}`;
      const windowStart = at - rule.windowMs;
      const previous = buckets.get(bucketKey) ?? [];
      // Evict timestamps that have left the window; the array stays sorted by
      // construction because every caller passes a monotonically sane clock.
      const hits = previous.filter(timestamp => timestamp > windowStart);

      if (hits.length >= rule.max) {
        const oldest = hits[0] ?? at;
        const waitMs = oldest + rule.windowMs - at;
        buckets.set(bucketKey, hits);
        return {
          allowed: false,
          retryAfterSeconds: Math.max(1, Math.ceil(waitMs / 1000)),
          remaining: 0,
        };
      }

      hits.push(at);
      buckets.set(bucketKey, hits);

      if (buckets.size > MAX_TRACKED_KEYS) {
        // Map iteration is insertion-ordered: drop the least recently created bucket.
        const oldestKey = buckets.keys().next().value;
        if (oldestKey !== undefined) buckets.delete(oldestKey);
      }

      return { allowed: true, retryAfterSeconds: 0, remaining: Math.max(0, rule.max - hits.length) };
    },

    reset() {
      buckets.clear();
    },
  };
}

export type RateLimitClass = "callback" | "auth" | "read" | "write";

/**
 * Classify a request into a limited surface. Health probes are deliberately
 * excluded so a degraded dependency cannot be masked by a 429 from a probe.
 */
export function rateLimitClass(method: string, path: string): RateLimitClass | null {
  // Only application API traffic is limited; static assets and the SPA shell
  // must never be throttled by this middleware.
  if (!path.startsWith("/api/")) return null;
  if (path.startsWith("/api/health")) return null;
  if (path === "/api/assessment/callback" || path.startsWith("/api/assessment/callback/")) return "callback";
  if (path.startsWith("/api/oauth") || path.startsWith("/api/auth")) return "auth";
  const normalized = method.toUpperCase();
  if (normalized === "GET" || normalized === "HEAD" || normalized === "OPTIONS") return "read";
  return "write";
}

export const DEFAULT_RATE_LIMITS: Record<RateLimitClass, RateLimitRule> = {
  // Workers post at most a handful of callbacks per run.
  callback: { windowMs: 60_000, max: 60 },
  // Sign-in starts and OAuth callbacks are the primary anonymous abuse surface.
  auth: { windowMs: 60_000, max: 30 },
  read: { windowMs: 60_000, max: 300 },
  write: { windowMs: 60_000, max: 120 },
};

export function clientKey(req: Request): string {
  // `req.ip` honours Express's trust-proxy setting; never trust
  // X-Forwarded-For directly here.
  return req.ip || req.socket?.remoteAddress || "unknown";
}

export function createRateLimitMiddleware(
  rules: Record<string, RateLimitRule> = DEFAULT_RATE_LIMITS,
): (req: Request, res: Response, next: NextFunction) => void {
  const limiter = createRateLimiter(rules);

  return (req, res, next) => {
    const surface = rateLimitClass(req.method, req.path);
    if (!surface) return next();

    const decision = limiter.check(clientKey(req), surface);
    res.setHeader("RateLimit-Limit", String(rules[surface].max));
    res.setHeader("RateLimit-Remaining", String(decision.remaining));

    if (!decision.allowed) {
      res.setHeader("Retry-After", String(decision.retryAfterSeconds));
      res.setHeader("Cache-Control", "no-store");
      res.status(429).json({
        error: "Too many requests. Retry later.",
        retryAfterSeconds: decision.retryAfterSeconds,
      });
      return;
    }

    return next();
  };
}
