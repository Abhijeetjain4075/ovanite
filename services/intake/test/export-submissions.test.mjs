import assert from "node:assert/strict";
import { mkdtemp, readFile, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";

import {
  exportSubmissions,
  safeFileName,
} from "../scripts/export-submissions.mjs";

const TOKEN = "t".repeat(40);
const ROWS = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    kind: "participant",
    name: "Ada",
    email: "ada@example.test",
    created_at: "2026-11-25T12:00:00.000Z",
  },
];

function jsonResponse(status, body) {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: async () => body,
  };
}

function byteResponse(bytes) {
  return {
    status: 200,
    ok: true,
    json: async () => ({}),
    arrayBuffer: async () => Uint8Array.from(bytes).buffer,
  };
}

function routedFetcher(calls) {
  return async (url, init) => {
    calls.push({ url, init });
    if (url.includes("/api/intake?limit=")) {
      return jsonResponse(200, { ok: true, count: ROWS.length, rows: ROWS });
    }
    if (url.includes("/api/files?submission=")) {
      return jsonResponse(200, {
        ok: true,
        count: 1,
        files: [
          {
            id: "file-1",
            name: "../../demo.zip",
            size: 4,
            contentType: "application/zip",
          },
        ],
      });
    }
    if (url.endsWith("/api/files/file-1")) {
      return byteResponse([0x50, 0x4b, 0x03, 0x04]);
    }
    throw new Error(`unexpected request ${url}`);
  };
}

describe("exportSubmissions", () => {
  it("writes the records and downloads each attachment", async () => {
    const outDir = await mkdtemp(join(tmpdir(), "intake-export-"));
    const calls = [];
    const result = await exportSubmissions({
      origin: "https://intake.example.test",
      token: TOKEN,
      outDir,
      fetcher: routedFetcher(calls),
    });

    assert.equal(result.count, 1);
    assert.equal(result.submissions[0].attachments.length, 1);

    const stored = JSON.parse(
      await readFile(join(outDir, "submissions.json"), "utf8"),
    );
    assert.equal(stored[0].id, ROWS[0].id);

    // A stored name never escapes the export folder.
    const saved = await readFile(
      join(outDir, "attachments", ROWS[0].id, "demo.zip"),
    );
    assert.deepEqual([...saved], [0x50, 0x4b, 0x03, 0x04]);

    const mode = (await stat(join(outDir, "submissions.json"))).mode & 0o777;
    assert.equal(mode, 0o600);

    for (const call of calls) {
      assert.equal(call.init.headers.authorization, `Bearer ${TOKEN}`);
    }
  });

  it("refuses a short or missing token before any request", async () => {
    const outDir = await mkdtemp(join(tmpdir(), "intake-export-"));
    await assert.rejects(
      () => exportSubmissions({ token: "short", outDir, fetcher: async () => {
        throw new Error("should not be called");
      } }),
      /at least 32 characters/,
    );
  });

  it("explains a rejected token instead of writing an empty export", async () => {
    const outDir = await mkdtemp(join(tmpdir(), "intake-export-"));
    await assert.rejects(
      () =>
        exportSubmissions({
          token: TOKEN,
          outDir,
          fetcher: async () => jsonResponse(401, { ok: false }),
        }),
      /rejected the operator token/,
    );
  });
});

describe("safeFileName", () => {
  it("keeps one path segment", () => {
    assert.equal(safeFileName("../../etc/passwd"), "passwd");
    assert.equal(safeFileName("C:\\Users\\ada\\demo.zip"), "demo.zip");
    assert.equal(safeFileName(".."), "attachment");
    assert.equal(safeFileName(""), "attachment");
  });
});
