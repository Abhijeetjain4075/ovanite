# Vercel runtime configuration

The Caffeine export's original `env.json` is a runtime contract that Caffeine normally injects when hosting the app. A Vercel static deployment does not perform that injection. The frontend build now generates `dist/env.json` from explicit build-time variables, while preserving `undefined` placeholders for settings that have not been verified.

## Public configuration variables

Set these under the Vercel project's Environment Variables only after the corresponding resources exist:

| Variable | Purpose | Required for current production? |
| --- | --- | --- |
| `OVANITE_BACKEND_HOST` | ICP API host, normally `https://icp-api.io` | No; generated as the ICP default for deployed builds |
| `OVANITE_BACKEND_CANISTER_ID` | Canonical principal of the deployed Ovanite backend canister; Vite maps this to the Caffeine SDK variable `CANISTER_ID_BACKEND` | Yes, before the app can use backend methods |
| `OVANITE_II_DERIVATION_ORIGIN` | Optional final Internet Identity derivation origin | Leave unset until the identity design is verified |
| `OVANITE_CAFFEINE_PROJECT_ID` | Caffeine project identifier used only by Caffeine-specific infrastructure | Do not set just because it was provided for the old hosted project |
| `OVANITE_STORAGE_GATEWAY_URL` | Storage gateway expected by the exported Caffeine object-storage adapter | Leave unset until independent storage compatibility is proven |

All values written to `env.json` are sent to browsers and must be treated as public. Never put passwords, private keys, API tokens, identity recovery material, or other secrets in these variables.

The build resolves `OVANITE_BACKEND_CANISTER_ID` and `CANISTER_ID_BACKEND` to a single value for both the generated public `env.json` and Caffeine's `useActor(createActor)` integration. If both are set manually, the build fails when they differ. The generator validates URL syntax, requires HTTPS for deployed builds, requires an origin-only Internet Identity derivation value, and validates the backend ID as a canonical IC principal. This is syntax validation only; it does not prove that a canister exists, has been deployed, has enough cycles, exposes the expected Candid interface, or is reachable.

## Current release blockers

- No independently deployed mainnet backend canister ID has been verified/configured for this Vercel deployment.
- Vercel does not yet have a verified backend canister ID, so the actor intentionally remains unavailable and public forms remain hidden.
- Owner principal remains intentionally `null`; do not claim ownership from an email address or Caffeine project ID.
- The exported object-storage package still expects Caffeine-specific storage integration. Never guess its gateway URL.
- Participant intake stays closed until auth, storage, data persistence, abuse controls, and end-to-end checks pass.

For the independent Motoko build and disposable local deployment test, see [PR #11: independent ICP backend build and deployment audit](https://github.com/Abhijeetjain4075/ovanite/pull/11).
