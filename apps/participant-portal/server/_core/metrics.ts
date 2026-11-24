import { randomUUID, timingSafeEqual } from "node:crypto";
import { performance } from "node:perf_hooks";
import type { NextFunction, Request, Response } from "express";

/**
 * Process-local Prometheus metrics for the participant portal.
 *
 * Deliberately dependency-free and bounded:
 * - route labels come from an allowlist, never from the raw request path, so a
 *   hostile URL cannot create unbounded series;
 * - the number of series is capped, with excess traffic folded into an
 *   `overflow` label;
 * - no user identifiers, IP addresses or request values are ever recorded.
 *
 * The registry is per process. Scrape every replica and aggregate centrally, or
 * accept that a restarted process starts again at zero (counters are monotonic
 * only within one process lifetime).
 */

const DURATION_BUCKETS = [
  0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10,
] as const;

const MAX_SERIES = 2_000;

const ALLOWED_METHODS = new Set([
  "GET",
  "HEAD",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "OPTIONS",
]);

export type HttpSample = {
  method: string;
  route: string;
  status: number;
  durationSeconds: number;
};

export type MetricsSnapshot = {
  httpRequests: {
    method: string;
    route: string;
    status: number;
    count: number;
  }[];
  httpDurations: {
    route: string;
    count: number;
    sum: number;
    buckets: number[];
  }[];
  readiness: Record<string, number>;
  errors: Record<string, number>;
  uptimeSeconds: number;
};

export type MetricsRegistry = {
  observeHttpRequest(sample: HttpSample): void;
  countReadiness(result: "ready" | "not_ready"): void;
  countError(operation: string): void;
  render(): string;
  snapshot(): MetricsSnapshot;
};

/**
 * Maps a request URL onto a fixed label set. Anything unrecognised becomes
 * `other`, which is safe even for scanner traffic hitting random paths.
 */
export function normalizeRouteLabel(rawUrl: string): string {
  const path = (rawUrl.split("?")[0] || "/").slice(0, 512);
  switch (path) {
    case "/api/health":
    case "/api/health/live":
    case "/api/health/ready":
    case "/api/metrics":
    case "/api/platform/config.js":
      return path;
    default:
      break;
  }
  if (path.startsWith("/api/trpc/")) return "/api/trpc";
  if (path.startsWith("/api/oauth")) return "/api/oauth";
  if (path.startsWith("/api/assessment")) return "/api/assessment";
  if (path.startsWith("/manus-storage/")) return "/manus-storage";
  if (path.startsWith("/api/")) return "/api/other";
  if (path.startsWith("/assets/")) return "static";
  return path === "/" ? "/" : "other";
}

function normalizeMethod(method: string): string {
  const upper = method.toUpperCase();
  return ALLOWED_METHODS.has(upper) ? upper : "OTHER";
}

function normalizeOperation(operation: string): string {
  return /^[A-Za-z][A-Za-z0-9_]{0,47}$/.test(operation) ? operation : "other";
}

function normalizeStatus(status: number): number {
  if (!Number.isFinite(status)) return 0;
  const rounded = Math.trunc(status);
  return rounded >= 100 && rounded <= 599 ? rounded : 0;
}

function escapeLabelValue(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n");
}

function labels(values: Record<string, string>): string {
  const entries = Object.entries(values);
  if (entries.length === 0) return "";
  const body = entries
    .map(([key, value]) => `${key}="${escapeLabelValue(value)}"`)
    .join(",");
  return `{${body}}`;
}

function formatFloat(value: number): string {
  return Number.isFinite(value) ? String(value) : "0";
}

export function createMetricsRegistry(
  options: {
    release?: string;
    now?: () => number;
    buckets?: readonly number[];
  } = {},
): MetricsRegistry {
  const startedAt = options.now?.() ?? performance.now();
  const release = /^[A-Za-z0-9._-]{1,64}$/.test(options.release ?? "")
    ? (options.release as string)
    : "unknown";
  const buckets = options.buckets ?? DURATION_BUCKETS;

  const requests = new Map<string, number>();
  const durations = new Map<string, { count: number; sum: number; buckets: number[] }>();
  const readiness = new Map<string, number>();
  const errors = new Map<string, number>();

  return {
    observeHttpRequest(sample) {
      const method = normalizeMethod(sample.method);
      const route = sample.route.slice(0, 64);
      const status = normalizeStatus(sample.status);
      const duration = Number.isFinite(sample.durationSeconds)
        ? Math.max(0, sample.durationSeconds)
        : 0;

      // Existing series keep counting. A brand-new series past the cap is folded
      // into a single overflow bucket so memory stays bounded without dropping
      // traffic from the totals.
      const requestKey = `${method}\u0000${route}\u0000${status}`;
      const boundedRequestKey =
        requests.has(requestKey) || requests.size < MAX_SERIES - 1
          ? requestKey
          : `other\u0000overflow\u00000`;
      requests.set(
        boundedRequestKey,
        (requests.get(boundedRequestKey) ?? 0) + 1,
      );

      // One slot is reserved for the overflow bucket itself, so the family can
      // never exceed MAX_SERIES even while folding unknown routes.
      const durationRoute =
        durations.has(route) || durations.size < MAX_SERIES - 1
          ? route
          : "overflow";
      let bucket = durations.get(durationRoute);
      if (!bucket) {
        bucket = { count: 0, sum: 0, buckets: new Array(buckets.length).fill(0) };
        durations.set(durationRoute, bucket);
      }
      bucket.count += 1;
      bucket.sum += duration;
      for (let index = 0; index < buckets.length; index += 1) {
        if (duration <= buckets[index]) bucket.buckets[index] += 1;
      }
    },

    countReadiness(result) {
      readiness.set(result, (readiness.get(result) ?? 0) + 1);
    },

    countError(operation) {
      const key = normalizeOperation(operation);
      errors.set(key, (errors.get(key) ?? 0) + 1);
    },

    snapshot() {
      const httpRequests = [...requests.entries()]
        .map(([key, count]) => {
          const [method, route, status] = key.split("\u0000");
          return { method, route, status: Number(status), count };
        })
        .sort(
          (left, right) =>
            left.route.localeCompare(right.route) ||
            left.method.localeCompare(right.method) ||
            left.status - right.status,
        );

      const httpDurations = [...durations.entries()]
        .map(([route, value]) => ({ route, ...value }))
        .sort((left, right) => left.route.localeCompare(right.route));

      return {
        httpRequests,
        httpDurations,
        readiness: Object.fromEntries([...readiness.entries()].sort()),
        errors: Object.fromEntries([...errors.entries()].sort()),
        uptimeSeconds: Math.max(
          0,
          ((options.now?.() ?? performance.now()) - startedAt) / 1000,
        ),
      };
    },

    render() {
      const snapshot = this.snapshot();
      const lines: string[] = [];

      lines.push(
        "# HELP portal_http_requests_total HTTP requests handled, by method, normalized route and status.",
        "# TYPE portal_http_requests_total counter",
      );
      for (const entry of snapshot.httpRequests) {
        lines.push(
          `portal_http_requests_total${labels({
            method: entry.method,
            route: entry.route,
            status: String(entry.status),
          })} ${entry.count}`,
        );
      }

      lines.push(
        "# HELP portal_http_request_duration_seconds Request duration in seconds.",
        "# TYPE portal_http_request_duration_seconds histogram",
      );
      for (const entry of snapshot.httpDurations) {
        for (let index = 0; index < buckets.length; index += 1) {
          lines.push(
            `portal_http_request_duration_seconds_bucket${labels({
              route: entry.route,
              le: formatFloat(buckets[index]),
            })} ${entry.buckets[index]}`,
          );
        }
        lines.push(
          `portal_http_request_duration_seconds_bucket${labels({
            route: entry.route,
            le: "+Inf",
          })} ${entry.count}`,
        );
        lines.push(
          `portal_http_request_duration_seconds_sum${labels({
            route: entry.route,
          })} ${formatFloat(entry.sum)}`,
        );
        lines.push(
          `portal_http_request_duration_seconds_count${labels({
            route: entry.route,
          })} ${entry.count}`,
        );
      }

      lines.push(
        "# HELP portal_readiness_checks_total Readiness probes, by outcome.",
        "# TYPE portal_readiness_checks_total counter",
      );
      for (const [result, count] of Object.entries(snapshot.readiness)) {
        lines.push(
          `portal_readiness_checks_total${labels({ result })} ${count}`,
        );
      }

      lines.push(
        "# HELP portal_errors_total Recorded operational errors, by bounded operation name.",
        "# TYPE portal_errors_total counter",
      );
      for (const [operation, count] of Object.entries(snapshot.errors)) {
        lines.push(
          `portal_errors_total${labels({ operation })} ${count}`,
        );
      }

      lines.push(
        "# HELP portal_build_info Build identity of the running process.",
        "# TYPE portal_build_info gauge",
        `portal_build_info${labels({ release })} 1`,
        "# HELP portal_uptime_seconds Seconds since this process created its metrics registry.",
        "# TYPE portal_uptime_seconds gauge",
        `portal_uptime_seconds ${formatFloat(snapshot.uptimeSeconds)}`,
      );

      return `${lines.join("\n")}\n`;
    },
  };
}

function constantTimeEquals(expected: string, actual: string): boolean {
  const expectedBuffer = Buffer.from(expected, "utf8");
  const actualBuffer = Buffer.from(actual, "utf8");
  if (expectedBuffer.length !== actualBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, actualBuffer);
}

const MIN_METRICS_TOKEN_LENGTH = 32;

/**
 * Scrape endpoint guard. Without a long `METRICS_TOKEN` the route does not
 * exist at all: an unauthenticated endpoint that exposes traffic volumes and
 * error rates is an information leak, not a feature.
 */
export function createMetricsHandler(options: {
  registry: MetricsRegistry;
  token?: string;
}): (req: Request, res: Response) => void {
  const token = (options.token ?? "").trim();
  const configured = token.length >= MIN_METRICS_TOKEN_LENGTH;

  return function metricsHandler(req, res) {
    res.setHeader("Cache-Control", "no-store");
    if (!configured) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const header = typeof req.headers.authorization === "string"
      ? req.headers.authorization
      : "";
    const match = header.match(/^Bearer\s+(.+)$/i);
    if (!match || !constantTimeEquals(token, match[1].trim())) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    res
      .status(200)
      .type("text/plain; version=0.0.4; charset=utf-8")
      .send(options.registry.render());
  };
}

/**
 * Records every response once, using the normalized route label. Mount it before
 * authentication and rate limiting so rejected traffic is measured too.
 */
export function createHttpMetricsMiddleware(
  registry: MetricsRegistry,
  now: () => number = () => performance.now(),
): (req: Request, res: Response, next: NextFunction) => void {
  return function httpMetrics(req, res, next) {
    const startedAt = now();
    res.on("finish", () => {
      registry.observeHttpRequest({
        method: req.method,
        route: normalizeRouteLabel(req.originalUrl ?? req.url ?? "/"),
        status: res.statusCode,
        durationSeconds: Math.max(0, (now() - startedAt) / 1000),
      });
    });
    next();
  };
}

const REQUEST_ID_PATTERN = /^[A-Za-z0-9._-]{8,64}$/;

/**
 * Correlation id for logs and error reports. An inbound id is accepted only when
 * it is already safe to log; otherwise a fresh UUID is generated. The id is
 * echoed back so a user can quote it in a support request.
 */
export function createRequestIdMiddleware(): (
  req: Request,
  res: Response,
  next: NextFunction,
) => void {
  return function requestId(req, res, next) {
    const inbound = typeof req.headers["x-request-id"] === "string"
      ? req.headers["x-request-id"].trim()
      : "";
    const requestId = REQUEST_ID_PATTERN.test(inbound) ? inbound : randomUUID();
    res.locals.requestId = requestId;
    res.setHeader("X-Request-Id", requestId);
    next();
  };
}
