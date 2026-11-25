import {
  RUNTIME_CONFIG_PLACEHOLDER,
  type RuntimeConfig,
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
