import { describe, expect, it } from "vitest";
import { createRateLimiter, rateLimitClass } from "./rateLimit";

describe("createRateLimiter", () => {
  it("allows requests up to the rule maximum inside one window", () => {
    const limiter = createRateLimiter({ read: { windowMs: 1000, max: 2 } });
    expect(limiter.check("ip-a", "read", 0).allowed).toBe(true);
    expect(limiter.check("ip-a", "read", 10).allowed).toBe(true);
    const third = limiter.check("ip-a", "read", 20);
    expect(third.allowed).toBe(false);
    expect(third.remaining).toBe(0);
  });

  it("reports a retry delay derived from the oldest hit in the window", () => {
    const limiter = createRateLimiter({ auth: { windowMs: 10_000, max: 1 } });
    expect(limiter.check("ip-b", "auth", 1_000).allowed).toBe(true);
    const blocked = limiter.check("ip-b", "auth", 2_000);
    expect(blocked.allowed).toBe(false);
    // Oldest hit expires at 11_000; at 2_000 that is 9 seconds away.
    expect(blocked.retryAfterSeconds).toBe(9);
  });

  it("admits the caller again once the window has fully passed", () => {
    const limiter = createRateLimiter({ write: { windowMs: 5_000, max: 1 } });
    expect(limiter.check("ip-c", "write", 0).allowed).toBe(true);
    expect(limiter.check("ip-c", "write", 4_999).allowed).toBe(false);
    expect(limiter.check("ip-c", "write", 5_001).allowed).toBe(true);
  });

  it("keeps independent counters per key and per surface", () => {
    const limiter = createRateLimiter({
      read: { windowMs: 1_000, max: 1 },
      write: { windowMs: 1_000, max: 1 },
    });
    expect(limiter.check("ip-a", "read", 0).allowed).toBe(true);
    expect(limiter.check("ip-b", "read", 0).allowed).toBe(true);
    expect(limiter.check("ip-a", "write", 0).allowed).toBe(true);
    expect(limiter.check("ip-a", "read", 1).allowed).toBe(false);
    // A second key's first write is independent of the read bucket above.
    expect(limiter.check("ip-b", "write", 1).allowed).toBe(true);
    // The first key's write bucket is exhausted on its second attempt.
    expect(limiter.check("ip-a", "write", 2).allowed).toBe(false);
  });

  it("rejects an unconfigured rule instead of silently allowing traffic", () => {
    const limiter = createRateLimiter({ read: { windowMs: 1_000, max: 1 } });
    expect(() => limiter.check("ip-a", "nope", 0)).toThrow(/Unknown rate-limit rule/);
  });

  it("clears all state on reset", () => {
    const limiter = createRateLimiter({ read: { windowMs: 1_000, max: 1 } });
    expect(limiter.check("ip-a", "read", 0).allowed).toBe(true);
    limiter.reset();
    expect(limiter.check("ip-a", "read", 1).allowed).toBe(true);
  });
});

describe("rateLimitClass", () => {
  it("excludes health probes so readiness cannot be masked by a 429", () => {
    expect(rateLimitClass("GET", "/api/health")).toBeNull();
    expect(rateLimitClass("GET", "/api/health/ready")).toBeNull();
  });

  it("never limits static assets or the SPA shell", () => {
    expect(rateLimitClass("GET", "/")).toBeNull();
    expect(rateLimitClass("GET", "/assets/index-abc123.js")).toBeNull();
    expect(rateLimitClass("GET", "/approvals")).toBeNull();
  });

  it("separates callback, auth, read and write surfaces", () => {
    expect(rateLimitClass("POST", "/api/assessment/callback")).toBe("callback");
    expect(rateLimitClass("POST", "/api/oauth/callback")).toBe("auth");
    expect(rateLimitClass("GET", "/api/trpc/portal.mySubmissions")).toBe("read");
    expect(rateLimitClass("POST", "/api/trpc/portal.saveDraft")).toBe("write");
  });
});
