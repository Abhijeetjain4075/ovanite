# Ovanite Portal — Implementation Outcomes

This file is the project ToDo fallback because no native project ToDo tool is available. Each outcome preserves the user-approved product acceptance criteria. Do not mark an outcome complete without implementation evidence.

## [x] Participant portal, submissions, and lifecycle records

- Implement `/submit` as an authenticated submission wizard with clear eligibility and terms before final submission; collect participant name, email, country, optional profile/portfolio URL, project name, short description, problem solved, category, repository URL, live/demo URL, documentation URL, demo video URL, technology stack, and project status.
- Do not require full source-code upload initially. URLs are the primary evidence; optional build/package artifact can be supported later.
- Require explicit checkbox acceptance that the participant owns or has rights to submit; has no known third-party rights violations; read and accepted current Ovanite program terms; understands submission does not itself guarantee selection, funding, employment, partnership, publication, or any other outcome; and authorizes Ovanite to evaluate under program rules. Record the exact terms version and acceptance timestamp.
- Implement `/my-submissions` with the participant's submissions, status, timestamps, accepted terms version, and next action. Implement `/submission/:id` with the detailed submission record, validation/evaluation status, submitted materials, acceptance record, and permitted updates/withdrawal.
- Provide strong empty/loading/error/success states and mobile-first responsive UX; preserve drafts without accidental loss; support keyboard navigation, labels, validation messaging, focus management, contrast, and confirmation for destructive actions.
- Use immutable submission IDs and record participant identity, project metadata/material URLs, `submitted_at`, `terms_version`, `terms_accepted_at`, validation results, evaluation results, decision and decision timestamp, status history/audit events, evaluator identity/role, withdrawal record, and timestamps.
- Enforce the lifecycle `draft -> submitted -> terms_accepted -> validation -> evaluation -> eligible / not_eligible -> selected / rejected -> withdrawn / archived`; do not permit invalid state transitions and keep an audit trail for status changes and decisions.

## [x] Ovanite admin queue, review, and permissions

- Implement `/admin/submissions` as a searchable/filterable queue by lifecycle status, category, date, participant, and project.
- Implement `/admin/submissions/:id` as a complete review workspace with project materials, declarations, terms version, validation checks, evaluator notes/results, decision history, and audit trail.
- Implement `/admin/evaluations` as a structured evaluation queue and rubric workspace.
- Implement `/admin/terms` as versioned program terms/declarations management with draft/published/retired states and immutable accepted-version history.
- Support owner/editor/viewer roles with server-side authorization: viewer must be read-only; editor can review but must not receive owner-only administration powers. Protect submissions and participant data; do not expose submissions or analytics publicly.
- Add sensible anti-abuse controls, validation, URL normalization, duplicate detection, and clear error handling. Design for server-side authorization, not just UI restrictions.

## [x] Configurable evaluation, terms, and immutable auditability

- Create a configurable rubric rather than hardcoding a single winner. Include problem clarity, product completeness, usability, technical quality, originality, documentation, reliability/security, and evidence quality; support configurable weights and evaluator notes.
- Show criterion-level results and an overall evaluation record without implying the tool guarantees selection or making unsupported promises.
- Treat terms as first-class versioned content that authorized admins can edit/version; accepted versions remain immutable. Do not silently invent legal guarantees. Use concise placeholder/declaration copy only where necessary and clearly mark legal text as configurable.
- Record audit history for allowed status changes and decisions and preserve immutable submission IDs, accepted terms version/timestamp, evaluator identity/role, decision timestamps, and withdrawal records.

## [x] Product quality, integration, and documentation

- Preserve existing public Ovanite pages and identity; integrate conceptually with the current Ovanite website and admin experience. Do not replace the site, and do not depend on an unrelated new stack; adapt to the project architecture. If the existing repository/identity assets are unavailable, document that boundary rather than claiming a live integration.
- Build a production-oriented information architecture; provide accessible, mobile/desktop responsive UX, robust loading/error/empty states, privacy boundaries, deterministic state transitions, auditability, and minimal personal-data collection.
- Include a concise README/specification for the feature and testable acceptance criteria in implementation notes.
- Preserve drafts and participant data; confirm destructive actions; maintain an accurate `/manus-routes.json` page manifest for all implemented routes.

## [x] Automated static-assessment v1 (code and CI implemented; activation still requires deployment configuration)

- Persist each assessment run, immutable public GitHub repository revision, requester identity/role, pipeline version, status, workflow URL, sanitized summary, and capped finding records in additive database migration `0002_automated_assessment_runs`.
- Restrict assessment dispatch to owner/editor reviewer procedures; reject non-GitHub repository URLs, non-public/archived repositories, and unsupported submission states.
- Pin assessment to a full 40-character commit SHA before dispatch; make fixed-origin `api.github.com` metadata requests only (never fetch the submitted URL directly).
- Run Trivy filesystem vulnerability, secret-pattern, misconfiguration, and license checks on GitHub-hosted ephemeral runners; generate a CycloneDX SBOM with its digest and component count; never execute candidate build scripts, package hooks, tests, or application code in this v1.
- Validate callback bearer credentials with constant-time comparison, validate callback payloads against strict schemas, confirm run ID, source repository and SHA, bind run ID to the workflow URL, cap report size and finding count, and audit monotonic lifecycle updates.
- Run scanner/source processing on a separate runner from callback secrets; persist only sanitized report data and do not retain scanner secret matches/code excerpts.
- Add per-reviewer transactional quota: five new assessment requests per rolling hour, plus deduplication of active runs for each submission.
- Add admin review UI to request a scan, poll active run state, view immutable SHA and findings, and distinguish the scanner gate signal from a human decision.
- Typecheck, unit tests, production build, Trivy workflow CI, and static-assessment callback/dispatch workflow must pass before activation.

## [ ] Automated static-assessment production activation and next-stage verification

- The candidate assessment workflow is now present on the default branch. Verify live dispatch and callback only after the separate portal, database migration, authentication, callback credentials, and HTTPS portal URL have been configured; workflow presence alone is not an end-to-end test.
- Apply the reviewed additive migration in the actual participant-portal database; do not reset or seed production data.
- Deploy the participant portal itself with valid existing authentication and database configuration; the marketing site deployment alone does not prove that this separate portal is deployed.
- Configure the least-privilege GitHub Actions dispatch token, matching callback secret, portal HTTPS base URL, and GitHub Actions variable/secret; verify a callback round-trip using an explicitly authorized public test repository.
- Add stale-run recovery and operator-visible handling for cancelled or callback-lost workflow runs before wide intake.
- Add SBOM generation, a separately isolated Opengrep/Gitleaks pass, retained test evidence, then Playwright functional verification against an authorized isolated staging target.
- Only after a reviewed sandboxed runner design, add builds/tests with network egress denied by default. Dynamic ZAP and k6 checks require explicit scope/authorization and must not run against arbitrary third-party targets or production.
- Add a persistent edge/gateway rate limit for general public API traffic; the per-reviewer scan quota is not a replacement for general API rate limiting.

## [ ] First-run Ovanite owner and approved program configuration

- Before participant intake is opened, provision the exact verified owner `openId` in protected runtime settings as `OWNER_OPEN_ID`. A database role assignment alone is not owner proof, and a missing setting must not auto-elect a fallback owner. Verify production database state/connectivity through readiness before launch; do not rely on an old preview database count or auto-promote the first login.
- The authorized owner must publish Ovanite-approved program terms and a rubric. Until approved terms are published, final submissions must remain fail-closed; placeholder language must not be treated as approved.
