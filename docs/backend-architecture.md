# Ovanite backend architecture

**Status:** source/design specification for the independently buildable backend. This document does not claim a mainnet canister has been deployed or that production traffic is connected to it.

## 1. Deployment boundary

Ovanite has two distinct application runtimes:

- **Public website:** React/Vite, deployed on Vercel at `https://ovanite.vercel.app`.
- **Native backend:** Motoko canister, built with Mops and the pinned ICP CLI recipe in `icp.yaml`. It can be built and exercised on a disposable local Internet Computer network without deploying to mainnet.
- **Participant portal:** a separate Node/Express application under `apps/participant-portal`, with its own database, authentication configuration, migrations, reviewer controls, and evaluation workflow. It is not made operational by the Motoko website canister.

The intended production topology is Vercel frontend → verified Motoko canister through the ICP API. Do not confuse a Caffeine project UUID with a canister ID. A Vercel deployment and a successful local canister test are not evidence of a live mainnet backend.

## 2. Module boundaries

| Layer | Source | Responsibility |
| --- | --- | --- |
| Composition root | `src/backend/main.mo` | Persistent state declarations, mixin composition, public OQL entity projection. |
| Domain types | `src/backend/types/*.mo` | Product, FAQ, editable site copy, admin, submission, and analytics schemas. |
| Domain logic | `src/backend/lib/*.mo` | Input normalization, state changes, ordering, deduplication, role decisions, analytics path handling. |
| API surface | `src/backend/mixins/*.mo` | Public query methods and server-side authorization at every protected method. |
| State evolution | `src/backend/migrations/` and `mops.toml` | Versioned, upgrade-aware schema/data migrations; stable-state compatibility checks are part of CI. |
| Contract | `src/frontend/src/declarations/backend.did` and generated TypeScript bindings | Candid interface consumed by the frontend. Regenerate/reconcile after public method or type changes. |
| Build and smoke verification | `.github/workflows/backend-quality.yml`, `icp.yaml`, `test/pocketic/` | Locked dependencies, Motoko checks, independent build, local network install, public-read and authorization regressions. |

## 3. Authorization contract

The backend has a dedicated `admins` map. It is authoritative for Ovanite content, submission, and admin-team endpoints; generic access-control roles are a separate mechanism and must not be treated as equivalent.

| Caller state | Public queries | Admin reads | Content/submission writes | Change admin team |
| --- | --- | --- | --- | --- |
| Anonymous/unregistered | Allowed only where documented public | Denied | Denied | Denied |
| Registered viewer | Allowed | Allowed | **Denied** | Denied |
| Registered editor | Allowed | Allowed | Allowed | Denied |
| Configured owner | Allowed | Allowed | Allowed | Allowed |

The policy is enforced inside Motoko methods. The UI is not a security boundary. The owner role is unique and reserved for the one-time bootstrap; normal `addAdmin` and `setAdminRole` operations must never assign `#owner` to a second principal. Owners cannot be demoted or removed.

### Safe owner bootstrap

`src/backend/lib/admin.mo` deliberately defaults `ownerPrincipal` to `null`. In that state, owner bootstrap fails closed and `isOwnerClaimed()` returns `true`. A reviewed release may configure the exact operator principal only after the final Internet Identity origin is established and the operator obtains the principal on that origin.

The configured principal is the primary identity check; the configured email is a secondary consistency check only. Never use an email string, Caffeine project UUID, or principal copied from a preview origin as proof of identity. Do not put identity seeds, passkeys, private keys, delegations, or tokens in the repository or public runtime configuration.

## 4. Data and lifecycle design

- **Products and FAQs:** records receive backend-generated IDs and timestamps. New items start as drafts; only published items are exposed by public list methods. Counts are bounded at 100 products and 100 FAQs. Field lengths are validated by the canister, not only by the frontend.
- **Site content:** a single typed record provides optional editable copy. Patches preserve absent fields and reject overlong text.
- **Contact/Waitlist submissions:** stored records have kind, status, timestamps, and bounded input fields. Duplicate detection is scoped by kind and compares normalized email plus normalized message/note. Duplicate receipts are redacted. The API exists but direct public writes are blocked by a server-side policy until operational and privacy controls pass.
- **Analytics:** stores aggregate route totals rather than visitor-level rows. Public write calls are blocked until a finite canonical route set and effective ingress abuse/cost controls are verified. Public query methods expose aggregate counts only.
- **Object storage:** the existing Caffeine storage adapter and legacy blob type remain in the schema. Independent gateway compatibility, upload/read/delete, file-size/type validation, and access isolation have not been proven; image blob operations must remain disabled until those experiments pass. Optional external HTTPS image URLs do not establish a storage backend.

## 5. API and resource controls

- Public product reads are bounded by the 100-record collection limit.
- Public FAQ list arguments are clamped to at most 20 before numeric conversion/slicing.
- Product names/descriptions, product links/image URLs, FAQ question/answer text, and site-copy fields have explicit server-side length limits.
- Owner/editor-only mutations are separate from admin read access. Viewers may use protected read endpoints but cannot create/update/delete content or alter submission status.
- Only the owner can grant/revoke/re-role administrators. Owner-role assignment through ordinary admin mutations is rejected.
- Submission and analytics policy flags are hard-coded closed in the source; frontend configuration cannot override a Motoko-level rejection.

## 6. Build/test strategy

The backend-quality workflow is expected to run these checks:

1. Verify patch whitespace and install locked Mops dependencies.
2. Run Motoko type, lint, and stable-state compatibility checks.
3. Build with Mops and independently with the pinned ICP CLI recipe.
4. Verify non-empty Wasm, Candid, and stable-memory artifacts.
5. Deploy to a disposable local ICP network and test seeded public reads.
6. Prove anonymous and unconfigured principals cannot claim ownership or list admin records.
7. Prove direct Contact/Waitlist writes and public analytics updates are denied by policy.
8. Exercise positive owner/editor paths and negative viewer/role-escalation paths using a test-only configured-owner build. This test fixture must never change the production source default.
9. Keep frontend actor/Candid declarations synchronized and run frontend checks when the API contract changes.

A skipped integration test is not a pass. CI should clearly distinguish a build-only job from a lane that actually installed and exercised the canister. Never report a test as successful unless the test ran.

## 7. Runtime configuration contract

The frontend build generates public `env.json` from the validated build-time contract in `src/frontend/scripts/generate-runtime-config.mjs`. Expected public settings are:

- `OVANITE_BACKEND_HOST`: HTTPS IC API origin; deployed builds default to `https://icp-api.io`.
- `OVANITE_BACKEND_CANISTER_ID`: the real, verified backend canister ID. It must agree with `CANISTER_ID_BACKEND` when both are set.
- `OVANITE_II_DERIVATION_ORIGIN`: set only after deciding and verifying the canonical Internet Identity origin.
- `OVANITE_CAFFEINE_PROJECT_ID`: Caffeine-specific metadata, not a canister ID; leave unset unless the exported code's intended integration actually needs it.
- `OVANITE_STORAGE_GATEWAY_URL`: do not configure until the adapter is shown to work with an independently deployed canister.
- `OVANITE_PUBLIC_FORMS_ENABLED`: frontend release flag only; it cannot override the backend's submission policy.

These are public, client-visible configuration values, not secrets. Never place a password, secret token, private key, identity recovery phrase, or other credential in `env.json`.

## 8. Release gates (must stay closed until verified)

The following are not complete merely because the backend compiles:

- Mainnet deployment and controller/cycle/status verification.
- Matching deployed Candid and generated frontend bindings.
- Canonical Internet Identity origin and verified operator principal.
- Production owner claim, admin CRUD, owner-only team changes, viewer read-only behavior, and unauthorized-call regressions.
- Independently compatible object storage, including upload/read/delete and access-isolation tests.
- Persistent Contact/Waitlist submissions, deduplication, abuse/rate controls, privacy notice, retention/deletion, monitoring, and operator response.
- Participant portal deployment, production database/migrations, identity callbacks, role isolation, callback secrets, and end-to-end lifecycle tests.

No mainnet deployment or cycle spending is part of this backend design work. Keep owner bootstrap, public submission writes, analytics writes, and participant intake closed until the corresponding release gates pass.
