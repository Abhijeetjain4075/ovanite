import {
  RUNTIME_CONFIG_PLACEHOLDER,
  type RuntimeConfig,
  isCanonicalPrincipal,
  readRuntimeConfigValue,
} from "./runtimeConfig";

/**
 * The runtime contract is fetched once by `main.tsx` before the application
 * mounts. Optional values (the intake endpoint) have to be readable from
 * ordinary components, and they never change during a page's lifetime, so a
 * small module-level store is the whole requirement: no context, no re-render.
 */
let current: RuntimeConfig = {};

export function setRuntimeConfig(config: RuntimeConfig): void {
  current = config;
}

export function getRuntimeConfig(): RuntimeConfig {
  return current;
}

/**
 * Absolute origin of the intake service, or `null` when this build has no
 * intake backend (development, preview, or a deployment that has not been
 * configured). Callers must treat `null` as "intake closed".
 */
export function intakeApiOrigin(): string | null {
  const value = readRuntimeConfigValue(current, "intake_api_origin");
  if (!value) return null;
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:") return null;
    if (parsed.origin !== value) return null;
    return parsed.origin;
  } catch {
    return null;
  }
}

export const INTAKE_UNCONFIGURED = RUNTIME_CONFIG_PLACEHOLDER;

/**
 * True only when this deployment names a canonical canister principal.
 *
 * Nothing backend-dependent (site copy reads, forms via the canister, admin,
 * sign-in) may construct an actor otherwise: the Caffeine SDK logs a missing
 * `CANISTER_ID_BACKEND` on every attempt, and a static-mode deployment must keep
 * a clean console.
 */
export function isBackendConfigured(): boolean {
  const canisterId = readRuntimeConfigValue(current, "backend_canister_id");
  return canisterId !== null && isCanonicalPrincipal(canisterId);
}
