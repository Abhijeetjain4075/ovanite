import { intakeApiOrigin } from "./runtimeConfigStore";

/**
 * Browser client for the Ovanite intake service.
 *
 * The service is the only component that writes a submission, so this module
 * keeps a strict contract: a visitor is told "received" only on HTTP 201, a
 * repeat is reported as a duplicate on HTTP 200, and every other outcome is a
 * failure that explicitly says nothing was submitted.
 */
export type IntakeKind = "contact" | "waitlist" | "participant";

export type IntakePayload = {
  name: string;
  email: string;
  message?: string;
  note?: string;
  project?: string;
  stack?: string;
  repository?: string;
  status?: string;
};

export type IntakeOutcome =
  | {
      status: "received";
      reference?: string;
      attachments?: { name: string; size: number }[];
    }
  | { status: "duplicate" };

export type IntakeFailureReason =
  | "unavailable"
  | "rate_limited"
  | "invalid"
  | "not_configured";

export type IntakeFieldErrors = Record<string, string>;

export class IntakeError extends Error {
  readonly reason: IntakeFailureReason;
  readonly fields: IntakeFieldErrors;

  constructor(
    reason: IntakeFailureReason,
    message: string,
    fields: IntakeFieldErrors = {},
  ) {
    super(message);
    this.name = "IntakeError";
    this.reason = reason;
    this.fields = fields;
  }
}

const REQUEST_TIMEOUT_MS = 15_000;

/** True when this build has a configured intake endpoint. */
export function isIntakeOpen(): boolean {
  return intakeApiOrigin() !== null;
}

export function isDuplicateIntakeResult(result: unknown): boolean {
  return (
    typeof result === "object" &&
    result !== null &&
    (result as { status?: unknown }).status === "duplicate"
  );
}

/**
 * Submits one record. Resolves only for a stored or duplicate record; every
 * other path throws an `IntakeError` the caller renders to the visitor.
 */
/**
 * Submits one record, optionally with attachments.
 *
 * A JSON body is used when there is nothing attached; attachments switch the
 * request to `multipart/form-data` so the record and its files arrive together
 * and the service can store them atomically. The browser sets the multipart
 * boundary itself, so no `content-type` header is sent here.
 */
export async function submitIntake(
  kind: IntakeKind,
  payload: IntakePayload,
  options: {
    fetcher?: typeof fetch;
    signal?: AbortSignal;
    files?: File[];
  } = {},
): Promise<IntakeOutcome> {
  const origin = intakeApiOrigin();
  if (!origin) {
    throw new IntakeError(
      "not_configured",
      "Submissions are not open on this deployment.",
    );
  }

  const fetcher = options.fetcher ?? fetch;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  if (options.signal) {
    options.signal.addEventListener("abort", () => controller.abort(), {
      once: true,
    });
  }

  const files = options.files ?? [];
  const form = new FormData();
  form.set("payload", JSON.stringify({ kind, ...payload }));
  for (const file of files) {
    form.append("files", file, file.name);
  }

  let response: Response;
  try {
    response = await fetcher(`${origin}/api/intake`, {
      method: "POST",
      mode: "cors",
      credentials: "omit",
      cache: "no-store",
      headers:
        files.length > 0
          ? { accept: "application/json" }
          : {
              "content-type": "application/json",
              accept: "application/json",
            },
      body: files.length > 0 ? form : JSON.stringify({ kind, ...payload }),
      signal: controller.signal,
    });
  } catch {
    throw new IntakeError(
      "unavailable",
      "We could not reach the submission service. Nothing was submitted.",
    );
  } finally {
    clearTimeout(timeout);
  }

  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  const record = (body ?? {}) as {
    status?: unknown;
    reference?: unknown;
    fields?: unknown;
    attachments?: unknown;
  };

  if (response.status === 201 && record.status === "received") {
    return {
      status: "received",
      reference:
        typeof record.reference === "string" ? record.reference : undefined,
      attachments: Array.isArray(record.attachments)
        ? (record.attachments as { name: string; size: number }[])
        : undefined,
    };
  }

  if (response.status === 200 && record.status === "duplicate") {
    return { status: "duplicate" };
  }

  if (response.status === 400 && record.fields) {
    throw new IntakeError(
      "invalid",
      "Please check the highlighted fields.",
      record.fields as IntakeFieldErrors,
    );
  }

  if (response.status === 429) {
    throw new IntakeError(
      "rate_limited",
      "Too many submissions from this connection. Please try again later.",
    );
  }

  throw new IntakeError(
    "unavailable",
    "We could not accept your submission. Nothing was submitted.",
  );
}
