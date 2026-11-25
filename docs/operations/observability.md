# Observability and error tracking

The participant portal and the static frontend are two different operability
problems. This document covers what exists in the repository today, what an
operator must supply, and which guarantees are still missing.

## Participant portal

### Metrics

`/api/metrics` exposes Prometheus text exposition (version 0.0.4) for the running
Node process:

| Metric | Type | Labels | Meaning |
| --- | --- | --- | --- |
| `portal_http_requests_total` | counter | `method`, `route`, `status` | Every response, including rejected and rate-limited traffic |
| `portal_http_request_duration_seconds` | histogram | `route` | Request latency, buckets 5ms → 10s plus `+Inf` |
| `portal_readiness_checks_total` | counter | `result` | `ready` / `not_ready` outcomes of the readiness probe |
| `portal_errors_total` | counter | `operation` | Allowlisted operational failures (`http_request`, `readiness_probe`, `server_start`, `server_runtime`) |
| `portal_build_info` | gauge | `release` | Build identity, always `1` |
| `portal_uptime_seconds` | gauge | – | Seconds since the metrics registry was created |

Design constraints that must not be relaxed:

- **Route labels are allowlisted.** `/api/trpc/...`, `/api/oauth/...`,
  `/api/assessment/...` and `/manus-storage/...` are collapsed to fixed labels;
  everything unrecognised becomes `other`. A scanner hammering random paths
  cannot create unbounded series.
- **Series are capped** at 2,000 per metric family; excess traffic folds into
  `overflow` instead of growing memory without limit.
- **No identifiers.** No IP addresses, user ids, canister principals, query text
  or request bodies are recorded.
- **No token, no route.** `METRICS_TOKEN` must be at least 32 characters. When it
  is unset or too short, `/api/metrics` answers `404` and reveals nothing. A
  wrong or malformed `Authorization: Bearer …` answers `401`.

Scrape example (Prometheus):

```yaml
scrape_configs:
  - job_name: ovanite-portal
    scheme: https
    metrics_path: /api/metrics
    authorization:
      credentials_file: /etc/prometheus/portal-metrics-token
    static_configs:
      - targets: ["portal.example.com"]
```

`METRICS_TOKEN` generation, for the secret store — never commit it:

```bash
openssl rand -base64 48
```

The registry is **per process**. With more than one replica, scrape every replica
(or scrape through a load balancer that exposes per-target endpoints) and
aggregate in the metrics backend. Counters reset when a process restarts, which
`rate()` handles correctly as long as the scraper is not treating them as
absolute totals.

### Structured error reporting

`server/_core/errorTracking.ts` emits one JSON line per failure on stderr:

```json
{"event":"portal_error","timestamp":"2026-01-02T03:04:05.000Z","release":"v1.2.3","requestId":"req-12345678","operation":"http_request","name":"Error","code":"ECONNREFUSED","category":"connection"}
```

- Only allowlisted fields are emitted. Exception messages, stack traces, SQL,
  URLs, request bodies and user identifiers are deliberately excluded — those are
  what leak credentials and personal data into log storage.
- `requestId` is the same value returned in the `X-Request-Id` response header, so
  a user can quote it and an operator can find the report.
- `ERROR_WEBHOOK_URL` optionally forwards every report to an external tracker.
  Only absolute `https:` URLs without embedded credentials are accepted, delivery
  is fire-and-forget with a 3-second timeout, and a delivery failure is swallowed:
  losing a report must never fail the request that produced it.
- `RELEASE` (or `GIT_SHA`) sets the `release` label; anything outside
  `[A-Za-z0-9._-]{1,64}` is reported as `unknown`.

`X-Request-Id` accepts an inbound value only when it matches
`[A-Za-z0-9._-]{8,64}`; anything else is replaced by a fresh UUID, so a hostile
header cannot inject log content.

### Recommended alerts

These thresholds are a starting point, not a validated SLO. Re-derive them from
measured traffic before paging anyone.

| Alert | Expression | Rationale |
| --- | --- | --- |
| Portal down | `sum(rate(portal_readiness_checks_total{result="ready"}[5m])) == 0` while probes are being sent | Readiness is failing or the process is gone |
| Error budget burn | `sum(rate(portal_http_requests_total{status=~"5.."}[5m])) / sum(rate(portal_http_requests_total[5m])) > 0.02` | 2% of traffic failing |
| Latency | `histogram_quantile(0.95, sum by (le) (rate(portal_http_request_duration_seconds_bucket[5m]))) > 1` | p95 above one second |
| Operational errors | `sum(rate(portal_errors_total[10m])) > 0` for `server_start` / `server_runtime` | The process is crash-looping or its listener failed |
| Readiness config drift | `increase(portal_readiness_checks_total{result="not_ready"}[15m]) > 0` | Secrets or schema regressed |

The readiness probe checks required secret **names**, database connectivity and
the presence of every portal table. It never returns values, SQL, hostnames or
connection strings.

## Static frontend

The exported site has no server-side logging. What it does have:

- `/api/health` on the portal is unrelated, the static site cannot be probed for
  readiness; use an external uptime check on `/` plus a content assertion.
- A deployed origin with an unusable `env.json` keeps rendering the public site
  in static mode: backend-dependent features (site copy, forms, admin, sign-in)
  stay in their closed states, every problem is logged to the console, and
  `document.documentElement.dataset.runtimeMode = "static"` is set. No operator
  text is shown to visitors, and `runtimeConfigError` is **not** set, because a
  site served without its backend is a mode, not an error.
- A bootstrap that cannot mount at all sets `runtimeMode = "failed"` and
  `runtimeConfigError = "failed"`, then replaces the page with a neutral reload
  prompt (`data-ocid="startup-failure"`); it never names an environment,
  canister, or configuration key.
- Alerts: `runtimeConfigError` present is an incident (the page did not mount).
  `runtimeMode = "static"` is the expected, alertable-but-not-failing signal that
  backend-backed features are inactive on a deployment that has no canister; an
  uptime check should also assert a known heading is present.
- The E2E smoke lane (`src/frontend/e2e/smoke.spec.ts`) fails if an unexpected
  console error appears or a failure surface is rendered.

## Environment variables introduced here

| Variable | Where | Required | Purpose |
| --- | --- | --- | --- |
| `METRICS_TOKEN` | portal | For scraping | ≥32 characters; the route is hidden without it |
| `ERROR_WEBHOOK_URL` | portal | Optional | HTTPS endpoint for structured error events |
| `RELEASE` / `GIT_SHA` | portal | Recommended | Build identity in logs and metrics |
| `X-Request-Id` (header) | portal | Optional inbound | Accepted only when already safe to log |

## Known gaps

- There is **no distributed trace** and no OpenTelemetry exporter; correlation is
  by `requestId`, not by span.
- There is **no alert delivery** in this repository: thresholds above must be
  configured in the metrics backend, which the owner must provision.
- Metrics are **per process**; gateway-level rate limiting dashboards do not
  exist here.
