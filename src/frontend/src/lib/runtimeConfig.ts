import { Principal } from "@icp-sdk/core/principal";

/**
 * Runtime configuration contract for the exported frontend.
 *
 * `env.json` is fetched by the browser after the bundle has already loaded, so
 * a bad deployment cannot be caught by the type system or the build alone.
 * Every value that reaches this module is public routing data; secrets must
 * never be placed here.
 *
 * The build side owns the authoritative writer (`scripts/generate-runtime-config.mjs`).
 * This module is the browser-side guard that turns a placeholder or malformed
 * runtime contract into a visible, actionable failure instead of a silently
 * backend-less application.
 */
export const RUNTIME_CONFIG_PATH = "/env.json";
export const RUNTIME_CONFIG_PLACEHOLDER = "undefined";

/**
 * Without these two values the application cannot reach the backend at all.
 * Everything else is optional and degrades explicitly.
 */
export const REQUIRED_DEPLOYED_KEYS = [
  "backend_host",
  "backend_canister_id",
] as const;

export type RuntimeConfig = Record<string, string>;

function isPlaceholder(value: string): boolean {
  return value.trim().toLowerCase() === RUNTIME_CONFIG_PLACEHOLDER;
}

/**
 * Reads one optional string value. Returns `null` for an absent, blank or
 * placeholder entry, so callers never have to compare against "undefined".
 */
export function readRuntimeConfigValue(
  config: Record<string, unknown>,
  key: string,
): string | null {
  const value = config[key];
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 && !isPlaceholder(trimmed) ? trimmed : null;
}

const readString = readRuntimeConfigValue;

function describeHttpsUrl(
  value: string,
  key: string,
  options: { originOnly: boolean },
): string | null {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return `${key} must be a valid absolute URL.`;
  }
  if (parsed.protocol !== "https:") {
    return `${key} must use HTTPS.`;
  }
  if (parsed.username || parsed.password) {
    return `${key} must not contain URL credentials.`;
  }
  if (
    options.originOnly &&
    (parsed.origin !== value ||
      parsed.pathname !== "/" ||
      parsed.search ||
      parsed.hash)
  ) {
    return `${key} must be an origin only, such as https://icp-api.io.`;
  }
  return null;
}

/**
 * Returns human-readable problems, never throws. An empty array means the
 * served configuration is usable by a deployed build.
 */
export function findRuntimeConfigProblems(config: unknown): string[] {
  if (typeof config !== "object" || config === null || Array.isArray(config)) {
    return [`${RUNTIME_CONFIG_PATH} must contain a JSON object.`];
  }

  const record = config as Record<string, unknown>;
  const problems: string[] = [];

  for (const key of REQUIRED_DEPLOYED_KEYS) {
    if (readString(record, key) === null) {
      problems.push(
        `${key} is unset or still the build placeholder "${RUNTIME_CONFIG_PLACEHOLDER}"; the deployed bundle cannot reach the backend.`,
      );
    }
  }

  const backendHost = readString(record, "backend_host");
  if (backendHost) {
    const problem = describeHttpsUrl(backendHost, "backend_host", {
      originOnly: true,
    });
    if (problem) problems.push(problem);
  }

  const canisterId = readString(record, "backend_canister_id");
  if (canisterId) {
    try {
      if (Principal.fromText(canisterId).toText() !== canisterId) {
        problems.push(
          "backend_canister_id must use its canonical lowercase textual form.",
        );
      }
    } catch {
      problems.push(
        "backend_canister_id must be a valid Internet Computer principal.",
      );
    }
  }

  const derivationOrigin = readString(record, "ii_derivation_origin");
  if (derivationOrigin) {
    const problem = describeHttpsUrl(derivationOrigin, "ii_derivation_origin", {
      originOnly: true,
    });
    if (problem) problems.push(problem);
  }

  const storageGateway = readString(record, "storage_gateway_url");
  if (storageGateway) {
    const problem = describeHttpsUrl(storageGateway, "storage_gateway_url", {
      originOnly: false,
    });
    if (problem) problems.push(problem);
  }

  // Optional: when present it decides whether public intake is open, so a
  // malformed value must be reported rather than silently ignored.
  const intakeOrigin = readString(record, "intake_api_origin");
  if (intakeOrigin) {
    const problem = describeHttpsUrl(intakeOrigin, "intake_api_origin", {
      originOnly: true,
    });
    if (problem) problems.push(problem);
  }

  return problems;
}

/**
 * Fetches the runtime contract. Any transport or parsing failure is surfaced as
 * a thrown error so the caller can decide between a loud production failure and
 * a tolerated local-development warning.
 */
export async function loadRuntimeConfig(
  fetcher: typeof fetch = fetch,
): Promise<RuntimeConfig> {
  const response = await fetcher(RUNTIME_CONFIG_PATH, {
    cache: "no-store",
    credentials: "same-origin",
    headers: { accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(
      `${RUNTIME_CONFIG_PATH} returned HTTP ${response.status} ${response.statusText}.`.trim(),
    );
  }

  let parsed: unknown;
  try {
    parsed = await response.json();
  } catch {
    throw new Error(`${RUNTIME_CONFIG_PATH} did not contain valid JSON.`);
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error(`${RUNTIME_CONFIG_PATH} must contain a JSON object.`);
  }

  const config: RuntimeConfig = {};
  for (const [key, value] of Object.entries(
    parsed as Record<string, unknown>,
  )) {
    if (typeof value === "string") config[key] = value;
  }
  return config;
}

/**
 * Local development deliberately runs without a deployed backend, so the
 * placeholder contract is only a warning there. Any other origin is a real
 * deployment and must be correct.
 */
export function isLocalRuntimeHost(hostname: string): boolean {
  const normalized = hostname.trim().toLowerCase();
  return (
    normalized === "localhost" ||
    normalized === "127.0.0.1" ||
    normalized === "::1" ||
    normalized === "[::1]" ||
    normalized.endsWith(".localhost")
  );
}
