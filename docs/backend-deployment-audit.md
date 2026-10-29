# Ovanite backend deployment audit

## Findings

Ovanite's public frontend is hosted at https://ovanite.vercel.app. It was exported from Caffeine and has not been independently deployed to the Internet Computer. The Vercel project environment-variable list is empty.

The tracked src/frontend/env.json uses the Caffeine-generated runtime placeholders backend_host, backend_canister_id, project_id, ii_derivation_origin, and storage_gateway_url. Caffeine injects real values when Caffeine serves the app; a Vercel deployment does not receive that injection automatically. The supplied Caffeine project ID is not a backend canister ID.

A committed Motoko source file, generated WASM/Candid, and a READY Vercel deployment do not establish that a Motoko canister exists or that backend methods work.

The standalone ICP CLI manifest is defined in the repository root as `icp.yaml` and declares only the Motoko `backend` canister. The backend-quality workflow now checks Mops dependency lock integrity, Motoko type/lint/stable-state compatibility, Mops and ICP CLI builds, generated artifacts, and deploys to a disposable local ICP network. The local smoke test verifies all five published FAQs are present after a fresh install, checks public backend reads, and confirms anonymous owner-claim attempts are rejected. This local test does not create a mainnet canister and does not prove the Vercel frontend integration is working.

## Security status

- src/backend/lib/admin.mo intentionally keeps ownerPrincipal null. Owner bootstrap is closed; do not substitute an email or project ID for a principal.
- Do not configure the owner principal until the final Internet Identity origin is chosen and the principal is verified through Ovanite at that origin.
- Keep participant intake closed.
- Public contact/waitlist forms also depend on backend connectivity and must be tested after integration.
- Both backend and frontend use Caffeine object-storage packages. A standalone canister does not by itself provide a working storage gateway. Image upload/download is a separate release blocker until verified or replaced.

## Required release gates

1. Preserve passing CI evidence for the pinned Mops/ICP CLI toolchain and disposable local deployment smoke test. Do not use legacy dfx instructions.
2. Review the manifest and deployment target; the current manifest declares the backend only and does not deploy automatically.
3. Resolve object storage for independent hosting; never guess storage_gateway_url. The Caffeine object-storage adapter must either be proven compatible with a standalone deployment or replaced with a documented, tested storage solution.
4. Implement a Vercel-compatible runtime configuration and actor/identity adapter. Validate missing configuration and render a safe unavailable state rather than silently using invalid IDs. Keep the five Caffeine-specific runtime placeholders from being treated as working Vercel configuration.
5. Review mainnet cycle requirements and get explicit approval for funding and ongoing costs. Local pre-funded development is not proof of free mainnet operation.
6. Choose the identity origin and verify the exact app-specific Internet Identity principal using that origin; only then configure backend `ownerPrincipal` in a reviewed backend change.
7. Extend end-to-end coverage beyond the successful local install/read/FAQ checks: test wrong/repeated non-anonymous owner claims, admin authorization, contact/waitlist persistence, CRUD, data isolation, upgrade compatibility, and object storage against a local/staging canister before production.

Do not treat successful frontend deployment as proof of backend health. Do not enable participant intake until authentication, storage, database, permission, migration, abuse-control, privacy/retention, and end-to-end checks are complete.

References:
- https://docs.internetcomputer.org/getting-started/quickstart/
- https://docs.internetcomputer.org/getting-started/project-structure/
- https://skills.internetcomputer.org/skills/caffeine-app/
- https://docs.internetcomputer.org/references/internet-identity-spec/
