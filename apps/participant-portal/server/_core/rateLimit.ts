import { performance } from "node:perf_hooks";
import type { NextFunction, Request, Response } from "express";

/**
 * Dependency-free sliding-window limiter.
 *
 * The limiter is process-local and bounded. It is defence-in-depth for a
 * single Node process, not a distributed/global quota. Multi-instance
 * deployments must also enforce equivalent limits at a shared edge/gateway.
 */

export type RateLimitRule = { windowMs: number; max: number };

export type RateLimitDecision = {
  allowed: boolean;
  retryAfterSeconds: number;
  remaining: number;
};

export type RateLimiter = {
  check(key: string, ruleName: string, at?: number): RateLimitDecision;
  reset(): void;
};

const MAX_TRACKED_KEYS = 50_000;

export function createRateLimiter(rules: Record<string, RateLimitRule>): RateLimiter {
  const buckets = new Map<string, number[]>();

  function remember(bucketKey: string, hits: number[]) {
    // Refresh insertion order so eviction is least-recently-used, not merely
    // least-recently-created. Per-bucket hit arrays remain bounded by rule.max.
    if (buckets.has(bucketKey)) buckets.delete(bucketKey);
    buckets.set(bucketKey, hits);
    if (buckets.size > MAX_TRACKED_KEYS) {
      const oldestKey = buckets.keys().next().value;
      if (oldestKey !== undefined) buckets.delete(oldestKey);
    }
  }

  return {
    check(key: string, ruleName: string, at: number = performance.now()): RateLimitDecision {
      const rule = rules[ruleName];
      if (!rule) throw new Error(`Unknown rate-limit rule: ${ruleName}`);
      if (!Number.isFinite(at)) throw new Error("Rate-limit clock value must be finite.");
      if (!Number.isSafeInteger(rule.windowMs) || rule.windowMs <= 0 ||
          !Number.isSafeInteger(rule.max) || rule.max <= 0) {
        throw new Error(`Invalid rate-limit rule: ${ruleName}`);
      }

      const bucketKey = `${ruleName}:${key}`;
      const windowStart = at - rule.windowMs;
      const previous = buckets.get(bucketKey) ?? [];
      const hits = previous.filter(timestamp => timestamp > windowStart);

      if (hits.length >= rule.max) {
        const oldest = hits[0] ?? at;
        const waitMs = oldest + rule.windowMs - at;
        remember(bucketKey, hits);
        return {
          allowed: false,
          retryAfterSeconds: Math.max(1, Math.ceil(waitMs / 1000)),
          remaining: 0,
        };
      }

      hits.push(at);
      remember(bucketKey, hits);
      return {
        allowed: true,
        retryAfterSeconds: 0,
        remaining: Math.max(0, rule.max - hits.length),
      };
    },

    reset() {
      buckets.clear();
    },
  };
}

export type RateLimitClass = "callback" | "auth" | "read" | "write";

function normalizeRequestPath(path: string): string {
  const withoutQuery = path.split("?", 1)[0] ?? path;
  try {
    return decodeURIComponent(withoutQuery).toLowerCase();
  } catch {
    // Malformed encodings still receive API limits; never fail open.
    return withoutQuery.toLowerCase();
  }
}

/**
 * Classify every API route consistently with Express's default
 * case-insensitive routing. Only the three exact health endpoints bypass
 * limits; similarly prefixed paths do not inherit the exemption.
 */
export function rateLimitClass(method: string, path: string): RateLimitClass | null {
  const normalizedPath = normalizeRequestPath(path);
  if (!normalizedPath.startsWith("/api/")) return null;

  if (normalizedPath === "/api/health" ||
      normalizedPath === "/api/health/live" ||
      normalizedPath === "/api/health/ready") {
    return null;
  }

  if (normalizedPath === "/api/assessment/callback" ||
      normalizedPath.startsWith("/api/assessment/callback/")) {
    return "callback";
  }
  if (normalizedPath === "/api/oauth" ||
      normalizedPath.startsWith("/api/oauth/") ||
      normalizedPath === "/api/auth" ||
      normalizedPath.startsWith("/api/auth/")) {
    return "auth";
  }

  const normalizedMethod = method.toUpperCase();
  if (normalizedMethod === "GET" || normalizedMethod === "HEAD" || normalizedMethod === "OPTIONS") {
    return "read";
  }
  return "write";
}

/**
 * Numeric proxy-hop trust is safe only when the origin is reachable exclusively
 * through the configured, fixed proxy chain. Keep zero (the default) otherwise.
 * Restrict the range and reject malformed values instead of parseInt's
 * permissive "1garbage" behaviour.
 */
export function parseTrustedProxyHops(value: string | undefined): number {
  const normalized = value?.trim() ?? "";
  if (normalized === "") return 0;
  if (!/^(?:0|[1-5])$/.test(normalized)) {
    throw new Error("TRUST_PROXY_HOPS must be an integer from 0 through 5.");
  }
  return Number(normalized);
}

export const DEFAULT_RATE_LIMITS: Record<RateLimitClass, RateLimitRule> = {
  callback: { windowMs: 60_000, max: 60 },
  auth: { windowMs: 60_000, max: 30 },
  read: { windowMs: 60_000, max: 300 },
  write: { windowMs: 60_000, max: 120 },
};

export function clientKey(req: Request): string {
  // Express's req.ip observes only proxies selected by the explicit trust
  // configuration. Never parse X-Forwarded-For directly.
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
