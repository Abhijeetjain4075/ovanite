import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Principal } from "@icp-sdk/core/principal";
import { resolveBackendCanisterId } from "./backend-canister-env.mjs";

const PLACEHOLDER = "undefined";
const DEFAULT_ICP_HOST = "https://icp-api.io";
// Public intake endpoint (contact, waitlist, participant submission). It is a
// public address, not a secret; override it with OVANITE_INTAKE_API_ORIGIN.
const DEFAULT_INTAKE_ORIGIN =
  "https://ovanite-intake-gn5iks.freebuff.site";

function clean(value) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed || trimmed.toLowerCase() === PLACEHOLDER) return undefined;
  return trimmed;
}

function validateHttpsUrl(value, label, { originOnly = false, allowLocalHttp = false } = {}) {
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${label} must be a valid absolute URL.`);
  }
  const localHttp = allowLocalHttp && parsed.protocol === "http:" &&
    (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1");
  if (parsed.protocol !== "https:" && !localHttp) {
    throw new Error(`${label} must use HTTPS (HTTP is allowed only for localhost development).`);
  }
  if (parsed.username || parsed.password) {
    throw new Error(`${label} must not contain URL credentials.`);
  }
  if (originOnly && (parsed.origin !== value || parsed.pathname !== "/" || parsed.search || parsed.hash)) {
    throw new Error(`${label} must be an origin only, such as https://ovanite.vercel.app.`);
  }
  return value;
}

/**
 * Build the public env.json contract consumed by the exported frontend.
 * These values are public routing/configuration values, never secrets.
 */
export function buildRuntimeConfig(env = process.env) {
  const isDeployedBuild =
    env.NODE_ENV === "production" ||
    env.VERCEL === "1" ||
    env.VERCEL_ENV === "production" ||
    env.VERCEL_ENV === "preview";

  const configuredHost = clean(env.OVANITE_BACKEND_HOST);
  const backendHost = configuredHost
    ? validateHttpsUrl(configuredHost, "OVANITE_BACKEND_HOST", {
        allowLocalHttp: !isDeployedBuild,
        originOnly: true,
      })
    : isDeployedBuild
      ? DEFAULT_ICP_HOST
      : PLACEHOLDER;

  const backendCanisterId = resolveBackendCanisterId(env);
  if (backendCanisterId) {
    try {
      const parsed = Principal.fromText(backendCanisterId);
      if (parsed.toText() !== backendCanisterId) {
        throw new Error("Canister ID must use its canonical lowercase textual form.");
      }
    } catch (error) {
      throw new Error(
        "The backend canister ID must be a valid canonical Internet Computer principal.",
        { cause: error },
      );
    }
    if (backendHost === PLACEHOLDER) {
      throw new Error("OVANITE_BACKEND_HOST is required when a backend canister ID is configured.");
    }
  }

  const projectId = clean(env.OVANITE_CAFFEINE_PROJECT_ID);
  const derivationOriginRaw = clean(env.OVANITE_II_DERIVATION_ORIGIN);
  const storageGatewayRaw = clean(env.OVANITE_STORAGE_GATEWAY_URL);

  const derivationOrigin = derivationOriginRaw
    ? validateHttpsUrl(derivationOriginRaw, "OVANITE_II_DERIVATION_ORIGIN", {
        originOnly: true,
        allowLocalHttp: !isDeployedBuild,
      })
    : PLACEHOLDER;

  const storageGatewayUrl = storageGatewayRaw
    ? validateHttpsUrl(storageGatewayRaw, "OVANITE_STORAGE_GATEWAY_URL", {
        allowLocalHttp: !isDeployedBuild,
      })
    : PLACEHOLDER;

  const intakeOriginRaw = clean(env.OVANITE_INTAKE_API_ORIGIN);
  const intakeApiOrigin = intakeOriginRaw
    ? validateHttpsUrl(intakeOriginRaw, "OVANITE_INTAKE_API_ORIGIN", {
        originOnly: true,
        allowLocalHttp: !isDeployedBuild,
      })
    : isDeployedBuild
      ? DEFAULT_INTAKE_ORIGIN
      : PLACEHOLDER;

  return {
    backend_host: backendHost,
    backend_canister_id: backendCanisterId ?? PLACEHOLDER,
    project_id: projectId ?? PLACEHOLDER,
    ii_derivation_origin: derivationOrigin,
    storage_gateway_url: storageGatewayUrl,
    intake_api_origin: intakeApiOrigin,
  };
}

/**
 * Build-time deployability gate.
 *
 * `buildRuntimeConfig` deliberately tolerates unset values so a local build can
 * run without a deployed backend. A release build must not: placeholders in the
 * published contract mean every visitor loads an application that cannot reach
 * the canister. This returns the blocking problems, never throws, so both the
 * generator and the repository preflight can report every problem at once.
 */
export function findDeployabilityProblems(config) {
  const problems = [];

  if (config.backend_host === PLACEHOLDER) {
    problems.push(
      "backend_host is still the placeholder; set OVANITE_BACKEND_HOST (for example https://icp-api.io).",
    );
  } else {
    try {
      const parsed = new URL(config.backend_host);
      if (parsed.protocol !== "https:" || parsed.origin !== config.backend_host) {
        problems.push("backend_host must be an HTTPS origin only.");
      }
    } catch {
      problems.push("backend_host must be a valid absolute URL.");
    }
  }

  if (config.backend_canister_id === PLACEHOLDER) {
    problems.push(
      "backend_canister_id is still the placeholder; set OVANITE_BACKEND_CANISTER_ID to the verified deployed canister principal.",
    );
  } else {
    try {
      if (Principal.fromText(config.backend_canister_id).toText() !== config.backend_canister_id) {
        problems.push("backend_canister_id must use its canonical lowercase textual form.");
      }
    } catch {
      problems.push("backend_canister_id must be a valid Internet Computer principal.");
    }
  }

  return problems;
}

/**
 * Settings that are optional for launch but change runtime behaviour when
 * absent. Reported so an operator sees the degradation instead of discovering it
 * from a failing feature.
 */
export function describeDeployabilityWarnings(config) {
  const warnings = [];
  if (config.ii_derivation_origin === PLACEHOLDER) {
    warnings.push(
      "ii_derivation_origin is unset; Internet Identity sign-in uses the default derivation origin.",
    );
  }
  if (config.storage_gateway_url === PLACEHOLDER) {
    warnings.push(
      "storage_gateway_url is unset; object-storage uploads remain disabled.",
    );
  }
  if (config.project_id === PLACEHOLDER) {
    warnings.push("project_id is unset; Caffeine-specific infrastructure stays inactive.");
  }
  if (config.intake_api_origin === PLACEHOLDER) {
    warnings.push(
      "intake_api_origin is unset; public contact, waitlist and participant intake stay closed.",
    );
  }
  return warnings;
}

async function main() {
  const outputPath = resolve(dirname(fileURLToPath(import.meta.url)), "../dist/env.json");
  const config = buildRuntimeConfig();
  const requireDeployable = process.argv.includes("--require-deployable");
  if (requireDeployable) {
    const problems = findDeployabilityProblems(config);
    if (problems.length > 0) {
      throw new Error(
        `Refusing to write a non-deployable runtime config:\n- ${problems.join("\n- ")}`,
      );
    }
    for (const warning of describeDeployabilityWarnings(config)) {
      console.warn(`Runtime config warning: ${warning}`);
    }
  }
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(config, null, 2)}\n`, {
    encoding: "utf8",
    mode: 0o644,
  });
  console.info(`Wrote public runtime config to ${outputPath}`);
  console.info(
    config.backend_canister_id === PLACEHOLDER
      ? "Backend remains disabled: set OVANITE_BACKEND_CANISTER_ID to a verified deployed canister ID."
      : "Backend canister ID syntax is valid; this does not verify that the canister is deployed or reachable.",
  );
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
