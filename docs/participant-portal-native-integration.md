# Participant Portal Native Integration Plan

Status: engineering design on `feature/participant-portal-integration`. Not production-ready and not yet merged.

## Decision

The Manus participant portal is retained as the reference implementation/specification, but its Express/tRPC/Drizzle/MySQL runtime is not the target production architecture.

The target is one Ovanite application boundary:

- React/Vite public site
- React participant portal
- React admin/reviewer portal
- Internet Identity
- one Motoko canister
- one authorization model
- one durable audit/history model

The existing `apps/participant-portal/` snapshot must remain available during the port as a behavioural and data-model oracle.

## Why this boundary is necessary

The current root application already persists products, FAQs, submissions, admins, site copy, and analytics in the Motoko canister. Its migration chain is explicit and versioned.

The Manus portal introduces a second identity plane (Manus OAuth), second authorization plane, second persistence plane (MySQL), and second API/runtime (Express/tRPC). Keeping both as production systems would create ambiguous ownership, duplicated authorization logic, synchronization problems, and two sources of truth.

## Canonical identity

Internet Identity principal is the canonical participant identity.

`email` is contact information only. It must never be used as the ownership key.

Target relationship:

`Principal -> Participant -> Submission.participantId`

Participant-entered email remains useful for communication but does not establish account ownership.

## Native domain model

The Motoko domain should add these concepts:

- Participant
- Submission
- SubmissionEvidence
- TermsVersion
- TermsAcceptance
- RubricVersion
- RubricCriterion
- ValidationResult
- Evaluation
- EvaluationCriterion
- Decision
- Withdrawal
- AuditEvent

Mutable state:
- participant profile
- drafts

Immutable after final submission:
- submission identity
- participant identity
- final declarations
- accepted terms version and acceptance timestamp
- submitted timestamp

Append-only:
- status history
- validations
- evaluations
- decisions
- withdrawals
- audit events

## Submission lifecycle

The server owns the transition matrix. The client may request a transition but never defines which transitions are legal.

Target lifecycle:

`draft -> submitted -> terms_accepted -> validation -> evaluation -> eligible/not_eligible -> selected/rejected -> withdrawn/archived`

Invalid transitions must trap/reject server-side.

A final submission must fail closed unless an approved published terms version and published rubric exist.

## Evaluation model

Evaluation and decision are separate entities.

Default rubric criteria:

| Criterion | Weight |
|---|---:|
| Problem clarity | 14% |
| Product completeness | 14% |
| Usability | 12% |
| Technical quality | 14% |
| Originality | 12% |
| Documentation | 10% |
| Reliability & security | 14% |
| Evidence quality | 10% |

Scores are 0-5. The server must verify exact criterion-key parity between supplied scores/notes and the evaluation's immutable rubric version.

No score should directly imply selection. Selection is a separate decision action.

## Terms and rubric invariants

Exactly zero or one terms version may be published.

Exactly zero or one rubric version may be published.

Published versions are immutable.

Every final submission stores the exact terms version and acceptance timestamp.

Every evaluation stores the exact rubric version used.

These invariants should be enforced by backend logic and tested under concurrent calls. They must not depend solely on UI state.

## Audit integrity

The first native implementation should use append-only audit events with:

- event id
- actor principal
- action
- entity type
- entity id
- timestamp
- structured payload
- previous event hash
- event hash

The hash chain is an optional higher-assurance layer, but is recommended because an ordinary append-only application log is not intrinsically tamper-evident.

## Abuse controls

The public website already has anonymous contact/waitlist writes. The participant portal will add substantially more sensitive write operations.

Before public intake:

- per-principal submission throttles
- per-IP/gateway throttles where available
- final-submission frequency limits
- bounded request sizes
- URL validation
- no server-side fetching of participant URLs
- duplicate repository heuristics
- audit events for privileged actions
- fail-closed authorization
- explicit confirmation for destructive staff operations

The portal's 50 MB generic request budget should not be inherited blindly because the initial evidence model is URL-based.

## Manus runtime cleanup

The Manus portal contains starter infrastructure unrelated to the Ovanite program domain. Before production integration, remove or isolate unused:

- AI chat
- LLM helpers
- maps
- voice transcription
- image generation
- generic notification/storage helpers
- component showcase/debug infrastructure

The production build must not ship the Manus debug collector unless an explicit, reviewed development-only mechanism enables it.

## Migration strategy

Do not rewrite the existing stable state in place.

The existing Ovanite repository uses explicit Motoko migrations. New participant state should be introduced additively.

Migration sequence:

1. Add participant domain types and API-independent business logic.
2. Add a migration that introduces the new persistent collections with empty initial state.
3. Add native APIs with no public UI dependency.
4. Add exhaustive backend tests.
5. Add participant/admin UI against the native API.
6. Compare native behaviour against the Manus reference implementation.
7. Run production-build and route tests.
8. Deploy to an isolated canister/staging environment.
9. Exercise upgrade/rollback compatibility.
10. Only then open the participant intake route.

Do not delete the Manus snapshot until the native implementation has passed behavioural parity tests.

## Upgrade-safety experiment

Before the first production upgrade containing participant state:

- compile the current baseline stable signature
- compile the candidate stable signature
- run stable compatibility checks
- install candidate on a disposable canister containing representative state
- verify old products, FAQs, submissions, admins, site content, and analytics survive
- verify new participant collections start empty
- upgrade a second time after creating participant data
- verify participant data survives
- verify invalid lifecycle transitions remain rejected
- verify published terms/rubric invariants survive upgrades

The Motoko compiler and `dfx` are designed to reject incompatible stable-state changes, and explicit migrations exist for non-trivial transformations. We should rely on those checks rather than ad-hoc pre/post upgrade copying.

## Behavioural parity experiment

Create a fixture set covering:

1. anonymous participant draft
2. authenticated participant draft
3. submitted record
4. terms acceptance
5. invalid URL
6. duplicate repository
7. withdrawn submission
8. reviewer evaluation
9. exact rubric mismatch
10. decision after evaluation
11. viewer attempting mutation
12. editor attempting owner operation
13. participant attempting another participant's submission
14. missing published terms
15. missing published rubric
16. concurrent publication attempt

For each fixture, compare:

- accepted/rejected
- lifecycle state
- persisted fields
- authorization result
- audit event
- error class

The native implementation is accepted only when intentional differences are documented.

## Current security blockers

The existing root app still has security debt that must be addressed before calling the integrated system production-ready:

1. owner bootstrap depends on a source-visible hardcoded email.
2. content/submission APIs currently use broad `isAdmin` checks rather than capability-specific owner/editor/viewer checks.
3. anonymous contact/waitlist writes have no meaningful server-side rate limiting.
4. public analytics writes are manipulable and should be treated as approximate telemetry unless hardened.
5. portal debug collection must not ship into production.
6. portal role provisioning must never auto-promote the first login.

These are tracked as integration gates, not reasons to discard the Manus domain model.

## Acceptance gates

The integration branch must not merge until all are true:

- [ ] Native participant identity is principal-based.
- [ ] No participant data depends on MySQL/Drizzle/Express/tRPC.
- [ ] Lifecycle transition matrix is server-enforced.
- [ ] Terms/rubric versions are immutable after publication.
- [ ] Exactly one published terms/rubric version is possible.
- [ ] Evaluation and decision are separate.
- [ ] Criterion score keys and note keys are exact.
- [ ] Participant isolation is tested at the backend boundary.
- [ ] Viewer is read-only.
- [ ] Editor cannot perform owner-only operations.
- [ ] Anonymous writes have abuse controls.
- [ ] Audit history is append-only and integrity-protected to the chosen assurance level.
- [ ] Manus debug collector is excluded from production.
- [ ] Root and portal tests run from CI.
- [ ] Stable upgrade compatibility has been exercised.
- [ ] A disposable canister upgrade test preserves existing Ovanite state.
- [ ] Behavioural parity against the Manus reference implementation passes.
- [ ] Production route verification passes.
- [ ] No secrets or credentials are committed.

## Current state

This document is the first controlled change on `feature/participant-portal-integration`.

No production routes, canister state, or `main` branch code are modified by this design step.
