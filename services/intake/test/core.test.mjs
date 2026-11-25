import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { handleList, handleSubmission } from "../src/core.js";

const ALLOWED = ["https://ovanite.vercel.app"];

function createMemoryStore() {
  const rows = new Map();
  const dedupe = new Map();
  const counters = new Map();

  return {
    rows,
    counters,
    async findByDedupe(kind, hash) {
      return dedupe.get(`${kind}:${hash}`) ?? null;
    },
    async insert(record) {
      const key = `${record.kind}:${record.dedupeHash}`;
      if (dedupe.has(key)) {
        const error = new Error("duplicate submission");
        error.code = "DUPLICATE";
        throw error;
      }
      dedupe.set(key, record.id);
      rows.set(record.id, record);
    },
    async takeRateToken(bucket) {
      const next = (counters.get(bucket) ?? 0) + 1;
      counters.set(bucket, next);
      return next;
    },
    // Mirrors the D1 projection: the IP digest is never part of the read path.
    async list(limit) {
      return [...rows.values()]
        .slice(0, limit)
        .map(({ ipHash, dedupeHash, requestId, ...rest }) => rest);
    },
    async ping() {
      return true;
    },
  };
}

function submission(body, init = {}) {
  return new Request("https://intake.example.test/api/intake", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: ALLOWED[0],
      "cf-connecting-ip": "203.0.113.7",
      ...(init.headers ?? {}),
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function deps(store, overrides = {}) {
  return {
    store,
    now: Date.UTC(2026, 10, 25, 12, 0, 0),
    rateSalt: "test-salt",
    allowedOrigins: ALLOWED,
    requestId: "req-test",
    ...overrides,
  };
}

const validContact = {
  kind: "contact",
  name: "Ada Lovelace",
  email: "ada@example.test",
  message: "I would like to discuss a product partnership.",
};

describe("handleSubmission", () => {
  it("stores a valid submission and returns only a reference", async () => {
    const store = createMemoryStore();
    const response = await handleSubmission(
      submission(validContact),
      deps(store),
    );

    assert.equal(response.status, 201);
    const body = await response.json();
    assert.deepEqual(Object.keys(body).sort(), ["ok", "reference", "status"]);
    assert.equal(body.status, "received");
    assert.equal(store.rows.size, 1);

    const stored = [...store.rows.values()][0];
    assert.equal(stored.email, "ada@example.test");
    assert.equal(stored.sourceOrigin, ALLOWED[0]);
    // The raw client address must never be persisted.
    assert.notEqual(stored.ipHash, "203.0.113.7");
    assert.match(stored.ipHash, /^[0-9a-f]{64}$/);
  });

  it("reports duplicate submissions without storing twice", async () => {
    const store = createMemoryStore();
    const first = await handleSubmission(submission(validContact), deps(store));
    assert.equal(first.status, 201);

    const second = await handleSubmission(submission(validContact), deps(store));
    assert.equal(second.status, 200);
    const body = await second.json();
    assert.equal(body.status, "duplicate");
    assert.equal(store.rows.size, 1);
  });

  it("rejects missing and malformed fields without echoing values", async () => {
    const store = createMemoryStore();
    const response = await handleSubmission(
      submission({ kind: "contact", name: "A", email: "nope", message: "short" }),
      deps(store),
    );

    assert.equal(response.status, 400);
    const body = await response.json();
    assert.equal(body.error, "invalid");
    assert.ok(body.fields.name);
    assert.ok(body.fields.email);
    assert.ok(body.fields.message);
    const serialized = JSON.stringify(body);
    assert.equal(serialized.includes("nope"), false);
    assert.equal(store.rows.size, 0);
  });

  it("requires a valid HTTPS evidence link for participant submissions", async () => {
    const store = createMemoryStore();
    const base = {
      kind: "participant",
      name: "Grace Hopper",
      email: "grace@example.test",
      project: "Compiler",
      message: "A working compiler with measured results.",
    };

    const insecure = await handleSubmission(
      submission({ ...base, repository: "http://example.test/repo" }),
      deps(store),
    );
    assert.equal(insecure.status, 400);
    assert.ok((await insecure.json()).fields.repository);

    const accepted = await handleSubmission(
      submission({ ...base, repository: "https://example.test/repo" }),
      deps(store),
    );
    assert.equal(accepted.status, 201);
  });

  it("accepts and drops honeypot traffic without storing it", async () => {
    const store = createMemoryStore();
    const response = await handleSubmission(
      submission({ ...validContact, website: "https://spam.example.test" }),
      deps(store),
    );

    assert.equal(response.status, 201);
    assert.equal((await response.json()).status, "received");
    assert.equal(store.rows.size, 0);
  });

  it("rate limits a burst and advertises a retry window", async () => {
    const store = createMemoryStore();
    const statuses = [];
    for (let index = 0; index < 6; index += 1) {
      const response = await handleSubmission(
        submission({ ...validContact, message: `Message number ${index} with detail.` }),
        deps(store),
      );
      statuses.push(response.status);
      if (response.status === 429) {
        assert.equal(response.headers.get("retry-after"), "3600");
      }
    }

    assert.deepEqual(statuses, [201, 201, 201, 201, 201, 429]);
  });

  it("refuses an unknown browser origin", async () => {
    const store = createMemoryStore();
    const response = await handleSubmission(
      submission(validContact, { headers: { origin: "https://evil.example.test" } }),
      deps(store),
    );

    assert.equal(response.status, 403);
    assert.equal((await response.json()).error, "origin_not_allowed");
  });

  it("refuses non-JSON, malformed JSON and oversized payloads", async () => {
    const store = createMemoryStore();

    const wrongType = await handleSubmission(
      submission(validContact, { headers: { "content-type": "text/plain" } }),
      deps(store),
    );
    assert.equal(wrongType.status, 415);

    const malformed = await handleSubmission(submission("{not json"), deps(store));
    assert.equal(malformed.status, 400);
    assert.equal((await malformed.json()).error, "invalid_json");

    const oversized = await handleSubmission(
      submission({ ...validContact, message: "x".repeat(20_000) }),
      deps(store),
    );
    assert.equal(oversized.status, 413);
    assert.equal(store.rows.size, 0);
  });

  it("rejects a non-POST method", async () => {
    const store = createMemoryStore();
    const response = await handleSubmission(
      new Request("https://intake.example.test/api/intake", { method: "PUT" }),
      deps(store),
    );
    assert.equal(response.status, 405);
  });
});

describe("handleList", () => {
  it("is absent without a configured token", async () => {
    const store = createMemoryStore();
    const response = await handleList(
      new Request("https://intake.example.test/api/intake"),
      { store, token: undefined },
    );
    assert.equal(response.status, 404);
  });

  it("rejects a wrong bearer token and never returns the IP digest", async () => {
    const store = createMemoryStore();
    await handleSubmission(submission(validContact), deps(store));

    const denied = await handleList(
      new Request("https://intake.example.test/api/intake", {
        headers: { authorization: "Bearer wrong-token" },
      }),
      { store, token: "a".repeat(40) },
    );
    assert.equal(denied.status, 401);

    const allowed = await handleList(
      new Request("https://intake.example.test/api/intake", {
        headers: { authorization: `Bearer ${"a".repeat(40)}` },
      }),
      { store, token: "a".repeat(40) },
    );
    assert.equal(allowed.status, 200);
    const body = await allowed.json();
    assert.equal(body.count, 1);
    assert.equal(JSON.stringify(body).includes("ipHash"), false);
  });
});
