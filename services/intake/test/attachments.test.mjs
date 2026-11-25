import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { handleFileDownload, handleFileList, handleSubmission } from "../src/core.js";
import {
  MAX_FILES,
  extensionOf,
  inspectAttachment,
  objectKeyFor,
  sanitizeFileName,
  validateAttachment,
} from "../src/files.js";

const ALLOWED = ["https://ovanite.vercel.app"];
const TOKEN = "t".repeat(40);
const NOW = Date.UTC(2026, 10, 25, 12, 0, 0);

const ZIP_BYTES = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x00, 0x00]);
const GZ_BYTES = new Uint8Array([0x1f, 0x8b, 0x08, 0x00, 0x00, 0x00]);

function createMemoryStore() {
  const rows = new Map();
  const files = new Map();
  const dedupe = new Map();
  const counters = new Map();

  const store = {
    rows,
    files,
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
    async insertFiles(fileRows) {
      for (const row of fileRows) files.set(row.id, row);
    },
    async insertWithFiles(record, fileRows) {
      await store.insert(record);
      await store.insertFiles(fileRows);
    },
    async listFiles(submissionId) {
      return [...files.values()].filter((row) => row.submissionId === submissionId);
    },
    async findFile(fileId) {
      return files.get(fileId) ?? null;
    },
    async takeRateToken(bucket) {
      const next = (counters.get(bucket) ?? 0) + 1;
      counters.set(bucket, next);
      return next;
    },
    async list(limit) {
      return [...rows.values()]
        .slice(0, limit)
        .map(({ ipHash, dedupeHash, requestId, ...rest }) => rest);
    },
    async ping() {
      return true;
    },
  };
  return store;
}

function createMemoryBucket() {
  const objects = new Map();
  return {
    objects,
    async put(key, bytes, meta) {
      objects.set(key, { bytes, meta });
    },
    async get(key) {
      const object = objects.get(key);
      if (!object) return null;
      return { body: object.bytes, key };
    },
    async delete(key) {
      objects.delete(key);
    },
  };
}

function multipart(payload, files) {
  const form = new FormData();
  form.set("payload", JSON.stringify(payload));
  for (const file of files) {
    form.append("files", file);
  }
  return new Request("https://intake.example.test/api/intake", {
    method: "POST",
    headers: {
      origin: ALLOWED[0],
      "cf-connecting-ip": "203.0.113.7",
    },
    body: form,
  });
}

const participant = {
  kind: "participant",
  name: "Grace Hopper",
  email: "grace@example.test",
  project: "Compiler",
  message: "A working compiler with measured results.",
};

function deps(store, bucket, overrides = {}) {
  return {
    store,
    attachments: bucket,
    now: NOW,
    rateSalt: "test-salt",
    allowedOrigins: ALLOWED,
    requestId: "req-test",
    ...overrides,
  };
}

describe("attachment policy", () => {
  it("recognises multi-part and plain extensions", () => {
    assert.equal(extensionOf("bundle.tar.gz"), ".tar.gz");
    assert.equal(extensionOf("bundle.TGZ"), ".tgz");
    assert.equal(extensionOf("src/main.tsx"), ".tsx");
    assert.equal(extensionOf("README"), "");
    assert.equal(extensionOf(".env"), "");
  });

  it("strips directory components and control characters from names", () => {
    assert.equal(sanitizeFileName("../../etc/passwd.zip"), "passwd.zip");
    assert.equal(sanitizeFileName("C:\\builds\\app.zip"), "app.zip");
    assert.equal(sanitizeFileName("bad\u0000name.zip"), "badname.zip");
    assert.equal(sanitizeFileName("   "), "attachment");
  });

  it("generates keys that cannot include visitor text", () => {
    const key = objectKeyFor(".zip", NOW);
    assert.match(key, /^intake\/2026\/11\/[0-9a-f-]{36}\.zip$/);
    assert.notEqual(objectKeyFor(".zip", NOW), key);
  });

  it("rejects empty, oversized and unknown file types", () => {
    assert.ok(validateAttachment("empty.zip", 0));
    assert.ok(validateAttachment("huge.zip", 21 * 1024 * 1024));
    assert.ok(validateAttachment("installer.exe", 10));
    assert.ok(validateAttachment("script.sh.weird", 10));
    assert.equal(validateAttachment("bundle.zip", 1024), null);
    assert.equal(validateAttachment("main.py", 1024), null);
  });

  it("requires the bytes to match the declared archive type", () => {
    assert.ok(inspectAttachment("bundle.zip", new TextEncoder().encode("not a zip")));
    assert.equal(inspectAttachment("bundle.zip", ZIP_BYTES), null);
    assert.equal(inspectAttachment("bundle.tar.gz", GZ_BYTES), null);
    assert.ok(inspectAttachment("bundle.tar.gz", ZIP_BYTES));
    assert.ok(inspectAttachment("main.py", new Uint8Array([0x00, 0x01, 0x02])));
    assert.equal(inspectAttachment("main.py", new TextEncoder().encode("print(1)\n")), null);
  });
});

describe("handleSubmission with attachments", () => {
  it("stores the record and its object under a generated key", async () => {
    const store = createMemoryStore();
    const bucket = createMemoryBucket();
    const file = new File([ZIP_BYTES], "../../release.zip", {
      type: "application/zip",
    });

    const response = await handleSubmission(
      multipart(participant, [file]),
      deps(store, bucket),
    );

    assert.equal(response.status, 201);
    const body = await response.json();
    assert.equal(body.status, "received");
    assert.deepEqual(body.attachments, [{ name: "release.zip", size: ZIP_BYTES.length }]);

    assert.equal(store.rows.size, 1);
    assert.equal(store.files.size, 1);
    assert.equal(bucket.objects.size, 1);
    const [key] = [...bucket.objects.keys()];
    assert.match(key, /^intake\/2026\/11\/[0-9a-f-]{36}\.zip$/);
    assert.equal(key.includes("release"), false);

    const [row] = [...store.files.values()];
    assert.equal(row.name, "release.zip");
    assert.equal(row.contentType, "application/zip");
    assert.match(row.digest, /^[0-9a-f]{64}$/);
  });

  it("reports a duplicate without storing a second object", async () => {
    const store = createMemoryStore();
    const bucket = createMemoryBucket();
    const build = () =>
      multipart(participant, [new File([ZIP_BYTES], "release.zip")]);

    const first = await handleSubmission(build(), deps(store, bucket));
    assert.equal(first.status, 201);
    const second = await handleSubmission(build(), deps(store, bucket));
    assert.equal(second.status, 200);
    assert.equal((await second.json()).status, "duplicate");
    assert.equal(bucket.objects.size, 1);
    assert.equal(store.files.size, 1);
  });

  it("refuses a renamed text file, an unlisted type and too many files", async () => {
    const store = createMemoryStore();
    const bucket = createMemoryBucket();

    const disguised = await handleSubmission(
      multipart(participant, [
        new File([new TextEncoder().encode("hello")], "bundle.zip"),
      ]),
      deps(store, bucket),
    );
    assert.equal(disguised.status, 400);
    assert.ok((await disguised.json()).fields.files);

    const executable = await handleSubmission(
      multipart(participant, [new File([ZIP_BYTES], "setup.exe")]),
      deps(store, bucket),
    );
    assert.equal(executable.status, 400);

    const many = await handleSubmission(
      multipart(
        participant,
        Array.from({ length: MAX_FILES + 1 }, (_, index) =>
          new File([ZIP_BYTES], `bundle-${index}.zip`),
        ),
      ),
      deps(store, bucket),
    );
    assert.equal(many.status, 400);

    assert.equal(store.rows.size, 0);
    assert.equal(bucket.objects.size, 0);
  });

  it("refuses attachments when no object bucket is configured", async () => {
    const store = createMemoryStore();
    const response = await handleSubmission(
      multipart(participant, [new File([ZIP_BYTES], "release.zip")]),
      deps(store, null),
    );
    assert.equal(response.status, 503);
    assert.equal(store.rows.size, 0);
  });

  it("removes stored objects when the row cannot be written", async () => {
    const store = createMemoryStore();
    store.insert = async () => {
      throw new Error("d1 unavailable");
    };
    const bucket = createMemoryBucket();

    const response = await handleSubmission(
      multipart(participant, [new File([ZIP_BYTES], "release.zip")]),
      deps(store, bucket),
    );

    assert.equal(response.status, 500);
    assert.equal(bucket.objects.size, 0);
  });
});

describe("operator attachment routes", () => {
  it("lists attachments only for the operator token", async () => {
    const store = createMemoryStore();
    const bucket = createMemoryBucket();
    const created = await handleSubmission(
      multipart(participant, [new File([ZIP_BYTES], "release.zip")]),
      deps(store, bucket),
    );
    const { reference } = await created.json();

    const anonymous = await handleFileList(
      new Request(`https://intake.example.test/api/files?submission=${reference}`),
      { store, attachments: bucket, token: TOKEN },
    );
    assert.equal(anonymous.status, 401);

    const hidden = await handleFileList(
      new Request(`https://intake.example.test/api/files?submission=${reference}`),
      { store, attachments: bucket, token: undefined },
    );
    assert.equal(hidden.status, 404);

    const allowed = await handleFileList(
      new Request(`https://intake.example.test/api/files?submission=${reference}`, {
        headers: { authorization: `Bearer ${TOKEN}` },
      }),
      { store, attachments: bucket, token: TOKEN },
    );
    assert.equal(allowed.status, 200);
    const body = await allowed.json();
    assert.equal(body.count, 1);
    assert.equal(body.files[0].name, "release.zip");
    assert.equal(body.files[0].objectKey, undefined);
  });

  it("downloads bytes as an attachment for the operator only", async () => {
    const store = createMemoryStore();
    const bucket = createMemoryBucket();
    const created = await handleSubmission(
      multipart(participant, [new File([ZIP_BYTES], "release.zip")]),
      deps(store, bucket),
    );
    const { reference } = await created.json();
    const [fileRow] = await store.listFiles(reference);

    const denied = await handleFileDownload(
      new Request(`https://intake.example.test/api/files/${fileRow.id}`),
      { store, attachments: bucket, token: TOKEN },
    );
    assert.equal(denied.status, 401);

    const allowed = await handleFileDownload(
      new Request(`https://intake.example.test/api/files/${fileRow.id}`, {
        headers: { authorization: `Bearer ${TOKEN}` },
      }),
      { store, attachments: bucket, token: TOKEN },
    );
    assert.equal(allowed.status, 200);
    assert.equal(allowed.headers.get("content-type"), "application/zip");
    assert.match(allowed.headers.get("content-disposition"), /attachment; filename="release\.zip"/);
    assert.equal(allowed.headers.get("x-content-type-options"), "nosniff");
    const bytes = new Uint8Array(await allowed.arrayBuffer());
    assert.deepEqual([...bytes], [...ZIP_BYTES]);
  });
});
