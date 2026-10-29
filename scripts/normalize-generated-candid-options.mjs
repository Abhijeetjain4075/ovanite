import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

/**
 * Candid option values must distinguish "not provided" (undefined) from
 * provided falsy values such as "", 0n, or false. Some generated expressions
 * use JavaScript truthiness, which incorrectly encodes those values as None.
 *
 * Keep this postprocessor deterministic and idempotent so the output of the
 * pinned binding generator remains reproducible in CI and local builds.
 */
const OPTIONAL_VALUE_PATTERN =
  /value\.([A-Za-z_$][\w$]*)\s*\?\s*candid_some\(value\.\1\)\s*:\s*candid_none\(\)/g;

export function normalizeOptionalCandidValues(source) {
  if (typeof source !== "string") {
    throw new TypeError("Generated binding source must be a string.");
  }

  let replacements = 0;
  const content = source.replace(
    OPTIONAL_VALUE_PATTERN,
    (_match, property) => {
      replacements += 1;
      return `value.${property} !== undefined ? candid_some(value.${property}) : candid_none()`;
    },
  );

  return { content, replacements };
}

async function main() {
  const outputPath = resolve("src/frontend/src/backend.ts");
  const source = await readFile(outputPath, "utf8");
  const result = normalizeOptionalCandidValues(source);
  if (result.content !== source) {
    await writeFile(outputPath, result.content, "utf8");
  }
  console.info(
    `Normalized ${result.replacements} optional Candid value encoder(s) in ${outputPath}.`,
  );
}

if (process.argv[1] && resolve(process.argv[1]) === resolve("scripts/normalize-generated-candid-options.mjs")) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
