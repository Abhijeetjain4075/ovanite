import { describe, expect, it } from "vitest";
import {
  createRateLimiter,
  parseTrustedProxyHops,
  rateLimitClass,
} from "./rateLimit";

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
    expect(limiter.check("ip-b", "write", 1).allowed).toBe(true);
    expect(limiter.check("ip-a", "write", 2).allowed).toBe(false);
  });

  it("rejects an unconfigured rule and malformed limits", () => {
    const limiter = createRateLimiter({ read: { windowMs: 1_000, max: 1 } });
    expect(() => limiter.check("ip-a", "nope", 0)).toThrow(/Unknown rate-limit rule/);
    expect(() => createRateLimiter({ bad: { windowMs: 0, max: 1 } }).check("ip", "bad", 0))
      .toThrow(/Invalid rate-limit rule/);
  });

  it("rejects non-finite clock values", () => {
    const limiter = createRateLimiter({ read: { windowMs: 1_000, max: 1 } });
    expect(() => limiter.check("ip-a", "read", Number.NaN)).toThrow(/clock value/);
  });

  it("clears all state on reset", () => {
    const limiter = createRateLimiter({ read: { windowMs: 1_000, max: 1 } });
    expect(limiter.check("ip-a", "read", 0).allowed).toBe(true);
    limiter.reset();
    expect(limiter.check("ip-a", "read", 1).allowed).toBe(true);
  });
});

describe("rateLimitClass", () => {
  it("normalizes case and encoded paths before classification", () => {
    expect(rateLimitClass("POST", "/API/TRPC/portal.saveDraft")).toBe("write");
    expect(rateLimitClass("POST", "/api%2Ftrpc/portal.saveDraft")).toBe("write");
    expect(rateLimitClass("POST", "/api/trpc/portal.saveDraft")).toBe("write");
  });

  it("exempts only exact health probes", () => {
    expect(rateLimitClass("GET", "/api/health")).toBeNull();
    expect(rateLimitClass("GET", "/API/HEALTH/READY")).toBeNull();
    expect(rateLimitClass("GET", "/api/health/live")).toBeNull();
    expect(rateLimitClass("GET", "/api/health/anything-else")).toBe("read");
    expect(rateLimitClass("POST", "/api/health-malicious")).toBe("write");
  });

  it("never limits the SPA shell or static assets outside the API", () => {
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

describe("parseTrustedProxyHops", () => {
  it("defaults to no trusted proxies", () => {
    expect(parseTrustedProxyHops(undefined)).toBe(0);
    expect(parseTrustedProxyHops("")).toBe(0);
    expect(parseTrustedProxyHops("0")).toBe(0);
  });

  it("accepts only canonical bounded integers", () => {
    expect(parseTrustedProxyHops("1")).toBe(1);
    expect(parseTrustedProxyHops(" 2 ")).toBe(2);
    expect(parseTrustedProxyHops("5")).toBe(5);
    expect(() => parseTrustedProxyHops("1garbage")).toThrow(/TRUST_PROXY_HOPS/);
    expect(() => parseTrustedProxyHops("6")).toThrow(/TRUST_PROXY_HOPS/);
    expect(() => parseTrustedProxyHops("-1")).toThrow(/TRUST_PROXY_HOPS/);
    expect(() => parseTrustedProxyHops("1.0")).toThrow(/TRUST_PROXY_HOPS/);
  });
});
