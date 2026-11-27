import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  constantTimeEqual,
  handleDeleteSubmission,
  handleFileDownload,
  handleFileList,
  handleList,
} from "../src/core.js";

const TOKEN = "s".repeat(40);
const REFERENCE = "df96e095-2f0b-4935-a8ad-e9b8ea208633";
const NOW = Date.UTC(2026, 10, 27, 5, 0, 0);

function createStore(overrides = {}) {
  const rows = new Map([
    [
      REFERENCE,
      {
        id: REFERENCE,
        kind: "participant",
        name: "Ada",
        email: "ada@example.test",
        created_at: "2026-11-27T04:00:00.000Z",
      },
    ],
  ]);
  const files = new Map([
    [
      REFERENCE,
      [
        { id: "file-1", objectKey: "intake/2026/11/a.zip", name: "a.zip" },
        { id: "file-2", objectKey: "intake/2026/11/b.txt", name: "b.txt" },
      ],
    ],
  ]);
  const counters = new Map();

  return {
    rows,
    files,
    counters,
    async readRateToken(bucket) {
      return counters.get(bucket) ?? 0;
    },
    async takeRateToken(bucket) {
      const next = (counters.get(bucket) ?? 0) + 1;
      counters.set(bucket, next);
      return next;
    },
    async listFiles(submissionId) {
      return files.get(submissionId) ?? [];
    },
    async deleteSubmission(submissionId) {
      const existed = rows.delete(submissionId);
      files.delete(submissionId);
      return existed;
    },
    async list(limit) {
      return [...rows.values()].slice(0, limit);
    },
    async findFile() {
      return null;
    },
    async ping() {
      return true;
    },
    ...overrides,
  };
}

function attachmentBucket() {
  const deleted = [];
  return {
    deleted,
    async put() {},
    async get() {
      return null;
    },
    async delete(key) {
      deleted.push(key);
    },
  };
}

function operatorDeps(store, overrides = {}) {
  return {
    store,
    attachments: attachmentBucket(),
    token: TOKEN,
    rateSalt: "test-salt",
    now: NOW,
    requestId: "req-security",
    ...overrides,
  };
}

function deleteRequest(reference, headers = {}) {
  return new Request(`https://intake.example.test/api/intake/${reference}`, {
    method: "DELETE",
    headers: { authorization: `Bearer ${TOKEN}`, ...headers },
  });
}

describe("constantTimeEqual", () => {
  it("matches equal secrets and rejects everything else", async () => {
    assert.equal(await constantTimeEqual("abc", "abc"), true);
    assert.equal(await constantTimeEqual("abc", "abd"), false);
    assert.equal(await constantTimeEqual("abc", "abcd"), false);
    assert.equal(await constantTimeEqual("", ""), true);
  });
});

describe("operator authentication", () => {
  it("hides the routes entirely when no token is configured", async () => {
    const response = await handleList(
      new Request("https://intake.example.test/api/intake"),
      operatorDeps(createStore(), { token: undefined }),
    );
    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), {
      ok: false,
      error: "not_found",
    });
  });

  it("refuses a wrong token and counts the failure", async () => {
    const store = createStore();
    const response = await handleList(
      new Request("https://intake.example.test/api/intake", {
        headers: { authorization: `Bearer ${"w".repeat(40)}` },
      }),
      operatorDeps(store),
    );
    assert.equal(response.status, 401);
    assert.equal([...store.counters.values()][0], 1);
  });

  it("refuses a missing token without revealing the route exists", async () => {
    const response = await handleList(
      new Request("https://intake.example.test/api/intake"),
      operatorDeps(createStore()),
    );
    assert.equal(response.status, 401);
  });

  it("locks out a client that keeps guessing", async () => {
    const store = createStore({
      async readRateToken() {
        return 10;
      },
    });
    const response = await handleList(
      new Request("https://intake.example.test/api/intake", {
        headers: { authorization: `Bearer ${"w".repeat(40)}` },
      }),
      operatorDeps(store),
    );
    assert.equal(response.status, 429);
    assert.ok(Number(response.headers.get("retry-after")) > 0);
  });

  it("serves the record list to the correct token only", async () => {
    const response = await handleList(
      new Request("https://intake.example.test/api/intake", {
        headers: { authorization: `Bearer ${TOKEN}` },
      }),
      operatorDeps(createStore()),
    );
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.count, 1);
    assert.equal(body.rows[0].email, "ada@example.test");
  });

  it("protects the attachment listing and download", async () => {
    const listing = await handleFileList(
      new Request(
        `https://intake.example.test/api/files?submission=${REFERENCE}`,
      ),
      operatorDeps(createStore()),
    );
    assert.equal(listing.status, 401);

    const download = await handleFileDownload(
      new Request("https://intake.example.test/api/files/file-1"),
      operatorDeps(createStore()),
    );
    assert.equal(download.status, 401);
  });
});

describe("erasure", () => {
  it("removes the attachments and the record", async () => {
    const store = createStore();
    const deps = operatorDeps(store);
    const response = await handleDeleteSubmission(
      deleteRequest(REFERENCE),
      deps,
    );

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      ok: true,
      status: "deleted",
      reference: REFERENCE,
      attachments: 2,
    });
    assert.deepEqual(deps.attachments.deleted, [
      "intake/2026/11/a.zip",
      "intake/2026/11/b.txt",
    ]);
    assert.equal(store.rows.has(REFERENCE), false);
    assert.equal(store.files.has(REFERENCE), false);
  });

  it("refuses an unauthenticated erasure", async () => {
    const store = createStore();
    const response = await handleDeleteSubmission(
      deleteRequest(REFERENCE, { authorization: `Bearer ${"w".repeat(40)}` }),
      operatorDeps(store),
    );
    assert.equal(response.status, 401);
    assert.equal(store.rows.has(REFERENCE), true);
  });

  it("refuses a malformed reference", async () => {
    const response = await handleDeleteSubmission(
      deleteRequest("..%2F..%2Fetc%2Fpasswd"),
      operatorDeps(createStore()),
    );
    assert.equal(response.status, 400);
  });

  it("reports an unknown reference rather than pretending to delete", async () => {
    const response = await handleDeleteSubmission(
      deleteRequest("11111111-1111-4111-8111-111111111111"),
      operatorDeps(createStore()),
    );
    assert.equal(response.status, 404);
  });

  it("refuses to erase rows while attachments would survive", async () => {
    const store = createStore();
    const response = await handleDeleteSubmission(deleteRequest(REFERENCE), {
      ...operatorDeps(store),
      attachments: null,
    });
    assert.equal(response.status, 503);
    assert.equal(store.rows.has(REFERENCE), true);
  });
});
