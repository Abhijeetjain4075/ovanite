import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { buildBackendSbom } from "./generate-backend-sbom.mjs";

const fixture = JSON.stringify({
  version: 3,
  deps: { core: "2.6.2" },
  graph: {
    "core@2.6.2": {},
    "json@1.4.0": { core: "2.6.2" },
    "base@0.11.1": {},
  },
});

test("emits one CycloneDX component per locked dependency", () => {
  const sbom = buildBackendSbom(fixture, { timestamp: "2026-01-01T00:00:00.000Z" });
  assert.equal(sbom.bomFormat, "CycloneDX");
  assert.equal(sbom.specVersion, "1.5");
  assert.equal(sbom.components.length, 3);
  assert.deepEqual(
    sbom.components.map((component) => component.purl),
    ["pkg:mops/base@0.11.1", "pkg:mops/core@2.6.2", "pkg:mops/json@1.4.0"],
  );
  assert.match(sbom.serialNumber, /^urn:uuid:[0-9a-f-]{36}$/);
});

test("is deterministic for an unchanged lockfile", () => {
  const first = buildBackendSbom(fixture, { timestamp: "2026-01-01T00:00:00.000Z" });
  const second = buildBackendSbom(fixture, { timestamp: "2026-01-01T00:00:00.000Z" });
  assert.equal(first.serialNumber, second.serialNumber);
  assert.deepEqual(first.components, second.components);
});

test("refuses an empty, malformed, or unparseable lockfile", () => {
  assert.throws(() => buildBackendSbom("not json"), /not valid JSON/);
  assert.throws(() => buildBackendSbom("{}"), /no dependency graph/);
  assert.throws(
    () => buildBackendSbom(JSON.stringify({ graph: { "no-version": {} } })),
    /Unparseable dependency key/,
  );
  assert.throws(
    () => buildBackendSbom(JSON.stringify({ graph: {} })),
    /empty backend SBOM/,
  );
});

test("the repository lockfile produces a non-trivial SBOM", async () => {
  const lockText = await readFile("mops.lock", "utf8");
  const sbom = buildBackendSbom(lockText, { timestamp: "2026-01-01T00:00:00.000Z" });
  assert.ok(sbom.components.length >= 10, `expected a real dependency tree, got ${sbom.components.length}`);
  for (const component of sbom.components) {
    assert.ok(component.purl.startsWith("pkg:mops/"));
    assert.ok(component.version.length > 0);
  }
});
