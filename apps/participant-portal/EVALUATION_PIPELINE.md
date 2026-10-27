# Ovanite participant portal — evaluation pipeline design

## Current baseline and non-negotiable boundary

The portal records project evidence URLs, versioned terms acceptance, manual validation, rubric-based human evaluation, decisions, and audit events. Branch `mavis` now implements the first automated stage: durable assessment runs, public GitHub repository verification, immutable commit pinning, reviewer-only workflow dispatch, Trivy filesystem scanning, strict callback validation, sanitized finding storage, run history, and an admin panel. This is a first-stage static scanner, not a complete production-readiness pipeline. Do not describe a submitted project as tested, secure, or enterprise-ready just because a static scan completed.

The portal must not fetch candidate URLs or execute candidate code inside the authenticated web process. Submitted repositories, URLs, build scripts, package hooks, container images, and artifacts are untrusted input.

## Rollout sequence

1. **Portal baseline:** limit request bodies; add baseline response headers; prevent API response caching; safely handle malformed/oversized API bodies; add CI gates for typecheck, unit tests, production build, and a Trivy filesystem scan scoped to this app.
2. **Static evidence collection (implemented in v1):** durable run records store submission ID, immutable source revision, pipeline version, requester, start/end time, status, sanitized findings and reviewer-visible workflow evidence. The run history is append-only; repeat runs do not overwrite historical results. The current scanner is Trivy filesystem analysis only.
3. **Source/dependency analysis:** run Gitleaks for exposed secrets; Opengrep rules for SAST; Trivy for dependency vulnerabilities, secrets, misconfiguration and supported licence evidence; generate an SBOM (CycloneDX/SPDX) and retain dependency inventory. Pin tool versions and retain machine-readable reports.
4. **Build and functional verification:** build from an immutable commit in an ephemeral isolated worker; run deterministic tests and Playwright smoke/critical-flow tests against the candidate's isolated staging environment. Store exact commands, environment image digest, logs, test totals, and artifact hashes.
5. **Dynamic security testing:** OWASP ZAP passive/baseline checks only against a verified, explicitly authorized target. Active scans require separate authorization and staging allowlisting. Never scan arbitrary third-party infrastructure.
6. **Performance/reliability:** run k6 only against an explicitly authorized staging deployment with a pre-agreed load ceiling, time window, abort thresholds, and owner contact. Do not run load tests against production or arbitrary candidate URLs by default.
7. **Human gate:** map evidence into the published rubric, show critical findings as hard blockers, allow documented reviewer overrides with actor/time/reason, and keep the final hiring/selection decision human-controlled.

## Current branch implementation status

Implemented in the participant portal branch (not yet production-activated): the `automated_assessment_runs` schema/migration; a staff-only request procedure; strict public GitHub URL parsing and fixed-origin metadata verification; pinned default-branch SHA; dispatch workflow; constant-time callback bearer validation; strict report schema and size limits; per-reviewer five-runs-per-hour quota; active-run de-duplication; sanitized report storage; run history; and the staff-side scan control.

The candidate workflow checks out source at the pinned SHA and treats it as data. Callback secrets are used on separate lightweight jobs and are not passed to the scanner job. Raw Trivy output is not uploaded or persisted. The UI's gate states are only signals: `blocked`, `review`, or `passed` apply to the current scanner set and must not automatically decide hiring or selection.

End-to-end production activation remains pending: review/merge the draft PR; deploy the separate participant portal; apply the additive migration; set the portal and GitHub Actions callback URL/secret consistently; configure a least-privilege workflow-dispatch token; and run an explicitly authorized public test repository through the real deployment. See [ASSESSMENT_CONFIGURATION.md](./ASSESSMENT_CONFIGURATION.md).

## Required isolation controls before candidate code runs

- Separate ephemeral worker or microVM; do not run candidate code in the web server, database host, or privileged runner.
- No production secrets, cloud metadata access, host mounts, Docker socket, SSH keys, or broad GitHub tokens.
- Run as non-root with read-only base filesystem, isolated temporary workspace, CPU/memory/PID/disk/time limits, and automatic destruction after each run.
- Deny outbound network by default. If dependency downloads are needed, use a controlled proxy/cache and explicit allowlist; block loopback, private, link-local, IPv6 local, and cloud metadata destinations at connection time.
- Resolve DNS and re-check every redirect/connection to prevent DNS-rebinding and SSRF; do not trust a URL-only preflight check.
- Use short-lived least-privilege credentials, redact secrets from logs, cap output sizes, and store reports separately from executable artifacts.
- Queue with concurrency limits, retry ceilings, idempotency keys, cancellation, timeouts, and per-submission quotas. Do not execute a scan from a user-controlled webhook without authentication and replay protection.

Containers alone are not a sufficient boundary for deliberately hostile submissions. Select a sandbox/VM boundary based on threat model and hosting capabilities before enabling arbitrary builds.

## Decision model

- Critical exploitable security issue, leaked secret, unauthorized data exposure, or failed identity/permission boundary: hard blocker until reviewed and remediated.
- Keep objective test results separate from reviewer interpretation.
- Score production completeness, security, architecture/maintainability, reliability/operations, performance, UX/accessibility, testing, and handover evidence. Version the rubric; preserve each run and each human decision.
- Missing evidence is unknown/not tested, not a pass. Static tools do not prove that a SaaS product is enterprise-grade.

## Free/open-source and operational reality

Prefer open-source tools and self-hosted execution where feasible. Tool licences may be free, but runner minutes, storage, bandwidth, maintenance, database capacity, and compute are still bounded by the host's limits. This design does not promise unlimited or zero-cost execution. Keep the first release URL-and-repository evidence based; add source execution only after the isolation controls and operational budget are verified.

## Verification checklist

- `pnpm check`, `pnpm test`, and `pnpm build` pass in CI.
- Trivy scans this application for high/critical vulnerabilities, secrets, and misconfiguration.
- Confirm the deployed platform supports the new workflow and that GitHub Actions is enabled; a workflow file is not evidence that a run has passed.
- Configure a verified owner identity and publish approved program terms/rubric before intake. Do not require company incorporation/legalization as an initial product-evidence gate.
- Keep rate limiting at the authenticated API and edge/gateway boundary as a launch blocker. A process-local limiter alone is not reliable across multiple instances/serverless deployments.
