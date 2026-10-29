const PLACEHOLDER = "undefined";

function clean(value) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed || trimmed.toLowerCase() === PLACEHOLDER) return undefined;
  return trimmed;
}

/**
 * Resolve the single backend canister ID used by both the public env.json
 * contract and Caffeine's useActor(createActor) integration. If both variables
 * are configured, they must agree; a silent split-brain configuration could
 * make health checks target a different canister from normal application calls.
 */
export function resolveBackendCanisterId(env = process.env) {
  const runtimeId = clean(env.OVANITE_BACKEND_CANISTER_ID);
  const sdkId = clean(env.CANISTER_ID_BACKEND);

  if (runtimeId && sdkId && runtimeId !== sdkId) {
    throw new Error(
      "OVANITE_BACKEND_CANISTER_ID and CANISTER_ID_BACKEND must match exactly.",
    );
  }

  return runtimeId ?? sdkId;
}

/**
 * Vite's environment plugin only exposes CANISTER_* build variables to the
 * generated Caffeine actor hook. Map the canonical Ovanite variable into that
 * contract before Vite plugins are initialized.
 */
export function configureBackendCanisterId(env = process.env) {
  const canisterId = resolveBackendCanisterId(env);

  if (canisterId) {
    env.CANISTER_ID_BACKEND = canisterId;
  } else {
    // Drop literal "undefined" or blank placeholders so the SDK sees an
    // actually-unconfigured backend, not a malformed canister principal.
    delete env.CANISTER_ID_BACKEND;
  }

  return canisterId;
}
