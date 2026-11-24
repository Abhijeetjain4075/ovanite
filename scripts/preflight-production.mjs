#!/usr/bin/env node
/**
 * Production preflight.
 *
 * Refuses a production deployment unless the release-critical values that only
 * the owner can supply are actually present. It reads the repository's real
 * sources (the Motoko owner constant and the frontend runtime contract), so a
 * green local build cannot quietly stand in for a configured deployment.
 *
 * Usage:
 *   node scripts/preflight-production.mjs            # gate for a real deploy
 *   node scripts/preflight-production.mjs --self-test
 *   node scripts/preflight-production.mjs --strict   # warnings become failures
 *   node scripts/preflight-production.mjs --no-portal
 *
 * `--self-test` is what CI runs: it proves the gate is armed by requiring the
 * current unconfigured repository to be refused. It exits non-zero if the
 * preflight would allow a deployment.
 */
import { readFile } from "node:fs/promises";
import { Principal } from "@icp-sdk/core/principal";
import {
  buildRuntimeConfig,
  describeDeployabilityWarnings,
  findDeployabilityProblems,
} from "../src/frontend/scripts/generate-runtime-config.mjs";

const args = new Set(process.argv.slice(2));
const strict = args.has("--strict");
const selfTest = args.has("--self-test");
const includePortal = !args.has("--no-portal");

const OWNER_SOURCE = "src/backend/lib/admin.mo";
const CONTENT_SEED_SOURCE = "src/backend/main.mo";

/** @type {{id: string, level: "pass"|"warn"|"fail", detail: string}[]} */
const results = [];

function record(id, level, detail) {
  results.push({ id, level, detail });
}

function pass(id, detail = "ok") {
  record(id, "pass", detail);
}

function warn(id, detail) {
  record(id, "warn", detail);
}

function fail(id, detail) {
  record(id, "fail", detail);
}

function describe(error) {
  return error instanceof Error ? error.message : String(error);
}

function isCanonicalPrincipal(value) {
  try {
    return Principal.fromText(value).toText() === value;
  } catch {
    return false;
  }
}

function checkFrontendRuntimeConfig() {
  const id = "frontend.runtime-config";
  let config;
  try {
    config = buildRuntimeConfig(process.env);
  } catch (error) {
    fail(id, describe(error));
    return;
  }
  const problems = findDeployabilityProblems(config);
  if (problems.length > 0) {
    fail(id, problems.join(" | "));
  } else {
    pass(id, `deployable; canister ${config.backend_canister_id}`);
  }
  for (const warning of describeDeployabilityWarnings(config)) {
    warn(`${id}.optional`, warning);
  }
}

async function readSource(path) {
  try {
    return await readFile(path, "utf8");
  } catch (error) {
    throw new Error(`Cannot read ${path}: ${describe(error)}`);
  }
}

async function checkOwnerPrincipal() {
  const id = "backend.owner-principal";
  let source;
  try {
    source = await readSource(OWNER_SOURCE);
  } catch (error) {
    fail(id, describe(error));
    return;
  }

  const match = source.match(
    /public let ownerPrincipalText\s*:\s*\?Text\s*=\s*([^;]+);/,
  );
  if (!match) {
    fail(
      id,
      `${OWNER_SOURCE} no longer declares ownerPrincipalText; update this preflight to match the source.`,
    );
    return;
  }

  const declared = match[1].trim();
  const envPrincipal = (process.env.OVANITE_OWNER_PRINCIPAL ?? "").trim();
  if (declared === "null") {
    fail(
      id,
      `ownerPrincipalText is null in ${OWNER_SOURCE}: no owner can ever claim the backend. Set it to the owner's verified Internet Identity principal before deploying.`,
    );
    return;
  }

  const literal = declared.match(/^\?"([^"]*)"$/);
  if (!literal) {
    fail(id, `ownerPrincipalText must be a string literal or null, found: ${declared}`);
    return;
  }
  const principal = literal[1];
  if (!principal) {
    fail(id, "ownerPrincipalText is the empty string, which disables owner bootstrap.");
    return;
  }
  if (!isCanonicalPrincipal(principal)) {
    fail(id, `ownerPrincipalText is not a canonical IC principal: ${principal}`);
    return;
  }
  if (envPrincipal && envPrincipal !== principal) {
    fail(
      id,
      "OVANITE_OWNER_PRINCIPAL does not match ownerPrincipalText in the Motoko source.",
    );
    return;
  }
  pass(id, "owner bootstrap is configured");
}

async function checkLegalCopy() {
  const id = "content.legal-copy";
  let source;
  try {
    source = await readSource(CONTENT_SEED_SOURCE);
  } catch (error) {
    fail(id, describe(error));
    return;
  }
  const nullSeeds = [
    ["privacyBody", /privacyBody\s*=\s*null/],
    ["termsBody", /termsBody\s*=\s*null/],
  ].filter(([, pattern]) => pattern.test(source));
  if (nullSeeds.length > 0) {
    warn(
      id,
      `${nullSeeds.map(([name]) => name).join(" and ")} are seeded as null: publish reviewed legal copy through the admin surface before a public launch.`,
    );
    return;
  }
  pass(id, "legal copy is seeded");
}

function checkPortalRuntimeConfig() {
  const id = "portal.runtime-config";
  const env = process.env;
  const clean = (value) => (typeof value === "string" ? value.trim() : "");
  const missing = [];
  if (!clean(env.MANUS_PROJECT_ID)) missing.push("MANUS_PROJECT_ID");
  if (!clean(env.OWNER_OPEN_ID)) missing.push("OWNER_OPEN_ID");
  if (clean(env.MANUS_JWT_SECRET).length < 32) {
    missing.push("MANUS_JWT_SECRET (at least 32 characters)");
  }
  try {
    const oauth = new URL(clean(env.MANUS_OAUTH_API_URL));
    if (oauth.protocol !== "https:" || oauth.username || oauth.password) {
      missing.push("MANUS_OAUTH_API_URL (absolute HTTPS URL without credentials)");
    }
  } catch {
    missing.push("MANUS_OAUTH_API_URL (absolute HTTPS URL)");
  }
  try {
    const database = new URL(clean(env.DATABASE_URL));
    if (
      !["mysql:", "mysql2:"].includes(database.protocol) ||
      !database.hostname ||
      !database.pathname.replace(/^\//, "")
    ) {
      missing.push("DATABASE_URL (mysql:// URL with host and database name)");
    }
  } catch {
    missing.push("DATABASE_URL (mysql:// URL)");
  }

  if (missing.length > 0) {
    fail(id, `portal is not deployable; missing: ${missing.join(", ")}`);
    return;
  }
  pass(id, "portal runtime configuration is complete");
}

async function run() {
  checkFrontendRuntimeConfig();
  await checkOwnerPrincipal();
  await checkLegalCopy();
  if (includePortal) checkPortalRuntimeConfig();
}

function report() {
  const width = Math.max(...results.map(({ id }) => id.length));
  for (const { id, level, detail } of results) {
    const label = level.toUpperCase();
    console.info(`${label.padEnd(4)}  ${id.padEnd(width)}  ${detail}`);
  }
}

const blocking = () =>
  results.filter(({ level }) => level === "fail" || (strict && level === "warn"));

await run();
report();

const failures = blocking();
const warnings = results.filter(({ level }) => level === "warn");

if (selfTest) {
  const required = [
    "backend.owner-principal",
    "frontend.runtime-config",
    includePortal ? "portal.runtime-config" : null,
  ].filter(Boolean);
  const failedIds = new Set(failures.map(({ id }) => id));
  const missingGates = required.filter((id) => !failedIds.has(id));

  if (failures.length === 0) {
    console.error(
      "PREFLIGHT SELF-TEST FAILED: this repository currently looks deployable, so the self-test cannot prove the gate is armed. Run the preflight normally for a real deployment.",
    );
    process.exit(1);
  }
  if (missingGates.length > 0) {
    console.error(
      `PREFLIGHT SELF-TEST FAILED: expected these gates to refuse the unconfigured repository: ${missingGates.join(", ")}`,
    );
    process.exit(1);
  }
  console.info(
    `Preflight self-test passed: ${failures.length} gate(s) refuse this unconfigured repository as intended.`,
  );
  process.exit(0);
}

if (failures.length > 0) {
  console.error(
    `\nPreflight failed: ${failures.length} blocking gate(s), ${warnings.length} warning(s). Do not deploy.`,
  );
  process.exit(1);
}

console.info(
  `\nPreflight passed with ${warnings.length} warning(s). Configuration is present; deployment, migration and post-deploy checks still follow the runbook.`,
);
