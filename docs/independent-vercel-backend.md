# Ovanite: Vercel frontend with an independently deployed Internet Computer backend

## Current deployment facts

The public frontend is served from `https://ovanite.vercel.app`. The repository's Motoko source is at `src/backend/main.mo`; the project has not yet had an independently deployed backend canister. Vercel having a successful frontend deployment does not deploy Motoko code.

The current `src/frontend/env.json` is read at runtime by `@caffeineai/core-infrastructure`. On Caffeine-hosted deployments the platform injects runtime configuration; a Vercel static deployment does not receive that injection automatically. Do not treat the Caffeine project ID as a canister ID.

## Runtime values

| Value | Required decision | Current safe handling |
| --- | --- | --- |
| `backend_host` | Public ICP API endpoint | Use `https://icp-api.io` for the Vercel-hosted frontend. An unset host can otherwise fall back to the page origin, which is not an ICP API endpoint. |
| `backend_canister_id` | Actual deployed backend canister ID | Not available until deployment. Set Vercel's `CANISTER_ID_BACKEND` build-time environment variable only after an actual backend canister has been deployed. It is public configuration, not a secret. Do not use the Caffeine project ID. |
| `ii_derivation_origin` | Canonical origin for Internet Identity principal derivation | The production origin is `https://ovanite.vercel.app`. Keep identity setup and this canonical origin consistent. A preview deployment is not automatically the same identity origin. |
| `project_id` | Required by the Caffeine object-storage client to namespace storage | The value previously supplied by the owner identifies a Caffeine project; it is not an ICP canister ID. Do not assume it grants a usable independent storage gateway. |
| `storage_gateway_url` | Real, reachable gateway compatible with the Caffeine object-storage protocol | Unverified and deliberately not invented. The current frontend uses `@caffeineai/object-storage`; with the library fallback of `nogateway`, file/image uploads are not production-ready. |

The application uses `@caffeineai/core-infrastructure` to load `env.json`; when `backend_canister_id` is still the literal `"undefined"`, the library can fall back to Vite-injected `CANISTER_ID_BACKEND`. Configure that Vercel variable for the Production target and rebuild after the deployed canister ID is known. If Preview deployments are used, configure the correct canister ID separately for Preview; do not accidentally point a preview frontend to production data.

## Build and verification

A dedicated GitHub Actions workflow installs the locked Mops dependencies and runs `mops build` for backend changes. This is a compile and configured stability/deployment-constraint check; it does **not** deploy a canister, prove that a mainnet canister exists, or establish that storage works.

Before a production deployment:

1. Run the backend build/stability workflow and resolve every compiler/stable-state failure.
2. Choose and validate the independent ICP deployment configuration and authenticate with the deployer's own local identity. Never commit a private key, seed phrase, delegation, or deployment token.
3. Budget cycles for mainnet canister creation and future execution/storage. A local replica can be used for no-cost experiments, but it is not production.
4. Deploy the backend and record its actual canister ID from the deployment tool/dashboard.
5. Verify the deployed Candid interface against `src/backend/dist/backend.did` and the generated TypeScript bindings.
6. Configure Vercel's Production `CANISTER_ID_BACKEND` and redeploy. Verify the site is connecting to that exact canister on `https://icp-api.io`.
7. Verify Internet Identity login on the canonical production origin and obtain the exact principal from that authenticated session.
8. Set `ownerPrincipal` in `src/backend/lib/admin.mo` to that verified principal only through a reviewed source change; redeploy the backend before claiming ownership.
9. Test anonymous, arbitrary-principal, repeated-claim and non-owner admin calls. Confirm the real owner can access admin and that non-owners cannot.
10. Before enabling image upload, prove that an independent, compatible storage gateway is configured and test create/read/delete with non-sensitive test images. If no such gateway is available, replace the Caffeine object-storage integration with a storage design the project controls.
11. Keep contact/waitlist submission and participant intake closed until persistence, abuse controls, data isolation, and end-to-end tests are independently verified.

## Security invariants

- `ownerPrincipal` must remain `null` until the actual operator principal has been captured and reviewed. Do not authorize by email alone, and do not enable first-user ownership.
- Never put secrets in `env.json`, source code, Vite-prefixed/public variables, or committed workflow files.
- Do not enable intake or label the application production-ready merely because Vercel reports `READY`.
- Current `test/pocketic/run-backend-lane.mjs` intentionally skips successfully when its PocketIC sidecar is absent. A successful frontend workflow or a skipped PocketIC lane is not proof of backend runtime security.
