/**
 * Ovanite intake API — request handling.
 *
 * One endpoint serves every public intake surface on the site (contact,
 * waitlist, participant submission). It is deliberately transport-agnostic: the
 * Worker entrypoint supplies a store, an object bucket, a clock and an origin
 * allowlist, so the whole contract — validation, attachments, rate limiting,
 * duplicate detection, error shapes — is testable without a database or a
 * network.
 *
 * Guarantees:
 *   - nothing from the request is echoed back except field names;
 *   - unexpected failures return a generic `unavailable` error, never a stack,
 *     SQL fragment, host name or provider detail;
 *   - a visitor gets `received` only after the record and its attachments are
 *     durably stored;
 *   - attachments are stored under generated keys, never unpacked and never
 *     reachable without the operator token.
 */
import {
  MAX_FILES,
  MAX_TOTAL_BYTES,
  MULTIPART_OVERHEAD_BYTES,
  contentTypeFor,
  extensionOf,
  inspectAttachment,
  objectKeyFor,
  sanitizeFileName,
  validateAttachment,
} from "./files.js";

export const INTAKE_KINDS = ["contact", "waitlist", "participant"];

const MAX_BODY_BYTES = 16 * 1024;
const MAX_MULTIPART_BYTES = MAX_TOTAL_BYTES + MULTIPART_OVERHEAD_BYTES;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_HOME_FIELD = "website";

const LIMITS = {
  name: 120,
  email: 254,
  message: 4000,
  note: 500,
  project: 120,
  stack: 300,
  repository: 500,
  status: 60,
};

const REQUIRED = {
  contact: ["name", "email", "message"],
  waitlist: ["name", "email"],
  participant: ["name", "email", "project", "message"],
};

const MESSAGES = {
  name: "Please enter your name.",
  email: "Please enter a valid email address.",
  message: "Please provide at least 10 characters of detail.",
  note: "Please keep this note shorter.",
  project: "Please name the project.",
  stack: "Please keep the stack description shorter.",
  repository: "Please provide an HTTPS link.",
  status: "Please keep the status shorter.",
};

const RATE_LIMITS = [
  { bucket: "hour", windowMs: 60 * 60 * 1000, max: 5 },
  { bucket: "day", windowMs: 24 * 60 * 60 * 1000, max: 20 },
];

function json(status, body, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      "referrer-policy": "no-referrer",
      // No response from this service is a document, a frame or a shared
      // resource: it is JSON read by one caller and nothing else.
      "cross-origin-resource-policy": "same-origin",
      "strict-transport-security": "max-age=31536000; includeSubDomains",
      ...extraHeaders,
    },
  });
}

async function sha256Hex(value) {
  const input =
    typeof value === "string" ? new TextEncoder().encode(value) : value;
  const digest = await crypto.subtle.digest("SHA-256", input);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isHttpsUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" && !parsed.username && !parsed.password;
  } catch {
    return false;
  }
}

/**
 * Returns `{ fields, values }` — `fields` maps an invalid field to a visitor
 * message, `values` holds the normalized record when validation passes.
 */
export function validateSubmission(kind, body) {
  const fields = {};
  if (!INTAKE_KINDS.includes(kind)) {
    return { fields: { kind: "Unknown submission type." }, values: null };
  }

  const values = {};
  for (const [field, limit] of Object.entries(LIMITS)) {
    const value = cleanString(body[field]);
    if (value.length > limit) {
      fields[field] = MESSAGES[field] ?? "This field is too long.";
      continue;
    }
    if (value) values[field] = value;
  }

  for (const field of REQUIRED[kind]) {
    if (!values[field]) fields[field] = MESSAGES[field] ?? "Required.";
  }

  if (values.name && values.name.length < 2) {
    fields.name = "Name must be at least 2 characters.";
  }
  if (values.email && !EMAIL_PATTERN.test(values.email)) {
    fields.email = MESSAGES.email;
  }
  if (values.message && values.message.length < 10) {
    fields.message = MESSAGES.message;
  }
  if (values.repository && !isHttpsUrl(values.repository)) {
    fields.repository = MESSAGES.repository;
  }

  if (Object.keys(fields).length > 0) return { fields, values: null };
  return { fields, values };
}

function dedupeMaterial(kind, values, attachmentDigests) {
  return JSON.stringify([
    kind,
    values.email.toLowerCase(),
    values.name,
    values.message ?? "",
    values.project ?? "",
    attachmentDigests,
  ]);
}

async function applyRateLimit(store, fingerprint, now) {
  for (const rule of RATE_LIMITS) {
    const windowStart = Math.floor(now / rule.windowMs) * rule.windowMs;
    const bucket = `${fingerprint}:${rule.bucket}:${windowStart}`;
    const count = await store.takeRateToken(bucket, windowStart);
    if (count > rule.max) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((windowStart + rule.windowMs - now) / 1000),
      );
      return retryAfterSeconds;
    }
  }
  return null;
}

function isMultipart(contentType) {
  return contentType.toLowerCase().includes("multipart/form-data");
}

/**
 * Reads the submission envelope. JSON keeps the original single-part contract;
 * a multipart request carries the same JSON in a `payload` field plus zero or
 * more `files` parts.
 */
async function readSubmission(request, contentType) {
  const declaredLength = Number(request.headers.get("content-length") ?? 0);

  if (isMultipart(contentType)) {
    if (Number.isFinite(declaredLength) && declaredLength > MAX_MULTIPART_BYTES) {
      return { errorResponse: json(413, { ok: false, error: "payload_too_large" }) };
    }
    let form;
    try {
      form = await request.formData();
    } catch {
      return { errorResponse: json(400, { ok: false, error: "invalid_payload" }) };
    }
    const payload = form.get("payload");
    if (typeof payload !== "string" || payload.length > MAX_BODY_BYTES) {
      return { errorResponse: json(400, { ok: false, error: "invalid_payload" }) };
    }
    let body;
    try {
      body = JSON.parse(payload);
    } catch {
      return { errorResponse: json(400, { ok: false, error: "invalid_json" }) };
    }
    const files = form
      .getAll("files")
      .filter((entry) => typeof entry === "object" && entry !== null);
    return { body, files };
  }

  if (!contentType.toLowerCase().includes("application/json")) {
    return { errorResponse: json(415, { ok: false, error: "unsupported_media_type" }) };
  }
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return { errorResponse: json(413, { ok: false, error: "payload_too_large" }) };
  }
  let body;
  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) {
      return { errorResponse: json(413, { ok: false, error: "payload_too_large" }) };
    }
    body = JSON.parse(raw);
  } catch {
    return { errorResponse: json(400, { ok: false, error: "invalid_json" }) };
  }
  return { body, files: [] };
}

/**
 * Validates every attached file and turns it into an upload candidate.
 * Returns `{ problem, fieldError }` on rejection.
 */
async function prepareAttachments(files) {
  if (files.length > MAX_FILES) {
    return { fieldError: `Attach at most ${MAX_FILES} files.` };
  }

  let total = 0;
  const prepared = [];
  for (const entry of files) {
    const name = sanitizeFileName(entry.name);
    const size = typeof entry.size === "number" ? entry.size : 0;
    total += size;

    const declaredProblem = validateAttachment(name, size);
    if (declaredProblem) return { fieldError: declaredProblem };

    let bytes;
    try {
      bytes = new Uint8Array(await entry.arrayBuffer());
    } catch {
      return { fieldError: "That file could not be read." };
    }
    if (bytes.length !== size) {
      return { fieldError: "That file could not be read completely. Please try again." };
    }
    const byteProblem = inspectAttachment(name, bytes);
    if (byteProblem) return { fieldError: byteProblem };

    const extension = extensionOf(name);
    prepared.push({
      name,
      size: bytes.length,
      extension,
      contentType: contentTypeFor(extension),
      bytes,
      digest: await sha256Hex(bytes),
    });
  }

  if (total > MAX_TOTAL_BYTES) {
    return { fieldError: "Attachments must total 25 MB or less." };
  }
  return { prepared };
}

/**
 * POST /api/intake
 */
export async function handleSubmission(request, deps) {
  const { store, allowedOrigins, now, rateSalt, requestId } = deps;
  const attachments = deps.attachments ?? null;

  if (request.method !== "POST") {
    return json(405, { ok: false, error: "method_not_allowed" }, { allow: "POST, OPTIONS" });
  }

  const origin = request.headers.get("origin");
  if (origin && !allowedOrigins.includes(origin)) {
    return json(403, { ok: false, error: "origin_not_allowed" });
  }

  const contentType = request.headers.get("content-type") ?? "";
  const read = await readSubmission(request, contentType);
  if (read.errorResponse) return read.errorResponse;
  const { body, files } = read;

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return json(400, { ok: false, error: "invalid_payload" });
  }

  // A hidden field only a script fills in. Accept and drop: telling a bot it
  // was detected just teaches it to adapt.
  if (cleanString(body[PHONE_HOME_FIELD]) !== "") {
    return json(201, { ok: true, status: "received" });
  }

  const kind = cleanString(body.kind);
  const { fields, values } = validateSubmission(kind, body);
  if (!values) {
    return json(400, { ok: false, error: "invalid", fields });
  }

  if (files.length > 0 && !attachments) {
    return json(503, { ok: false, error: "unavailable" });
  }

  const { prepared, fieldError } = await prepareAttachments(files);
  if (fieldError) {
    return json(400, { ok: false, error: "invalid", fields: { files: fieldError } });
  }

  const clientAddress =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
  const fingerprint = await sha256Hex(`${rateSalt}:${clientAddress}`);

  const retryAfter = await applyRateLimit(store, fingerprint, now);
  if (retryAfter !== null) {
    return json(
      429,
      { ok: false, error: "rate_limited" },
      { "retry-after": String(retryAfter) },
    );
  }

  const digests = prepared.map((file) => file.digest);
  const dedupeHash = await sha256Hex(dedupeMaterial(kind, values, digests));
  const existing = await store.findByDedupe(kind, dedupeHash);
  if (existing) {
    return json(200, { ok: true, status: "duplicate", reference: existing });
  }

  const id = crypto.randomUUID();
  const stored = [];
  const fileRows = [];

  try {
    for (const file of prepared) {
      const objectKey = objectKeyFor(file.extension, now);
      await attachments.put(objectKey, file.bytes, {
        contentType: file.contentType,
        originalName: file.name,
        submissionId: id,
      });
      stored.push(objectKey);
      fileRows.push({
        id: crypto.randomUUID(),
        submissionId: id,
        objectKey,
        name: file.name,
        size: file.size,
        contentType: file.contentType,
        digest: file.digest,
        createdAt: new Date(now).toISOString(),
      });
    }

    const record = {
      id,
      kind,
      ...values,
      dedupeHash,
      createdAt: new Date(now).toISOString(),
      sourceOrigin: origin ?? null,
      ipHash: fingerprint,
      requestId,
    };

    if (fileRows.length > 0 && typeof store.insertWithFiles === "function") {
      await store.insertWithFiles(record, fileRows);
    } else {
      await store.insert(record);
      if (fileRows.length > 0) {
        if (typeof store.insertFiles !== "function") {
          throw new Error("store cannot record attachments");
        }
        await store.insertFiles(fileRows);
      }
    }
  } catch (error) {
    for (const objectKey of stored) {
      try {
        await attachments.delete(objectKey);
      } catch {
        // Best effort: the row was not written, so the object is unreachable.
      }
    }
    if (error && error.code === "DUPLICATE") {
      const raced = await store.findByDedupe(kind, dedupeHash);
      if (raced) {
        return json(200, { ok: true, status: "duplicate", reference: raced });
      }
    }
    console.error(
      JSON.stringify({
        level: "error",
        event: "intake_insert_failed",
        requestId,
        kind,
        attachments: fileRows.length,
        message: error instanceof Error ? error.message : "unknown",
      }),
    );
    return json(500, { ok: false, error: "unavailable" });
  }

  // The response stays deliberately thin: a reference, plus the attachment
  // names when there are any. Nothing else from the request is echoed.
  return json(201, {
    ok: true,
    status: "received",
    reference: id,
    ...(fileRows.length > 0
      ? {
          attachments: fileRows.map((row) => ({
            name: row.name,
            size: row.size,
          })),
        }
      : {}),
  });
}

/**
 * Compares two secrets without leaking their content through timing.
 *
 * `a !== b` on strings returns as soon as a character differs, so a caller can
 * learn a prefix byte by byte from response times. Hashing both sides first and
 * combining every byte makes the work independent of where they differ.
 */
export async function constantTimeEqual(a, b) {
  const encoder = new TextEncoder();
  const [left, right] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(String(a))),
    crypto.subtle.digest("SHA-256", encoder.encode(String(b))),
  ]);
  const leftBytes = new Uint8Array(left);
  const rightBytes = new Uint8Array(right);
  let difference = 0;
  for (let index = 0; index < leftBytes.length; index += 1) {
    difference |= leftBytes[index] ^ rightBytes[index];
  }
  return difference === 0;
}

/** Ten failed operator attempts per client per hour, then a cooling-off period. */
const AUTH_LIMITS = { windowMs: 60 * 60 * 1000, max: 10 };

async function clientFingerprint(request, salt) {
  const address =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
  return sha256Hex(`${salt}:operator:${address}`);
}

/**
 * Operator authentication for the read, download and delete routes.
 *
 * The routes stay absent (`404`) when no token is configured, a missing or wrong
 * token is indistinguishable (`401`), and repeated failures from one client are
 * counted so a token cannot be guessed at line speed.
 */
async function authorizeOperator(request, deps) {
  const { token, store } = deps;
  if (!token || token.length < 32) {
    return json(404, { ok: false, error: "not_found" });
  }

  const now = typeof deps.now === "number" ? deps.now : Date.now();
  const windowStart =
    Math.floor(now / AUTH_LIMITS.windowMs) * AUTH_LIMITS.windowMs;
  const fingerprint = await clientFingerprint(request, deps.rateSalt ?? "");
  const bucket = `${fingerprint}:auth:${windowStart}`;

  if (typeof store.readRateToken === "function") {
    const failures = await store.readRateToken(bucket);
    if (failures >= AUTH_LIMITS.max) {
      return json(
        429,
        { ok: false, error: "rate_limited" },
        {
          "retry-after": String(
            Math.max(
              1,
              Math.ceil((windowStart + AUTH_LIMITS.windowMs - now) / 1000),
            ),
          ),
        },
      );
    }
  }

  const authorization = request.headers.get("authorization") ?? "";
  const provided = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";

  if (!(await constantTimeEqual(provided, token))) {
    if (typeof store.takeRateToken === "function") {
      await store.takeRateToken(bucket, windowStart);
    }
    return json(401, { ok: false, error: "unauthorized" });
  }
  return null;
}

/**
 * GET /api/intake — operator read path.
 *
 * Hidden entirely unless a token is configured, and never returns the stored IP
 * fingerprint. Reviewer access belongs to the participant portal; this route
 * exists so an owner can confirm a submission arrived without opening the
 * database console.
 */
export async function handleList(request, deps) {
  const { store } = deps;
  const denied = await authorizeOperator(request, deps);
  if (denied) return denied;

  const limit = Math.min(
    200,
    Math.max(1, Number(new URL(request.url).searchParams.get("limit") ?? 50) || 50),
  );
  const rows = await store.list(limit);
  return json(200, { ok: true, count: rows.length, rows });
}

/**
 * GET /api/files?submission=<reference> — attachment metadata for one
 * submission. Operator only; never a download URL an anonymous visitor could
 * reuse.
 */
export async function handleFileList(request, deps) {
  const { store } = deps;
  const denied = await authorizeOperator(request, deps);
  if (denied) return denied;

  const submissionId = cleanString(
    new URL(request.url).searchParams.get("submission"),
  );
  if (!submissionId) {
    return json(400, { ok: false, error: "invalid" });
  }
  if (typeof store.listFiles !== "function") {
    return json(503, { ok: false, error: "unavailable" });
  }

  const files = await store.listFiles(submissionId);
  return json(200, {
    ok: true,
    count: files.length,
    files: files.map((file) => ({
      id: file.id,
      name: file.name,
      size: file.size,
      contentType: file.contentType,
      createdAt: file.createdAt,
    })),
  });
}

/**
 * GET /api/files/<id> — streams one attachment as a download. Operator only.
 */
export async function handleFileDownload(request, deps) {
  const { store, attachments } = deps;
  const denied = await authorizeOperator(request, deps);
  if (denied) return denied;
  if (!attachments || typeof store.findFile !== "function") {
    return json(503, { ok: false, error: "unavailable" });
  }

  const url = new URL(request.url);
  const fileId = url.pathname.split("/").pop() ?? "";
  if (!/^[0-9a-f-]{36}$/i.test(fileId)) {
    return json(400, { ok: false, error: "invalid" });
  }

  const file = await store.findFile(fileId);
  if (!file) {
    return json(404, { ok: false, error: "not_found" });
  }

  const object = await attachments.get(file.objectKey);
  if (!object) {
    return json(404, { ok: false, error: "not_found" });
  }

  return new Response(object.body, {
    headers: {
      "content-type": file.contentType,
      "content-length": String(file.size),
      "content-disposition": `attachment; filename="${file.name.replace(/["\\]/g, "")}"`,
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      "referrer-policy": "no-referrer",
      "cross-origin-resource-policy": "same-origin",
      "strict-transport-security": "max-age=31536000; includeSubDomains",
      // A stored file is data, never a document: opening it in a browser must
      // not run anything it contains or let it reach the page that opened it.
      "content-security-policy": "default-src 'none'; sandbox",
    },
  });
}

const REFERENCE_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * DELETE /api/intake/<reference> — operator erasure.
 *
 * The published privacy notice promises that a submission and its attachments
 * are deleted on request, so erasure has to be an implemented operation rather
 * than a manual database edit. Objects are removed before rows: if an object
 * cannot be removed the record is left intact and the call fails, so a retry
 * still finds every attachment it is responsible for.
 */
export async function handleDeleteSubmission(request, deps) {
  const { store, attachments } = deps;
  const denied = await authorizeOperator(request, deps);
  if (denied) return denied;

  if (typeof store.deleteSubmission !== "function") {
    return json(503, { ok: false, error: "unavailable" });
  }

  const reference =
    new URL(request.url).pathname.split("/").filter(Boolean).pop() ?? "";
  if (!REFERENCE_PATTERN.test(reference)) {
    return json(400, { ok: false, error: "invalid" });
  }

  const files =
    typeof store.listFiles === "function"
      ? await store.listFiles(reference)
      : [];

  if (attachments) {
    for (const file of files) {
      try {
        await attachments.delete(file.objectKey);
      } catch {
        return json(500, { ok: false, error: "unavailable" });
      }
    }
  } else if (files.length > 0) {
    // Without the bucket the attachments would survive an erasure request.
    return json(503, { ok: false, error: "unavailable" });
  }

  const deleted = await store.deleteSubmission(reference);
  if (!deleted) {
    return json(404, { ok: false, error: "not_found" });
  }

  // An audit line without personal data: enough to prove the erasure happened.
  console.log(
    JSON.stringify({
      level: "info",
      event: "intake_submission_deleted",
      requestId: deps.requestId ?? null,
      reference,
      attachments: files.length,
    }),
  );

  return json(200, {
    ok: true,
    status: "deleted",
    reference,
    attachments: files.length,
  });
}
