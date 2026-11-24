#!/usr/bin/env node
/**
 * CycloneDX SBOM for the Motoko backend.
 *
 * Trivy, Grype and similar scanners have no Motoko or Mops ecosystem support, so
 * the backend would otherwise ship without any software bill of materials. This
 * reads the locked dependency graph and emits a deterministic CycloneDX 1.5
 * document, which makes dependency review and diffing possible for the one tree
 * the generic scanners cannot see.
 *
 * Usage:
 *   node scripts/generate-backend-sbom.mjs                 # stdout
 *   node scripts/generate-backend-sbom.mjs --output sbom.json
 *   node scripts/generate-backend-sbom.mjs --check         # validate the lockfile only
 */
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const LOCK_PATH = "mops.lock";

function parseArgs(argv) {
  const args = { output: null, check: false };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--check") args.check = true;
    else if (value === "--output") {
      args.output = argv[index + 1];
      index += 1;
    } else if (value.startsWith("--output=")) {
      args.output = value.slice("--output=".length);
    } else {
      throw new Error(`Unknown argument: ${value}`);
    }
  }
  return args;
}

function parseComponentKey(key) {
  const at = key.lastIndexOf("@");
  if (at <= 0) return null;
  const name = key.slice(0, at).trim();
  const version = key.slice(at + 1).trim();
  if (!/^[a-z0-9][a-z0-9._-]*$/i.test(name)) return null;
  if (!/^[0-9][0-9A-Za-z.+-]*$/.test(version)) return null;
  return { name, version };
}

/** Deterministic UUID derived from the component set, so unchanged locks match. */
function serialNumber(seed) {
  const hash = createHash("sha256").update(seed).digest();
  const bytes = Buffer.from(hash.subarray(0, 16));
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `urn:uuid:${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function buildBackendSbom(lockText, { timestamp = new Date().toISOString() } = {}) {
  let lock;
  try {
    lock = JSON.parse(lockText);
  } catch (error) {
    throw new Error(`mops.lock is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }

  const graph = lock?.graph;
  if (typeof graph !== "object" || graph === null || Array.isArray(graph)) {
    throw new Error("mops.lock has no dependency graph; run `mops install` before generating an SBOM.");
  }

  const components = [];
  const seen = new Set();
  for (const key of Object.keys(graph)) {
    const parsed = parseComponentKey(key);
    if (!parsed) {
      throw new Error(`Unparseable dependency key in mops.lock: ${key}`);
    }
    if (seen.has(key)) continue;
    seen.add(key);
    components.push({
      type: "library",
      name: parsed.name,
      version: parsed.version,
      purl: `pkg:mops/${parsed.name}@${parsed.version}`,
      "bom-ref": `pkg:mops/${parsed.name}@${parsed.version}`,
    });
  }

  components.sort(
    (left, right) =>
      left.name.localeCompare(right.name) || left.version.localeCompare(right.version),
  );

  if (components.length === 0) {
    throw new Error("Refusing to emit an empty backend SBOM; the lockfile graph is empty.");
  }

  const seed = components.map((component) => component["bom-ref"]).join("\n");

  return {
    bomFormat: "CycloneDX",
    specVersion: "1.5",
    serialNumber: serialNumber(seed),
    version: 1,
    metadata: {
      timestamp,
      tools: [
        {
          vendor: "Ovanite",
          name: "generate-backend-sbom",
          version: "1.0.0",
        },
      ],
      component: {
        type: "application",
        name: "ovanite-backend",
        "bom-ref": "pkg:generic/ovanite-backend",
      },
    },
    components,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const lockText = await readFile(LOCK_PATH, "utf8");
  const sbom = buildBackendSbom(lockText, args.check ? { timestamp: "1970-01-01T00:00:00.000Z" } : {});
  const serialized = `${JSON.stringify(sbom, null, 2)}\n`;

  if (args.check) {
    console.info(
      `Backend SBOM is valid: ${sbom.components.length} Mops components, serial ${sbom.serialNumber}.`,
    );
    return;
  }
  if (args.output) {
    await writeFile(args.output, serialized, "utf8");
    console.info(
      `Wrote ${sbom.components.length} Mops components to ${args.output}.`,
    );
    return;
  }
  process.stdout.write(serialized);
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
