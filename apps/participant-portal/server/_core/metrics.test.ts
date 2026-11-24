import { describe, expect, it, vi } from "vitest";

import {
  createHttpMetricsMiddleware,
  createMetricsHandler,
  createMetricsRegistry,
  createRequestIdMiddleware,
  normalizeRouteLabel,
} from "./metrics";

function fakeResponse() {
  const headers: Record<string, string | number> = {};
  const response = {
    statusCode: 200,
    body: undefined as unknown,
    locals: {} as Record<string, unknown>,
    finished: [] as (() => void)[],
    setHeader: vi.fn((name: string, value: string | number) => {
      headers[name] = value;
      return response;
    }),
    status: vi.fn((code: number) => {
      response.statusCode = code;
      return response;
    }),
    json: vi.fn((body: unknown) => {
      response.body = body;
      return response;
    }),
    type: vi.fn(() => response),
    send: vi.fn((body: unknown) => {
      response.body = body;
      return response;
    }),
    on: vi.fn((event: string, handler: () => void) => {
      if (event === "finish") response.finished.push(handler);
      return response;
    }),
    headers,
  };
  return response;
}

describe("normalizeRouteLabel", () => {
  it("maps known paths and folds unknown ones", () => {
    expect(normalizeRouteLabel("/api/health/ready")).toBe("/api/health/ready");
    expect(normalizeRouteLabel("/api/trpc/portal.submit?batch=1")).toBe(
      "/api/trpc",
    );
    expect(normalizeRouteLabel("/api/oauth/callback")).toBe("/api/oauth");
    expect(normalizeRouteLabel("/manus-storage/abc.png")).toBe(
      "/manus-storage",
    );
    expect(normalizeRouteLabel("/api/unknown/thing")).toBe("/api/other");
    expect(normalizeRouteLabel("/wp-admin.php")).toBe("other");
    expect(normalizeRouteLabel("/assets/index-abc.js")).toBe("static");
  });

  it("never echoes a long or hostile path", () => {
    expect(normalizeRouteLabel(`/${"a".repeat(5_000)}`)).toBe("other");
    expect(normalizeRouteLabel('/api/trpc/x"y')).toBe("/api/trpc");
  });
});

describe("metrics registry", () => {
  it("counts requests and renders valid exposition text", () => {
    const registry = createMetricsRegistry({ release: "abc123", now: () => 0 });
    registry.observeHttpRequest({
      method: "GET",
      route: "/api/health/live",
      status: 200,
      durationSeconds: 0.003,
    });
    registry.observeHttpRequest({
      method: "post",
      route: "/api/trpc",
      status: 500,
      durationSeconds: 0.42,
    });
    registry.countReadiness("ready");
    registry.countError("http_500");
    registry.countError("bad operation name!");

    const text = registry.render();

    expect(text).toContain(
      'portal_http_requests_total{method="GET",route="/api/health/live",status="200"} 1',
    );
    expect(text).toContain(
      'portal_http_requests_total{method="POST",route="/api/trpc",status="500"} 1',
    );
    expect(text).toContain(
      'portal_http_request_duration_seconds_bucket{route="/api/trpc",le="0.5"} 1',
    );
    expect(text).toContain(
      'portal_http_request_duration_seconds_bucket{route="/api/health/live",le="0.005"} 1',
    );
    expect(text).toContain('portal_readiness_checks_total{result="ready"} 1');
    expect(text).toContain('portal_errors_total{operation="http_500"} 1');
    expect(text).toContain('portal_errors_total{operation="other"} 1');
    expect(text).toContain('portal_build_info{release="abc123"} 1');
    expect(text.endsWith("\n")).toBe(true);
  });

  it("escapes label values", () => {
    const registry = createMetricsRegistry({ now: () => 0 });
    registry.countError("x");
    // Route labels are allowlisted, so the only attacker-controlled surface is
    // the operation name, which is normalized. Assert the escaping helper's
    // effect through a route label that contains a quote.
    registry.observeHttpRequest({
      method: "GET",
      route: 'bad"route',
      status: 200,
      durationSeconds: 0,
    });
    expect(registry.render()).toContain('route="bad\\"route"');
  });

  it("bounds series growth instead of growing without limit", () => {
    const registry = createMetricsRegistry({ now: () => 0 });
    for (let index = 0; index < 3_000; index += 1) {
      registry.observeHttpRequest({
        method: "GET",
        route: `route-${index}`,
        status: 200,
        durationSeconds: 0.001,
      });
    }
    const snapshot = registry.snapshot();
    expect(snapshot.httpRequests.length).toBeLessThanOrEqual(2_000);
    expect(
      snapshot.httpRequests.some((entry) => entry.route === "overflow"),
    ).toBe(true);
  });

  it("ignores non-finite durations and invalid statuses", () => {
    const registry = createMetricsRegistry({ now: () => 0 });
    registry.observeHttpRequest({
      method: "GET",
      route: "/api/health/live",
      status: Number.NaN,
      durationSeconds: Number.POSITIVE_INFINITY,
    });
    const snapshot = registry.snapshot();
    expect(snapshot.httpRequests[0].status).toBe(0);
    expect(snapshot.httpDurations[0].sum).toBe(0);
    expect(snapshot.httpDurations[0].count).toBe(1);
  });
});

describe("metrics handler", () => {
  const token = "a".repeat(32);

  it("hides the route entirely when no token is configured", () => {
    const handler = createMetricsHandler({
      registry: createMetricsRegistry(),
      token: "",
    });
    const res = fakeResponse();
    handler(
      { headers: {} } as never,
      res as never,
    );
    expect(res.statusCode).toBe(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Not found" });
  });

  it("rejects a short token configuration", () => {
    const handler = createMetricsHandler({
      registry: createMetricsRegistry(),
      token: "short",
    });
    const res = fakeResponse();
    handler({ headers: { authorization: "Bearer short" } } as never, res as never);
    expect(res.statusCode).toBe(404);
  });

  it("rejects missing, malformed, and wrong credentials", () => {
    const handler = createMetricsHandler({
      registry: createMetricsRegistry(),
      token,
    });
    for (const headers of [
      {},
      { authorization: `Bearer ${"b".repeat(32)}` },
      { authorization: `Basic ${token}` },
      { authorization: token },
    ]) {
      const res = fakeResponse();
      handler({ headers } as never, res as never);
      expect(res.statusCode).toBe(401);
    }
  });

  it("returns the exposition when the bearer token matches", () => {
    const registry = createMetricsRegistry({ release: "rel" });
    const handler = createMetricsHandler({ registry, token });
    const res = fakeResponse();
    handler({ headers: { authorization: `Bearer ${token}` } } as never, res as never);
    expect(res.statusCode).toBe(200);
    expect(res.headers["Cache-Control"]).toBe("no-store");
    expect(String(res.body)).toContain("portal_http_requests_total");
  });
});

describe("http metrics middleware", () => {
  it("records one sample per finished response using a normalized route", () => {
    const registry = createMetricsRegistry({ now: () => 0 });
    const middleware = createHttpMetricsMiddleware(registry, () => 250);
    const res = fakeResponse();
    const next = vi.fn();

    middleware(
      { method: "GET", originalUrl: "/api/trpc/x?y=1" } as never,
      res as never,
      next,
    );
    expect(next).toHaveBeenCalledTimes(1);

    // 250ms elapsed against the same clock: recorded as a 0.25s sample.
    res.statusCode = 200;
    for (const handler of res.finished) handler();

    const snapshot = registry.snapshot();
    expect(snapshot.httpRequests).toEqual([
      { method: "GET", route: "/api/trpc", status: 200, count: 1 },
    ]);
    expect(snapshot.httpDurations[0].count).toBe(1);
  });
});

describe("request id middleware", () => {
  it("accepts a safe inbound id and generates one otherwise", () => {
    const middleware = createRequestIdMiddleware();

    const accepted = fakeResponse();
    const next = vi.fn();
    middleware(
      { headers: { "x-request-id": "req-12345678" } } as never,
      accepted as never,
      next,
    );
    expect(accepted.headers["X-Request-Id"]).toBe("req-12345678");

    const rejected = fakeResponse();
    middleware(
      { headers: { "x-request-id": "bad id with spaces" } } as never,
      rejected as never,
      next,
    );
    expect(rejected.headers["X-Request-Id"]).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });
});
