# Ovanite backend deployment audit

## Findings

Ovanite's public frontend is hosted at https://ovanite.vercel.app. It was exported from Caffeine and has not been independently deployed to the Internet Computer. The Vercel project environment-variable list is empty.

The tracked src/frontend/env.json uses the Caffeine-generated runtime placeholders backend_host, backend_canister_id, project_id, ii_derivation_origin, and storage_gateway_url. Caffeine injects real values when Caffeine serves the app; a Vercel deployment does not receive that injection automatically. The supplied Caffeine project ID is not a backend canister ID.

A committed Motoko source file, generated WASM/Candid, and a READY Vercel deployment do not establish that a Motoko canister exists or that backend methods work.

## Security status

- src/backend/lib/admin.mo intentionally keeps ownerPrincipal null. Owner bootstrap is closed; do not substitute an email or project ID for a principal.
- Do not configure the owner principal until the final Internet Identity origin is chosen and the principal is verified through Ovanite at that origin.
- Keep participant intake closed.
- Public contact/waitlist forms also depend on backend connectivity and must be tested after integration.
- Both backend and frontend use Caffeine object-storage packages. A standalone canister does not by itself provide a working storage gateway. Image upload/download is a separate release blocker until verified or replaced.

## Required release gates

1. Build and typecheck the Motoko backend with the current ICP CLI/Mops toolchain. Do not use legacy dfx instructions.
2. Add and validate a standalone ICP canister manifest before attempting a deployment.
3. Resolve object storage for independent hosting; never guess storage_gateway_url.
4. Implement a Vercel-native path for real backend host, canister ID, and identity-origin settings. Validate missing configuration and show a safe unavailable state rather than silently using invalid IDs.
5. Review mainnet cycle requirements and get explicit approval for funding and ongoing costs. Local pre-funded development is not proof of free mainnet operation.
6. Verify the exact app-specific Internet Identity principal after settling the canonical origin; only then configure the backend ownerPrincipal.
7. Test anonymous/wrong/repeated owner claims, admin authorization, public reads, form persistence, CRUD, data isolation, upgrade compatibility, and storage before release.

Do not treat successful frontend deployment as proof of backend health. Do not enable participant intake until authentication, storage, database, permission, migration, abuse-control, privacy/retention, and end-to-end checks are complete.

References:
- https://docs.internetcomputer.org/getting-started/quickstart/
- https://docs.internetcomputer.org/getting-started/project-structure/
- https://skills.internetcomputer.org/skills/caffeine-app/
- https://docs.internetcomputer.org/references/internet-identity-spec/
