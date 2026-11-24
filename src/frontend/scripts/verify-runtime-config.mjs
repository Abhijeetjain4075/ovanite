#!/usr/bin/env node
/**
 * Verifies that the runtime configuration this build would publish is actually
 * deployable, without writing any artifact.
 *
 * Usage:
 *   node scripts/verify-runtime-config.mjs            # report problems, exit 1
 *   node scripts/verify-runtime-config.mjs --allow-unconfigured
 *
 * The default exit code is the gate: a release pipeline must not publish a
 * bundle whose env.json still contains build placeholders.
 */
import {
  buildRuntimeConfig,
  describeDeployabilityWarnings,
  findDeployabilityProblems,
} from "./generate-runtime-config.mjs";

const allowUnconfigured = process.argv.includes("--allow-unconfigured");

let config;
try {
  config = buildRuntimeConfig(process.env);
} catch (error) {
  console.error(
    `Runtime config is invalid: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exit(1);
}

const problems = findDeployabilityProblems(config);
const warnings = describeDeployabilityWarnings(config);

console.info("Resolved public runtime config:");
for (const [key, value] of Object.entries(config)) {
  console.info(`  ${key}: ${value}`);
}
for (const warning of warnings) console.warn(`WARNING: ${warning}`);

if (problems.length === 0) {
  console.info("Runtime config is deployable.");
  process.exit(0);
}

for (const problem of problems) console.error(`ERROR: ${problem}`);

if (allowUnconfigured) {
  console.warn(
    "Continuing because --allow-unconfigured was passed; this build is NOT deployable.",
  );
  process.exit(0);
}

console.error(
  "Refusing to continue: a deployed bundle built from this environment would ship placeholder configuration.",
);
process.exit(1);
