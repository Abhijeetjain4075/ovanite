import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";

import {
  findCredentialShapes,
  isForbiddenPath,
  scanRepository,
} from "./scan-secrets.mjs";

describe("isForbiddenPath", () => {
  it("refuses secrets, exports, key material and dotenv files", () => {
    for (const path of [
      ".secrets/intake-admin-token",
      "intake-export/submissions.json",
      "nested/.env",
      "config/.env.production",
      "ops/.dev.vars",
      "credentials.json",
      "certs/server.pem",
      "id_rsa",
    ]) {
      assert.ok(isForbiddenPath(path), path);
    }
  });

  it("allows documented templates and ordinary source", () => {
    for (const path of [
      ".env.example",
      ".env.sample",
      ".env.template",
      "src/frontend/src/lib/intake.ts",
      "services/intake/src/core.js",
      "docs/operations/backup-and-retention.md",
    ]) {
      assert.equal(isForbiddenPath(path), null, path);
    }
  });
});

describe("findCredentialShapes", () => {
  it("recognises common credential shapes", () => {
    assert.deepEqual(findCredentialShapes("a ghp_" + "a".repeat(30)), [
      "github-token",
    ]);
    assert.deepEqual(findCredentialShapes("AKIA" + "A".repeat(16)), [
      "aws-access-key",
    ]);
    assert.deepEqual(
      findCredentialShapes("-----BEGIN RSA PRIVATE KEY-----"),
      ["private-key-block"],
    );
    assert.deepEqual(
      findCredentialShapes("Authorization: Bearer " + "a".repeat(40)),
      ["bearer-literal"],
    );
  });

  it("does not flag documentation that interpolates a variable", () => {
    assert.deepEqual(
      findCredentialShapes("-H \"Authorization: Bearer $INTAKE_ADMIN_TOKEN\""),
      [],
    );
    assert.deepEqual(findCredentialShapes(""), []);
  });
});

async function seedRepository(files) {
  const cwd = await mkdtemp(join(tmpdir(), "secret-scan-"));
  execFileSync("git", ["init", "-q"], { cwd });
  execFileSync("git", ["config", "user.email", "scan@example.test"], { cwd });
  execFileSync("git", ["config", "user.name", "scan"], { cwd });
  for (const [path, content] of Object.entries(files)) {
    const target = join(cwd, path);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, content);
  }
  execFileSync("git", ["add", "-A"], { cwd });
  execFileSync("git", ["commit", "-qm", "seed"], { cwd });
  return cwd;
}

describe("scanRepository", () => {
  it("reports nothing for a clean repository", async () => {
    const cwd = await seedRepository({ "notes.txt": "harmless\n" });
    const { findings } = scanRepository({ cwd, needles: ["supersecretvalue"] });
    assert.deepEqual(findings, []);
  });

  it("catches a committed token, a forbidden path and a credential shape", async () => {
    const cwd = await seedRepository({
      "leak.txt": "token=supersecretvalue\n",
      ".secrets/token": "supersecretvalue\n",
      "deploy.sh": "curl -H 'Authorization: Bearer " + "b".repeat(40) + "'\n",
    });
    const { findings } = scanRepository({ cwd, needles: ["supersecretvalue"] });

    const kinds = findings.map((finding) => finding.kind);
    assert.ok(kinds.includes("tracked-path"), "tracked forbidden path");
    assert.ok(kinds.includes("historical-path"), "historical forbidden path");
    assert.ok(kinds.includes("known-value"), "known value in history");
    assert.ok(kinds.includes("credential-shape"), "credential shape");
  });

  it("searches short needles too, above the noise floor", async () => {
    const cwd = await seedRepository({ "notes.txt": "brand: Ovanite\n" });
    const { findings } = scanRepository({ cwd, needles: ["Ovanite"] });
    assert.equal(findings.length, 1);
    assert.equal(findings[0].kind, "known-value");
  });

  it("never prints the secret value in its findings", async () => {
    const cwd = await seedRepository({
      "leak.txt": "token=supersecretvalue\n",
    });
    const { findings } = scanRepository({ cwd, needles: ["supersecretvalue"] });
    assert.ok(findings.length > 0);
    assert.equal(JSON.stringify(findings).includes("supersecretvalue"), false);
  });
});
