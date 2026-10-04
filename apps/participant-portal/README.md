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

The owner can create and publish rubric and terms versions; editors can review and evaluate but cannot perform owner-only administration; viewers can read staff records but cannot change them. Ordinary participants cannot call staff procedures. The configured project owner identity (`OWNER_OPEN_ID`) is preferred; other staff assignments live in `users.portalRole` and must be provisioned by the existing authorized operator workflow. If an owner identity is not configured, a trusted existing project-admin account can bootstrap owner functions; with a configured owner, other legacy project admins receive editor-only review access. Explicit viewer/editor portal roles always take precedence. No client-only role toggle exists.

### First-run access prerequisite

The managed database currently has **zero registered users**, and `OWNER_OPEN_ID` is not configured. This implementation intentionally does not promote the first login to owner. Before participant intake is opened, configure `OWNER_OPEN_ID` with the authorized Ovanite owner's Manus identity through protected project runtime settings, or have an authorized operator assign `users.portalRole = 'owner'` to the verified owner account after it exists. The owner must then publish approved program terms and a rubric. Until a terms version is published, final submissions fail closed; no placeholder legal text is silently treated as approved.

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

## Data model and implementation notes

`drizzle/schema.ts` defines `users.portalRole`, `terms_versions`, `submissions`, `rubric_versions`, `validation_results`, `evaluations`, `decisions`, `withdrawals`, and `portal_audit_events`. `drizzle/` stores additive, deterministic migrations. `server/portal/` contains role policy, lifecycle transitions, input validation, rubric/terms defaults, and protected procedures. `client/src/pages/` contains participant and admin route screens. `client/public/manus-routes.json` lists the page routes. `TODO.md` keeps the full approved product acceptance clauses.

The current preview/dev database and published application share the managed database. Apply reviewed additive migrations intentionally; do not reset or seed production participant data during development. Migrations must not delete or rewrite accepted history. For higher-assurance deployment, use native row-level data authorization or equivalent service-layer tests for each staff/participant role, enforce rate limits at the gateway/application boundary, and complete legal copy review before publishing terms.

## Testable acceptance criteria

1. A logged-out user sees real sign-in and no fabricated identity; authenticated participants can only list, retrieve, edit, or withdraw their own submissions.
2. Participant intake validates identity/contact fields, project description/category/stack/status, and at least one safe HTTP(S) evidence URL; drafts survive navigation/reload and display save/error state.
3. Final submission requires all five declarations and the current published terms version; the exact version, acceptance time, and declaration set are stored with a stable submission ID.
4. Participant list/detail screens show status, timestamps, next action, evidence, acceptance history, validation/evaluation progress, and only permitted edits/withdrawal; a foreign ID is indistinguishable from a missing ID.
5. Admin queue filters on status/category/date/participant/project and excludes drafts. Review detail provides all requested materials/declarations/terms/validation/evaluation/decision/audit records.
6. Owners can configure/publish terms and rubrics; accepted terms text and published rubric versions cannot be overwritten. Editors can review/evaluate but cannot use owner-only operations; viewers are read-only; participants receive `FORBIDDEN` from staff-only procedures.
7. The state transition table rejects skipped/reversed/terminal changes; evaluation requires a passing validation and decisions require a submitted evaluation; status/decision/withdrawal actions append actor/time audit records.
8. Empty/loading/error/success states are present; labels, keyboard focus, contrast, reduced-motion behavior, and mobile navigation/form/table reflow are usable.
9. `GET /manus-routes.json` returns valid JSON with every current participant/admin page and its dynamic ID patterns.
10. `pnpm check`, `pnpm test`, and `pnpm build` pass after the project migrations and implementation are complete.

## Integration seam

No existing Ovanite repository or brand assets were available in the sandbox. This portal keeps the provided Ovanite tagline, restrained wordmark treatment, light technical visual system, and route conventions. When the existing site/admin repository is available, integrate this feature by mounting the participant routes under the agreed portal path, reuse the official identity assets and shared admin shell, and map the portal role/session policy to its existing staff membership model. Do not copy participant data to a public analytics surface.
