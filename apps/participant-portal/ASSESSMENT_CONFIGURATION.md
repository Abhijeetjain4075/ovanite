# Automated assessment v1 — activation and operations guide

## Current implementation boundary

The participant portal branch implements durable assessment-run records, server-side staff authorization, public GitHub revision pinning, workflow dispatch, a schema-validated callback, sanitized result storage, and a staff review panel. The candidate workflow runs Trivy filesystem checks for dependency vulnerabilities, secret patterns, supported misconfigurations, and license findings, and generates a CycloneDX SBOM whose SHA-256 digest and component count are recorded in the report.

It does **not** run candidate build scripts, package lifecycle hooks, tests, or applications. This is intentional: candidate repositories are untrusted code. No candidate repository is fetched directly by the portal server; it uses fixed-origin `api.github.com` metadata calls to verify a public GitHub repository and resolve its default branch to a full commit SHA.

The source assessment workflow must exist on the configured default branch and the callback must be reachable from the deployed participant portal before the feature can run end to end. This guide does not claim that the separate participant portal is currently deployed or that production credentials have been configured.

## Required database migration

Apply the additive migration to the actual participant-portal MySQL database from the portal app directory:

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm build
pnpm db:migrate
```

Review the deployment/database target before running `pnpm db:migrate`. Do not use `pnpm db:push` as an improvised production migration path, and do not reset/seed the shared database. Migration `0002_automated_assessment_runs.sql` creates a new history table; it does not rewrite participant submissions or accepted terms history.

## GitHub configuration

The portal runtime needs `OVANITE_GITHUB_ACTIONS_TOKEN`, configured as a server-side secret—not a browser variable. Use a fine-grained token restricted to `Abhijeetjain4075/ovanite` with only the permissions needed to dispatch Actions workflows (`Actions: read/write`; repository metadata access is also required). Do not use a broad personal access token with unrelated repository access.

The portal must also have these runtime values:

- `OVANITE_ASSESSMENT_CALLBACK_SECRET`: a unique random secret of at least 32 bytes.
- `OVANITE_ASSESSMENT_PORTAL_BASE_URL`: the actual deployed participant portal HTTPS base URL, including any path prefix required by its router and without query/hash credentials.
- `OVANITE_ASSESSMENT_WORKFLOW_REF`: the trusted branch/ref containing the workflow; default is `main`.

For example, generate a strong random secret with `openssl rand -hex 32`, then store it in the deployment secret manager. Do not put its value in source control, client configuration, build logs, issue comments, or this guide.

In the GitHub repository's Actions configuration, set:

- **Repository variable** `OVANITE_ASSESSMENT_PORTAL_BASE_URL`: the same HTTPS participant portal base URL.
- **Repository Actions secret** `OVANITE_ASSESSMENT_CALLBACK_SECRET`: exactly the same random secret as the portal runtime setting.

The callback secret is delivered only to separate lightweight workflow jobs that mark a run started or return its sanitized result. It is not set in the job that checks out and scans candidate source. The scanner job has read-only repository permissions, checks out a public repository at the pinned SHA without persisting checkout credentials, and does not execute files from that repository.

The candidate workflow must first exist on the Ovanite repository's default branch before the portal's workflow-dispatch API can reliably start it. Since code changes are in a draft PR on `mavis`, do not expect live dispatch to work until the PR has been reviewed/merged and deployment/migration/configuration are completed. Do not merge without the owner's review approval.

## How to verify after activation

1. Confirm the portal's OAuth/session, database connection, and owner/editor role mapping work in the actual deployment.
2. Publish owner-approved program terms and rubric before public intake.
3. Use an explicitly authorized, public, non-sensitive test repository.
4. Confirm the reviewer-only “Run static assessment” action creates a durable run record, pins the expected default-branch SHA, dispatches the GitHub workflow, and records the workflow URL.
5. Confirm the callback moves the run from dispatched/running to completed or failed and writes an audit event.
6. Confirm findings contain only sanitized metadata. Secret values, matched source excerpts, raw scanner JSON, access tokens, environment variables, and full source archives must never be persisted or rendered into the admin UI.
7. Verify a duplicate request reuses an active run, the per-reviewer five-runs-per-hour quota is enforced across concurrent requests, viewer/participant calls are forbidden, malformed callbacks fail closed, and a wrong run ID or source SHA is rejected.
8. Confirm the Trivy job scans the exact pinned commit, has no callback secret, and never runs the candidate's build/test scripts. Review the workflow artifact retention policy and delete artifacts under the applicable retention schedule.

## Interpreting outcomes

- **Completed / passed:** the configured static checks returned no findings captured by the current policy. This is not proof that the software is secure or enterprise-ready.
- **Completed / review:** human review is needed for findings such as medium/low issues or configuration concerns.
- **Completed / blocked:** critical/high findings or detected secret patterns require review and remediation before advancing; this is an assessment signal, not an automatic hiring rejection.
- **Failed / not assessed:** the worker could not produce a trustworthy scan result. It is not a pass.
- **Truncated report:** the database retains at most 200 sanitized findings per run for UI safety. Summary counts include all parsed scanner findings; the sanitized workflow artifact is retained for 30 days. Raw Trivy JSON is not uploaded or persisted because secret scanners may include sensitive match material.

The current run history is immutable evidence for a particular SHA and pipeline version. A new code revision should receive a new assessment run; do not replace an older report in place.

## Resource and security limits

This stage is deliberately static-only and is subject to GitHub Actions minutes/concurrency and hosting limits. Open-source scanners have no licence fee for typical use, but hosted compute, bandwidth, storage, database capacity, and operations are not unlimited/free by definition.

General public API rate limiting at the application gateway is still required before broad intake. The assessment endpoint has a durable per-reviewer quota, but that is not a substitute for global authentication, abuse, or request-rate controls.

Future build/test workers must be separately designed as disposable isolated VMs/microVMs or an equivalently strong boundary; non-root, no production secrets, resource limits, output caps, network egress denied by default, and SSRF/DNS-rebinding controls are required before candidate code can execute. Do not add active ZAP scans or k6 load tests without explicit authorization, staging allowlisting, and abort limits.
