# Production readiness

This document is the release gate, not a marketing page. It records what the
repository can prove today, what it cannot, and who has to supply the difference.

Status is deliberately blunt: a green CI run proves the code and its gates, never
that a service is deployed, financed, monitored or lawful.

## Evidence table

| Area | Status | Evidence |
| --- | --- | --- |
| Backend type checking, lint, stable-state compatibility | Ready | `mops check backend` in the backend quality workflow |
| Backend contract parity (DID ↔ generated IDL ↔ actor wrapper, names and query/update modes) | Ready | `scripts/verify-backend-contract-parity.mjs` |
| Backend authorization behaviour (owner, editor, viewer, OQL leakage, link sanitization) | Ready | Disposable local ICP network steps in the backend quality workflow |
| Backend deployment to a real network | **Not done** | No funded canister; `ownerPrincipalText` is still `null` |
| Frontend typecheck, lint, unit tests, production build | Ready | Frontend quality workflow |
| Frontend runtime configuration fails loudly | Ready | `src/frontend/src/lib/runtimeConfig*.ts`, console error + visible panel on a deployed origin |
| Frontend deployability gate | Ready | `node src/frontend/scripts/verify-runtime-config.mjs` (release gates workflow verifies both refusal and acceptance) |
| Production preflight (owner principal, canister id, backend host, portal secrets) | Ready and armed | `node scripts/preflight-production.mjs --self-test` |
| Participant portal typecheck, unit tests, build | Ready | Participant portal quality workflow |
| Dependency, secret and configuration scanning | Ready | `security.yml`, Trivy `vuln,secret,misconfig` for all three trees, HIGH/CRITICAL, `ignore-unfixed` |
| SBOM | Ready | CycloneDX artefacts for all three trees, weekly rescan |
| Structured error tracking | Ready (code) | `server/_core/errorTracking.ts`; needs `RELEASE` and optionally `ERROR_WEBHOOK_URL` |
| Metrics | Ready (code) | `/api/metrics` with bearer token; hidden without `METRICS_TOKEN` |
| Browser E2E smoke | Ready | `src/frontend/e2e/smoke.spec.ts` against `vite preview` |
| Load test harness | Ready (harness only) | `scripts/load-test.mjs`; no target has been measured |
| Backup and retention procedure | Documented | `docs/operations/backup-and-retention.md`; no automated backup exists |
| Alerting | **Not done** | Thresholds documented in `docs/operations/observability.md`; no metrics backend or alert route is provisioned |
| Legal copy | **Not done** | `privacyBody` / `termsBody` still seed `null` |
| Branch protection, secret scanning at the org level, owner-only approvals | **Not done** | Repository settings, not code |
| Production deployment | **Not done** | Blocked on owner inputs below |

## Gates and what they refuse

| Command | CI workflow | Refuses |
| --- | --- | --- |
| `node scripts/preflight-production.mjs` | `release-gates.yml` (self-test) | A deploy where the Motoko owner principal is `null`/invalid, the frontend runtime config still holds placeholders, or a required portal secret is missing |
| `node src/frontend/scripts/verify-runtime-config.mjs` | `release-gates.yml` | Publishing a bundle whose `env.json` cannot reach a backend |
| `pnpm --dir src/frontend build` with `--require-deployable` | release pipelines | Writing a non-deployable `dist/env.json` |
| `node scripts/generate-backend-sbom.mjs --check` | `security.yml`, `release-gates.yml` | An empty or unparseable Mops lockfile graph |
| `node scripts/load-test.mjs …` | `load-test.yml` (manual) | A target that breaches p95 or error-rate objectives; the lane refuses a non-HTTPS target |
| `pnpm --dir src/frontend exec playwright test` | `frontend-quality.yml` | A broken bundle, routing regression, or runtime-config failure |
| Trivy scans | `security.yml` | HIGH/CRITICAL vulnerable dependency, committed secret, or insecure configuration |

`--self-test` is the important one: CI asserts that the preflight **refuses** the
current unconfigured repository. A gate that cannot fail is not a gate.

## Owner-only inputs still required

1. **Owner Internet Identity principal** — the canonical textual principal to put
   in `src/backend/lib/admin.mo` (`ownerPrincipalText`). Without it, ownership can
   never be claimed and the admin surface stays inert.
2. **Backend canister id and funding** — the deployed canister principal for
   `OVANITE_BACKEND_CANISTER_ID`, plus cycles and controller custody.
3. **Runtime origin** — the final public origin(s) for `OVANITE_II_DERIVATION_ORIGIN`
   and any additional frontend origins the backend must allow.
4. **Portal secrets** — `DATABASE_URL` (managed MySQL with backups), `MANUS_PROJECT_ID`,
   `OWNER_OPEN_ID`, `MANUS_JWT_SECRET` (≥32 chars), `MANUS_OAUTH_API_URL`, and the
   optional `METRICS_TOKEN`, `ERROR_WEBHOOK_URL`, `RELEASE`.
5. **Legal copy** — reviewed privacy policy and terms, published through the admin
   surface.
6. **Operational services** — a metrics backend with alert routes, log retention,
   an uptime monitor, and a backup destination with a retention policy.
7. **Repository governance** — required checks on `main`, owner-only approval, and
   secret scanning. These are settings, not files.

## Release sequence once the inputs exist

1. Set the owner principal; run `mops check backend`, `mops build backend`, and the
   backend quality workflow.
2. Set the frontend and portal secrets; run
   `node scripts/preflight-production.mjs` and require exit `0`.
3. Deploy the backend to the funded canister; verify the public reads and the
   owner claim against the real network (not a local replica).
4. Apply portal migrations; confirm `/api/health/ready` returns `200`.
5. Deploy the frontend with `OVANITE_BACKEND_CANISTER_ID` and
   `OVANITE_BACKEND_HOST` set; confirm the deployed `env.json` contains no
   `undefined` values and that `intake_api_origin` points at the intake service
   whose `ALLOWED_ORIGINS` contains this exact origin (see
   [`services/intake/README.md`](../services/intake/README.md)).
6. Run the E2E smoke lane against the deployed origin, then a baseline load test.
7. Confirm `/api/metrics` responds with the token and that the first alerts fire
   during a deliberate failing probe.
8. Take a logical database dump, a canister snapshot, and record both object keys
   against the release tag.
9. Only then announce the release.

## Definition of done for "production ready"

All of the following, simultaneously:

- preflight exits `0` with the real values;
- the deployed frontend's `env.json` has zero placeholders and the deployed origin
  sets no `runtimeConfigError` marker (neither `degraded` nor `failed`);
- `/api/health/ready` is `200` and `/api/metrics` is scraped successfully;
- E2E smoke passes against the deployed origin;
- one restore drill and one load baseline have been completed and written down;
- legal copy is published;
- backup, alerting and retention are owned by a named person.

Until then the honest answer is: the code and its gates are hardened; the service is
not deployed or operated.
