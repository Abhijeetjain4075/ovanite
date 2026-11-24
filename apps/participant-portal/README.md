# Ovanite Participant Submission & Evaluation Portal

A private, evidence-led portal for builders to submit software and follow structured Ovanite validation and evaluation. The product uses the initialized repository's React, Express, tRPC, Drizzle, MySQL, and Manus OAuth infrastructure. It is a separate portal surface: the original Ovanite public website and live `/admin` repository were not present in the sandbox, so this project preserves that boundary and is designed to connect through an existing-site portal link or an agreed route mount when the production repository is available.

> **Software, built to matter.**

## Participant routes

| Route | Purpose |
| --- | --- |
| `/` | Authenticated participant overview and private record summary; no public analytics. |
| `/submit` | Three-step submission wizard, server-saved draft, project evidence, current versioned terms, five explicit declarations, and final review. |
| `/my-submissions` | Participant's own submissions with lifecycle status, timestamps, accepted terms version, and next action. |
| `/submission/:id` | Participant-owned materials, progress, accepted-version record, history, permitted early project edits, and confirmed withdrawal. |

The project evidence fields are repository, live/demo, documentation, and demo-video URLs. At least one evidence link is required at final submission. Source-code uploads are not required. The authenticated participant supplies name, email, country/region, and optional profile/portfolio URL. Drafts are saved server-side and final submission records the exact current terms version, acceptance timestamp, and declaration booleans. Project-detail edits are only allowed while a submission is in `terms_accepted`; the terms acceptance record cannot be changed. Participants can withdraw during active review; withdrawal appends a record and does not erase submission history.

## Ovanite staff routes

| Route | Purpose |
| --- | --- |
| `/admin/submissions` | Private server-filtered queue by status, category, date, participant, and project. Drafts are excluded. |
| `/admin/submissions/:id` | Review workspace with evidence, declarations, exact terms, manual validation, criterion scores/notes, decisions, and actor-stamped audit events. |
| `/admin/evaluations` | Evaluation queue plus configurable rubric version workspace. |
| `/admin/terms` | Draft/published/retired terms management and immutable accepted-version history. |

Only the identity whose provider `openId` exactly matches the configured `OWNER_OPEN_ID` receives owner privileges. A missing or blank `OWNER_OPEN_ID` never elects a fallback owner. Legacy project-admin flags do not grant portal staff access; a user must receive an explicit `editor` or `viewer` assignment from the configured owner. A stale persisted `portalRole: "owner"` value is treated as `participant` unless the identity exactly matches the configured owner. Staff role changes are owner-only, update both `users.portalRole` and the legacy `users.role` flag in the same transaction, and append an audit event. No client-only role toggle exists.

### First-run access prerequisite

The source-transfer notes recorded zero users in the then-current managed preview database, but that is not evidence that a production database is provisioned or empty. Production database connectivity and state must be verified by the deployed readiness probe before launch. This implementation intentionally does not promote the first login to owner. Before participant intake is opened, configure `OWNER_OPEN_ID` in protected runtime settings with the authorized Ovanite owner's verified Manus `openId`; this exact identity match is mandatory for owner privileges. Assigning `users.portalRole = 'owner'` alone is insufficient and must not be used as a fallback. The verified owner must then publish approved program terms and a rubric. Until a terms version is published, final submissions fail closed; placeholder legal text must not be treated as approved.

## Lifecycle and decisions

Allowed transitions are enforced in server code (`server/portal/lifecycle.ts`) and repeated in the database-backed admin procedures:

| From | Allowed next state |
| --- | --- |
| `draft` | `submitted` |
| `submitted` | `terms_accepted` |
| `terms_accepted` | `validation`, `withdrawn` |
| `validation` | `evaluation`, `withdrawn` |
| `evaluation` | `eligible`, `not_eligible`, `withdrawn` |
| `eligible` | `selected`, `rejected`, `withdrawn` |
| `not_eligible` | `rejected`, `withdrawn` |
| `selected`, `rejected`, `withdrawn` | `archived` |
| `archived` | No further transitions |

Final submission and acceptance are stored in one transaction, with separate `submitted` and `terms_accepted` audit events. Moving into evaluation requires a passing, recorded validation result. Recording `eligible`, `not_eligible`, `selected`, or `rejected` requires a submitted rubric evaluation. The server rejects skipped, reversed, or otherwise invalid transitions. Decision actor, role, note, and timestamp remain in the decision/event record.

## Evaluation rubric

The configurable baseline contains problem clarity, product completeness, usability, technical quality, originality, documentation, reliability/security, and evidence quality. It uses integer weights totaling 100% and a 0–5 criterion score. Each evaluation stores the exact rubric version, scores, criterion-level notes, overall evaluator notes, evaluator identity/role, weighted score, and timestamp. Published rubrics are immutable; a later rubric version applies only to future evaluations. A score is evidence for a human decision, not a promise of selection.

## Terms and declarations

The first draft text is visibly marked **configurable placeholder—not approved legal language**. Replace it with approved Ovanite program terms before publishing. Publishing retires the previous published version but does not edit or delete its text; submissions continue to reference their exact accepted version and timestamp. The required declarations are separately stored as five explicit booleans: submitter rights, no known third-party-rights violations, no guaranteed selection/funding/employment/partnership/publication/other outcome, authorization to evaluate under published rules, and acceptance of the current terms.

## Data protection and security boundaries

- Manus OAuth/session handling remains the starter's real authentication implementation; unauthenticated use is not replaced with a fake preview user.
- Submission reads and writes check participant ownership on the server. A missing or foreign participant submission returns the same not-found response.
- Staff procedures enforce the separate `portalRole` on the server. UI route visibility is not authorization.
- Admin queue queries exclude drafts; participant records, status details, evaluation notes, decisions, and audit events are authenticated and private.
- URL validation permits only well-formed `http`/`https` syntax and strips fragments; embedded credentials and other schemes are rejected. The portal does not fetch user URLs, execute submitted code, or accept source archives, avoiding SSRF and artifact-execution risk.
- Normalized repository URLs are duplicate-checked with a generic conflict message that does not reveal another submitter or record.
- Sensitive data is not rendered into public pages. Avoid logging submission payloads. Use explicit validation/error states and rate-limiting integration at the server/gateway boundary before broad public launch.
- Status, terms, rubric, validation, evaluation, decision, and withdrawal actions use additive audit events. No participant-facing delete path is provided.

## Automated static assessment (v1)

The admin review workspace now includes an automated static-assessment request/history panel. The v1 flow is:

1. An owner/editor reviewer requests a scan for a submission in `terms_accepted`, `validation`, or `evaluation`.
2. The server accepts only a strict public GitHub repository URL, verifies that the repository is active and public through fixed-origin `api.github.com` calls, resolves its default branch to a full commit SHA, and stores a durable run record.
3. A repository-scoped GitHub Actions token dispatches `.github/workflows/candidate-static-assessment.yml` with the repository, immutable SHA, submission ID, and assessment-run ID.
4. The worker checks out the pinned source as data and runs Trivy filesystem checks for dependency vulnerabilities, exposed-secret patterns, supported misconfiguration findings, and license findings. It also generates a CycloneDX SBOM with a SHA-256 digest and component count. The worker does not run candidate build scripts, package hooks, tests, or applications.
5. A separate lightweight workflow job sends a strict-schema callback with a sanitized report. The callback checks its bearer secret in constant time, validates the run ID and source SHA, bounds report size/finding counts, stores the report, and appends an audit event.
6. The reviewer panel displays run status, pinned commit, counts, gate signal, sanitized findings, and the workflow run link. Each run remains a historical record for its exact source SHA and pipeline version.

The current gate signal is an evidence triage aid: critical/high findings or detected secret patterns mark a run `blocked`; medium/low, unknown-severity, license, or configuration findings may require `review`; a clean static result is `passed` for this scanner set only. A completed scan is not a hiring decision and does not prove a SaaS product is enterprise-ready. The workflow retains sanitized report and CycloneDX SBOM artifacts for 30 days; raw Trivy JSON is not uploaded or stored because secret scanners may include matched source material.

### Activation prerequisites

The candidate static-assessment workflow is present on the repository's default branch at `.github/workflows/candidate-static-assessment.yml`. Its presence does not prove that live dispatch/callback works. End-to-end dispatch still requires the separate participant portal to be deployed with working authentication and database configuration, the reviewed additive migration to be applied safely, and the matching server/repository configuration described in [ASSESSMENT_CONFIGURATION.md](./ASSESSMENT_CONFIGURATION.md) to be set and verified.

Required server settings are `OVANITE_GITHUB_ACTIONS_TOKEN` (fine-grained, repository-scoped Actions dispatch permissions), `OVANITE_ASSESSMENT_CALLBACK_SECRET`, `OVANITE_ASSESSMENT_PORTAL_BASE_URL`, and optionally `OVANITE_ASSESSMENT_WORKFLOW_REF` (default `main`). The matching GitHub repository variable `OVANITE_ASSESSMENT_PORTAL_BASE_URL` and secret `OVANITE_ASSESSMENT_CALLBACK_SECRET` are required for callbacks. Do not expose these values to client code.

There is a durable quota of five new assessment requests per staff account per rolling hour, plus active-run reuse for the same submission. This protects the scan endpoint, but it does not replace general application/edge rate limiting.

### What is not automated yet

The current v1 does not implement full production-readiness testing, candidate builds or test execution, a hardened build sandbox, Playwright functional tests, independent Opengrep/Gitleaks passes, OWASP ZAP, or k6. It does generate a CycloneDX SBOM; that inventory is not proof of full license compliance or enterprise readiness. The next stages are documented separately. Do not execute candidate source code until a disposable isolated worker with resource limits, no production secrets, restricted egress, SSRF/DNS-rebinding protections, and output caps is in place. Dynamic scans and load tests require explicit target authorization and staging allowlisting.

## Data model and implementation notes

`drizzle/schema.ts` defines `users.portalRole`, `terms_versions`, `submissions`, `rubric_versions`, `validation_results`, `evaluations`, `decisions`, `withdrawals`, and `portal_audit_events`. `drizzle/` stores additive, deterministic migrations. `server/portal/` contains role policy, lifecycle transitions, input validation, rubric/terms defaults, and protected procedures. `client/src/pages/` contains participant and admin route screens. `client/public/manus-routes.json` lists the page routes. `TODO.md` keeps the full approved product acceptance clauses.

The current preview/dev database and published application share the managed database. Apply reviewed additive migrations intentionally; do not reset or seed production participant data during development. Migrations must not delete or rewrite accepted history. For higher-assurance deployment, use native row-level data authorization or equivalent service-layer tests for each staff/participant role, enforce rate limits at the gateway/application boundary, and complete legal copy review before publishing terms.

## Testable acceptance criteria

1. A logged-out user sees real sign-in and no fabricated identity; authenticated participants can only list, retrieve, edit, or withdraw their own submissions.
2. Participant intake validates identity/contact fields, project description/category/stack/status, and at least one safe HTTP(S) evidence URL; drafts survive navigation/reload and display save/error state.
3. Final submission requires all five declarations and the current published terms version; the exact version, acceptance time, and declaration set are stored with a stable submission ID.
4. Participant list/detail screens show status, timestamps, next action, evidence, acceptance history, validation/evaluation progress, and only permitted edits/withdrawal; a foreign ID is indistinguishable from a missing ID.
5. Admin queue filters on status/category/date/participant/project and excludes drafts. Review detail provides all requested materials/declarations/terms/validation/evaluation/decision/audit records.
6. Only the configured owner can provision staff or configure/publish terms and rubrics; accepted terms text and published rubric versions cannot be overwritten. Editors can review/evaluate but cannot use owner-only operations; viewers are read-only; participants receive `FORBIDDEN` from staff-only procedures. Demoting/revoking a legacy project administrator must clear both the portal role and legacy admin flag.
7. The state transition table rejects skipped/reversed/terminal changes; evaluation requires a passing validation and decisions require a submitted evaluation; status/decision/withdrawal actions append actor/time audit records.
8. Empty/loading/error/success states are present; labels, keyboard focus, contrast, reduced-motion behavior, and mobile navigation/form/table reflow are usable.
9. `GET /manus-routes.json` returns valid JSON with every current participant/admin page and its dynamic ID patterns.
10. `pnpm check`, `pnpm test`, and `pnpm build` pass after the project migrations and implementation are complete.

## Integration seam

No existing Ovanite repository or brand assets were available in the sandbox. This portal keeps the provided Ovanite tagline, restrained wordmark treatment, light technical visual system, and route conventions. When the existing site/admin repository is available, integrate this feature by mounting the participant routes under the agreed portal path, reuse the official identity assets and shared admin shell, and map the portal role/session policy to its existing staff membership model. Do not copy participant data to a public analytics surface.

## Security controls and operations

These controls are enforced in code and covered by the test suite:

| Control | Location | Configuration |
|---|---|---|
| Global API rate limiting (sliding window) | `server/_core/rateLimit.ts`, mounted in `server/_core/index.ts` | Keyed per client IP and per surface: `callback` 60/min, `auth` 30/min, `read` 300/min, `write` 120/min. Health probes and static assets are exempt. Responses use `429` + `Retry-After`. |
| Trusted proxy handling | `server/_core/index.ts` | `TRUST_PROXY_HOPS` (default `0`). Set only behind a known reverse proxy; a spoofable `X-Forwarded-For` would defeat per-IP limits. |
| Bearer session fallback | `server/_core/sdk.ts` via `ENV.allowBearerSessionFallback` | Disabled by default. Enabled automatically only for explicit `development` or `test` modes; any other environment requires `OVANITE_ENABLE_BEARER_FALLBACK=true`. HttpOnly session cookies remain the default. |
| Owner-only staff provisioning | `portal.staff.list` / `portal.staff.assignRole`, policy in `server/portal/staff.ts` | Only the configured owner may assign `editor`, `viewer` or `participant`. The owner identity cannot be rewritten through the database, and self-changes are refused. Every change writes a `staff_role_assigned` audit event. |
| Redacted operational logging | `server/_core/redact.ts` | Database/OAuth/notification/storage operational logs use fixed operation names plus allowlisted error name/code/category. Exception messages, SQL, hosts, response bodies, credentials and bound values are omitted. |
| Storage object-key validation | `server/_core/storageKeys.ts`, used by `server/storage.ts` and `server/_core/storageProxy.ts` | Keys forwarded to the presign endpoint and to the public `/manus-storage/*` redirect are normalized and checked first: `..`/`.` segments, absolute or over-long keys, backslashes, URL schemes, query/fragment syntax, control characters, empty segments and characters outside `A-Za-z0-9._-` are refused with `400`. Rejections never echo the submitted value. |
| Session token claim requirements | `server/_core/sdk.ts` | Sessions are verified with a pinned `HS256` algorithm, required `exp` and `iat` claims, and a 5-second clock tolerance. A token missing either timestamp is rejected even if its signature is valid. |
| Transport security headers | `server/_core/index.ts` | All responses set `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin` and a restrictive `Permissions-Policy`; `NODE_ENV=production` additionally sets `Strict-Transport-Security: max-age=15552000` (no `includeSubDomains`, so sibling HTTP-only hosts cannot be pinned). |

### Audit log integrity

`portal_audit_events` is hash-chained. Every event is appended through
`server/portal/auditChain.ts`, which reads the current tail with `FOR UPDATE` inside the
caller's transaction, hashes a canonical serialization of the event with the predecessor's
hash, and stores both `prevHash` and `hash` (migration `0003_portal_audit_hash_chain`).

- Appending must use the transaction that performs the audited change. All 20 write sites in
  `router.ts` and `assessmentCallback.ts` do; an append on the bare pool would still work but
  would not serialize against concurrent writers.
- `portal.audit.verify` (owner only) recomputes the chain and reports the first event id that
  no longer matches, distinguishing a broken link (`missing_predecessor`, e.g. a deleted row)
  from edited content (`hash_mismatch`).
- Rows created before the chain have a null `hash` and are reported as `legacyEvents`; they
  cannot be verified retroactively and the chain restarts after them.
- The chain makes tampering detectable, not impossible: whoever controls the database can
  rewrite the whole chain. Anchor the latest `hash` somewhere outside the database (release
  notes, an external log sink) if that matters for your compliance scope.

Apply the schema change with `pnpm db:migrate` before deploying this revision.

The rate limiter is process-local and bounded (50k tracked buckets). A multi-instance
deployment must additionally enforce limits at the edge/gateway; the in-process layer
is not a substitute for that. Automated assessment retains its separate durable
five-requests-per-staff-account-per-rolling-hour quota.
The rate limiter is process-local and bounded to 50k tracked buckets, including a reserved shared overflow bucket per surface. Expired buckets are reclaimed; unique-IP churn cannot evict active client buckets, and new keys share the overflow bucket at capacity. It covers both `/api` routes and the signed storage-proxy surface. Its sliding-window clock is monotonic within a process, and API path matching is normalized to match Express case-insensitive routing. It is not a distributed quota: multi-instance deployments must enforce equivalent limits at a shared edge/gateway. `TRUST_PROXY_HOPS` is strictly parsed and defaults to zero; configure it only when the origin is reachable exclusively through the stated trusted proxy chain. Automated assessment retains its separate durable five-requests-per-staff-account-per-rolling-hour quota.

Newly issued portal session JWTs expire after 12 hours. This bounds exposure but does not provide immediate per-token revocation: a stolen token remains usable until expiry unless the signing secret is rotated. A server-side session registry/revocation design remains a separate release-hardening item.
