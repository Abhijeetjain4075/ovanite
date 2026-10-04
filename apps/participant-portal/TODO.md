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

## [ ] First-run Ovanite owner and approved program configuration

- Before participant intake is opened, configure the authorized Ovanite owner identity or provision the verified owner through the existing authorized operator workflow. The current managed database has zero users and `OWNER_OPEN_ID` is unset; do not auto-promote the first login.
- The authorized owner must publish Ovanite-approved program terms and a rubric. Until approved terms are published, final submissions must remain fail-closed; placeholder language must not be treated as approved.
