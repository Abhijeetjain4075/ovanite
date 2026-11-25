/**
 * Ovanite intake API — request handling.
 *
 * One endpoint serves every public intake surface on the site (contact,
 * waitlist, participant submission). It is deliberately transport-agnostic: the
 * Worker entrypoint supplies a store, a clock and an origin allowlist, so the
 * whole contract — validation, rate limiting, duplicate detection, error shapes
 * — is testable without a database or a network.
 *
 * Guarantees:
 *   - nothing from the request is echoed back except field names;
 *   - unexpected failures return a generic `unavailable` error, never a stack,
 *     SQL fragment, host name or provider detail;
 *   - a visitor gets `received` only after the record is durably stored.
 */

export const INTAKE_KINDS = ["contact", "waitlist", "participant"];

const MAX_BODY_BYTES = 16 * 1024;
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
      ...extraHeaders,
    },
  });
}

async function sha256Hex(value) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
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

function dedupeMaterial(kind, values) {
  return JSON.stringify([kind, values.email.toLowerCase(), values.name, values.message ?? "", values.project ?? ""]);
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

/**
 * POST /api/intake
 */
export async function handleSubmission(request, deps) {
  const { store, allowedOrigins, now, rateSalt, requestId } = deps;

  if (request.method !== "POST") {
    return json(405, { ok: false, error: "method_not_allowed" }, { allow: "POST, OPTIONS" });
  }

  const origin = request.headers.get("origin");
  if (origin && !allowedOrigins.includes(origin)) {
    return json(403, { ok: false, error: "origin_not_allowed" });
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return json(415, { ok: false, error: "unsupported_media_type" });
  }

  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return json(413, { ok: false, error: "payload_too_large" });
  }

  let body;
  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) {
      return json(413, { ok: false, error: "payload_too_large" });
    }
    body = JSON.parse(raw);
  } catch {
    return json(400, { ok: false, error: "invalid_json" });
  }

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

  const dedupeHash = await sha256Hex(dedupeMaterial(kind, values));
  const existing = await store.findByDedupe(kind, dedupeHash);
  if (existing) {
    return json(200, { ok: true, status: "duplicate", reference: existing });
  }

  const id = crypto.randomUUID();
  try {
    await store.insert({
      id,
      kind,
      ...values,
      dedupeHash,
      createdAt: new Date(now).toISOString(),
      sourceOrigin: origin ?? null,
      ipHash: fingerprint,
      requestId,
    });
  } catch (error) {
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
        message: error instanceof Error ? error.message : "unknown",
      }),
    );
    return json(500, { ok: false, error: "unavailable" });
  }

  return json(201, { ok: true, status: "received", reference: id });
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
  const { store, token } = deps;
  if (!token || token.length < 32) {
    return json(404, { ok: false, error: "not_found" });
  }
  const authorization = request.headers.get("authorization") ?? "";
  const provided = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";
  if (provided !== token) {
    return json(401, { ok: false, error: "unauthorized" });
  }

  const limit = Math.min(
    200,
    Math.max(1, Number(new URL(request.url).searchParams.get("limit") ?? 50) || 50),
  );
  const rows = await store.list(limit);
  return json(200, { ok: true, count: rows.length, rows });
}
