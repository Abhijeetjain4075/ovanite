# Ovanite Participant Submission & Evaluation Portal — Implementation Plan

## Goal and summary

Build a rigorous, responsive participant submission and Ovanite-side review portal for builders submitting software projects. The portal will cover participant intake, versioned program-terms acceptance, private submission records, structured validation and evaluation, controlled decisions, and an auditable admin workflow. It will be a product experience—not a marketing landing page or an unstructured contact form.

The active sandbox contained no Ovanite source checkout or existing website declaration. A separate managed portal project has therefore been initialized at `/home/ubuntu/ovanite` with the available React/Express/tRPC/Drizzle starter, server capability, and managed database. Treat this as a portal surface designed to integrate conceptually with the existing Ovanite site and admin conventions; do not replace public Ovanite pages or represent the new portal as already connected to the unavailable repository. Recheck the project files before editing, retain the starter's architecture, and document the integration boundary and eventual mounting/linking points.

## Implementation approach

### 1. Shared product shell and navigation

- Establish a consistent Ovanite portal shell, with clear participant and staff contexts, an accessible skip link, responsive navigation, page titles, breadcrumbs, and explicit logged-out/loading/error states.
- Use a restrained left navigation rail on desktop and a compact, keyboard-accessible mobile navigation. Participant navigation exposes only participant records; admin navigation appears only after server authorization.
- The exact tagline is **“Software, built to matter.”** Use it in the portal identity, not as hype copy.
- Include visible privacy/context cues on submission and review screens. Never show submissions, participant data, aggregate counts, or analytics publicly.

### 2. Participant journeys

- `/submit`: authenticated, step-based wizard for eligibility/context, participant details, project details/evidence, declarations, and final review. Collect name, email, country, optional profile/portfolio URL; project name, short description, problem solved, category, repository/live-demo/documentation/demo-video URLs, technology stack, and project status. URLs are the primary evidence; no source-code upload is required. Validate and normalize URLs, distinguish required and optional fields, and show per-step progress and errors. Preserve drafts across navigation/reload; warn before abandoning unsaved changes.
- Show the current terms version and concise configurable program copy before final submission. Require separate, explicit checkboxes for ownership/rights, no known third-party-rights violations, no guaranteed selection/funding/employment/partnership/publication/other outcome, authorization for program-rule evaluation, and acceptance of current terms. The server must store the exact accepted version and timestamp atomically with submission acceptance; accepted content remains immutable.
- `/my-submissions`: private participant list with project, lifecycle status, submitted/updated times, accepted terms version, and a status-specific next action; include useful empty, loading, error, and success states.
- `/submission/:id`: participant-owned record detail with submitted materials, declarations/acceptance record, validation/evaluation progress and available results, decision status/history, and permitted edit/withdraw actions. Withdrawal requires a clear explanation and confirmation; it must not erase the audit history.
- Enforce participant ownership server-side on every read and write. A guessed or foreign submission ID must not disclose whether another participant's record exists.

### 3. Ovanite review and administration

- `/admin/submissions`: staff queue with server-backed search and filters for lifecycle status, category, date, participant, and project. Provide stable sorting, pagination, empty/loading/error states, and least-privilege summaries.
- `/admin/submissions/:id`: review workspace containing project evidence links, declarations and exact terms version, validation checks/results, criterion-level evaluations and notes, decision controls/history, and an append-only audit timeline. Separate record facts from staff annotations and decision actions.
- `/admin/evaluations`: configurable-rubric workspace and evaluation queue. Include problem clarity, product completeness, usability, technical quality, originality, documentation, reliability/security, and evidence quality. Store configurable criterion weights, per-criterion scores, notes, evaluator identity/role, rubric version, overall record, and timestamps. Validate rubric configuration and scoring server-side; do not imply that scores guarantee selection.
- `/admin/terms`: versioned terms and declaration management with draft/published/retired states. Clearly label initial legal copy as configurable placeholder pending approved program text; do not invent legal guarantees. Publishing creates a new immutable version. Existing acceptance records continue to reference their exact historical version. Apply owner-only authorization to privileged term publication/retirement and other owner-only administration; editors may review and evaluate without inheriting owner powers; viewers are strictly read-only.
- Record all status changes, validation overrides, evaluation submissions, decisions, terms publications, and withdrawals as timestamped audit events with actor identity/role and relevant version/decision details.

### 4. State machine, data integrity, and privacy

Represent the requested lifecycle explicitly: `draft → submitted → terms_accepted → validation → evaluation → eligible | not_eligible → selected | rejected → withdrawn | archived`, with withdrawal/archive handled only from allowed states. Implement a server-side transition table and reject every transition not explicitly permitted; no UI action may bypass it. Submission finalization writes the submission, immutable ID, accepted terms version/timestamp, current status, and initial audit events consistently. Decisions record actor and decision time. Preserve historical events rather than overwriting them.

Use the managed database and existing Drizzle migration workflow for durable records. Design related schema areas for participants/auth identities and roles; submissions and project metadata/material URLs; versioned terms; validation results; rubric versions/criteria; evaluator records and scores/notes; decisions; status history/audit events; and withdrawal records. Avoid unnecessary personal data. Apply server-side input validation, URL scheme/host validation and normalization, rate limits/anti-abuse controls, duplicate detection with non-disclosing participant-safe messaging, safe error handling, and private/no-store behavior for sensitive responses. Restrict editor, owner, viewer, and participant access in protected server procedures, not merely in route guards or hidden UI controls.

### 5. Repository integration boundary and documentation

Preserve the initialized starter's routes, OAuth/session support, server entry points, tRPC procedures, Drizzle schema/migrations, and deployment setup. Before coding, inspect the actual project tree and existing auth helpers; extend those rather than replacing them. Keep public site integration to a clear portal entry/link and shared brand conventions where possible. Do not claim access to or alter the existing Ovanite public site.

Create a concise feature README/specification explaining routes, roles, lifecycle and allowed transitions, versioned terms, evaluation rubric, privacy/security boundaries, repository integration assumptions, and future integration seam. Include implementation notes with testable acceptance criteria. Keep the generated route manifest synchronized with all actual participant/admin routes.

## Project structure

Adapt these responsibilities to the actual initialized starter tree after inspection; do not create a parallel framework:

- `client/src/App.tsx` and the existing client route structure: participant/admin route registration, guarded presentation boundaries, shared portal shell, navigation, and not-found handling.
- Existing `client/src/components/` (or focused feature subfolders): accessible form controls, status/timeline, tables/filters, evidence links, evaluation rubric inputs, confirmation dialogs, and reusable loading/error/empty states.
- Feature-focused client pages/modules: submission wizard, participant submission list/detail, staff submission queue/detail, evaluations, and terms management.
- `server/routers.ts` and existing protected-procedure/context modules: authenticated participant procedures, owner/editor/viewer staff authorization, guarded CRUD/transition/evaluation/terms operations, input schemas, and consistent error handling.
- `server/db.ts`, `drizzle/schema.ts`, and `drizzle/`: typed queries, related record models, indexes/uniqueness constraints, additive deterministic migrations, and transaction boundaries for final submission and status/decision events.
- `public/manus-routes.json`: complete page-route manifest for all implemented routes, including `/submission/:id` and `/admin/submissions/:id`.
- Project-root `README.md` or focused feature documentation: concise implementation specification and acceptance criteria; `TODO.md` only if native project ToDo is unavailable.

## Design direction

- **Design movement:** Light-first Swiss-technical editorial interface—precise, quiet, and operational rather than futuristic.
- **Core principles:** (1) evidence before decoration; (2) legibility and hierarchy through spacing and rules; (3) privacy and role context are always apparent; (4) every consequential action leaves a clear, reviewable trace.
- **Color philosophy:** Warm near-white paper and pale neutral surfaces keep long forms and evaluation records readable; deep navy carries structural authority; restrained cobalt marks links, focus, and primary actions; muted orange is reserved for caution or attention. No gradients, glass effects, neon, or generic AI imagery.
- **Layout paradigm:** A narrow, persistent left rail and broad document/work surface, using asymmetric editorial columns and full-width queue/detail areas rather than centered promotional cards. Hairline rules and a fine technical grid establish alignment. Collapse the rail and stack detail panels at mobile widths without hiding essential context.
- **Signature elements:** (1) fine cobalt section markers and numbered workflow steps; (2) hairline dividers with compact mono labels for IDs, versions, dates, and lifecycle metadata; (3) a restrained orange marker for pending action or caution, never as ambient decoration.
- **Interaction philosophy:** Direct and deterministic. Inline validation explains exactly what needs correction; keyboard focus remains visible and moves to the first relevant error; saved/submitted states are explicit. Confirm destructive or irreversible actions. Respect reduced-motion settings.
- **Animation:** No decorative motion. Use brief opacity/position transitions only for panel changes and toast/status feedback; respect `prefers-reduced-motion`; never animate status in a way that obscures meaning.
- **Typography system:** Space Grotesk for prominent page titles and navigation where available; General Sans/system sans for dense body copy; Geist Mono for immutable IDs, timestamps, rubric scores, versions, and compact metadata. Use a clear type scale, comfortable body line height, and tabular numerals for records.
- **Brand essence:** A serious international software company giving builders a rigorous, fair, evidence-led route to submit meaningful software—distinct in its clear rules and accountable review. Personality: **considered, rigorous, humane**.
- **Brand voice:** Concise, specific, respectful, non-promissory. Example lines: “Show us what you built—and the problem it solves.” “Your submission is in review. We’ll record each status change here.”
- **Wordmark & logo:** Reuse the existing Ovanite wordmark/mark if an approved asset exists in the project; do not redraw or replace an unavailable brand identity. If no asset exists, use a restrained text wordmark with a small outlined O-derived registration mark as a temporary portal treatment, clearly isolated so the official asset can replace it.
- **Signature brand color:** Deep ink navy, used consistently for the portal wordmark, structural headings, and primary frame; cobalt is an accent, not a competing brand color.

## Verification approach

After the plan is approved: inspect existing files/auth helpers and preserve starter changes; register/check TypeScript diagnostics before the first application-code batch; implement in focused modules; run available type, test, migration/schema, and production build checks; inspect private route and role checks in server procedures, transition enforcement, terms immutability, and audit-event writes; confirm `/manus-routes.json` returns valid JSON and matches implemented routes; and review key participant/admin surfaces at desktop and mobile sizes if a concrete visual or interaction issue needs inspection. Resolve confirmed defects before handoff. Do not publish without explicit request/authorization; deliver the stable project Preview unless a successful publication is separately confirmed.

## Assumptions and open risks

- No existing Ovanite repository, live admin, approved logo asset, published program terms, or real user/role roster was present in the sandbox. The managed database was verified to contain zero users, and `OWNER_OPEN_ID` is unset. The portal will therefore be a separate, branded implementation surface with explicit integration seams—not a modification of the unavailable production site. Owner access must be provisioned through protected project runtime settings or the existing authorized operator workflow; the first login is never auto-promoted.
- Initial legal text must remain clearly marked as configurable placeholder pending approved Ovanite program language; no legal assurances will be invented.
- Authentication and staff-role provisioning must use the initialized starter's real server-side identity/session infrastructure. The UI must not create a fake preview user or grant roles based only on client state.
- Owner must publish Ovanite-approved program terms before participant final submission is enabled; the portal rejects finalization when no published terms exist rather than treating placeholder language as approved.
- Application schema and migrations target the project-managed database; development and published environments share the managed database under this platform, so migrations and development writes must be treated accordingly.
