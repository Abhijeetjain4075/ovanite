# E2E smoke lane and load testing

## Browser E2E smoke lane

Location: `src/frontend/e2e/`, configuration `src/frontend/playwright.config.ts`.
CI job: **Browser E2E smoke against the production build**
(`.github/workflows/frontend-quality.yml`).

It runs Playwright/Chromium against `vite preview`, so the tested artefact is the
real production bundle with the SPA rewrites the host applies — not the dev
server. The lane deliberately needs no backend:

| Check | Why it exists |
| --- | --- |
| `/env.json` returns JSON with all five contract keys | A missing or renamed key silently disables backend access |
| Home renders `main`, has a non-empty title, and shows no `runtime-config-error` marker | Catches a bundle that fails before mounting |
| Console has no `error` entries on load | Catches failed asset, module and API-origin errors |
| Clicking Products navigates to `/products` and renders its heading | Catches router and chunk-loading regressions |
| A deep link (`/privacy`) returns 200 and renders | Catches a host rewrite that 404s deep links |
| An unknown path renders the 404 page | Catches a blank screen fallback |

Local run:

```bash
pnpm install --frozen-lockfile
pnpm --dir src/frontend exec playwright install --with-deps chromium
pnpm --dir src/frontend build          # produces dist/ including env.json
pnpm --dir src/frontend exec playwright test
```

On failure, Playwright keeps a trace in `src/frontend/test-results/` and the CI job
uploads `playwright-report/`. Both directories are git-ignored.

The lane runs against `127.0.0.1`, which the runtime-config guard treats as local
development, so a placeholder `env.json` is tolerated there. That is intentional —
the deployability gate, not this lane, is what refuses placeholders.

## Load testing

Harness: `scripts/load-test.mjs` (no dependencies). It is **not** scheduled: a
throughput or latency verdict needs a deployed target, and inventing numbers from
a laptop run would be a false claim.

```bash
node scripts/load-test.mjs \
  --url https://portal.example.com/api/health/live \
  --concurrency 20 --duration 30 \
  --p95 500 --max-error-rate 0.01 \
  --header "accept: application/json" --json
```

| Flag | Meaning |
| --- | --- |
| `--url` | Target, `http`/`https`, no embedded credentials (required) |
| `--concurrency` | Parallel workers, 1–200 (default 10) |
| `--duration` | Seconds, 1–300 (default 10) |
| `--p95` | p95 latency objective in ms (default 1000) |
| `--max-error-rate` | Maximum ratio of non-2xx/3xx responses (default 0.01) |
| `--timeout` | Per-request timeout in ms (default 5000) |
| `--json` | Print only the machine-readable summary |

Exit codes: `0` objectives met, `1` invalid usage, `2` objective breached. A run
that completes zero requests is a failure, not a pass.

Output includes request count, throughput, error split (status vs network), and
p50/p90/p95/p99/max latency.

### Baseline procedure

1. Load the portal with representative data. Latency against an empty database
   proves nothing.
2. Warm up for 30 seconds, then measure for 5 minutes at each step:
   concurrency 1, 5, 10, 25, 50.
3. Record p95, p99, error rate and — from `/api/metrics` — `process_cpu` style
   saturation indicators available from the host, plus the `portal_errors_total`
   delta.
4. Stop increasing when p95 exceeds 500ms or the error rate exceeds 1%; that point
   is the capacity knee.
5. Write the numbers and the tested commit into the release notes. Re-run after
   any change to the database schema, the rate limiter, or authentication.

Targets to confirm with the owner: p95 ≤ 500ms for reads, p95 ≤ 1s for writes,
error rate < 1% at expected peak. These are starting assumptions, not measured
SLOs.

### Known limits of the harness

- Single machine, so the client can saturate its own CPU or file descriptors
  before the target does.
- Measures the endpoint you point it at. Point it at the readiness endpoint for an
  availability check and at representative reads for a capacity check; do not
  submit real participant data.
- The portal rate limiter is process-local; a load test against one replica cannot
  tell you what a multi-replica deployment does at the edge.
