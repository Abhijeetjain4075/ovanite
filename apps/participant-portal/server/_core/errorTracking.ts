import { describeDatabaseError } from "./redact";

/**
 * Structured error tracking without a vendor lock-in.
 *
 * Every report is one JSON line on stdout (collected by the platform log
 * pipeline) plus an optional fire-and-forget webhook for an external tracker.
 * Only allowlisted fields leave the process: exception messages, stack traces,
 * SQL, URLs, request bodies and user identifiers are never included, because
 * those are exactly what leaks credentials and personal data into log storage.
 */

export type ErrorEvent = {
  event: "portal_error";
  timestamp: string;
  release: string;
  requestId: string | null;
  operation: string;
  name: string;
  code: string | null;
  category: string;
};

export type ErrorReporter = {
  report(
    operation: string,
    error: unknown,
    context?: { requestId?: string | null },
  ): ErrorEvent;
  recent(): ErrorEvent[];
};

const MAX_RECENT_EVENTS = 50;
const WEBHOOK_TIMEOUT_MS = 3_000;
const REQUEST_ID_PATTERN = /^[A-Za-z0-9._-]{8,64}$/;
const RELEASE_PATTERN = /^[A-Za-z0-9._-]{1,64}$/;

function safeOperation(operation: string): string {
  return /^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(operation) ? operation : "operation";
}

function safeRequestId(value: string | null | undefined): string | null {
  return typeof value === "string" && REQUEST_ID_PATTERN.test(value)
    ? value
    : null;
}

/**
 * Only HTTPS endpoints are accepted; a plain-HTTP webhook would ship operational
 * metadata in clear text, and a malformed URL must never throw from the error
 * path itself.
 */
function resolveWebhookUrl(value: string | undefined): URL | null {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:" || parsed.username || parsed.password) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function createErrorReporter(
  options: {
    release?: string;
    sink?: (line: string) => void;
    webhookUrl?: string;
    fetchImpl?: typeof fetch;
    now?: () => number;
    maxRecent?: number;
  } = {},
): ErrorReporter {
  const release = RELEASE_PATTERN.test(options.release ?? "")
    ? (options.release as string)
    : "unknown";
  const sink = options.sink ?? ((line: string) => console.error(line));
  const webhook = resolveWebhookUrl(options.webhookUrl);
  const fetchImpl = options.fetchImpl ?? fetch;
  const now = options.now ?? (() => Date.now());
  const maxRecent = Math.min(
    Math.max(options.maxRecent ?? MAX_RECENT_EVENTS, 1),
    1_000,
  );
  const recent: ErrorEvent[] = [];

  return {
    report(operation, error, context = {}) {
      const description = describeDatabaseError(error);
      const event: ErrorEvent = {
        event: "portal_error",
        timestamp: new Date(now()).toISOString(),
        release,
        requestId: safeRequestId(context.requestId),
        operation: safeOperation(operation),
        name: description.name,
        code: description.code,
        category: description.category,
      };

      try {
        sink(JSON.stringify(event));
      } catch {
        // A failing log sink must never take down the request path.
      }

      recent.push(event);
      if (recent.length > maxRecent) recent.splice(0, recent.length - maxRecent);

      if (webhook) {
        void Promise.resolve()
          .then(() =>
            fetchImpl(webhook.toString(), {
              method: "POST",
              headers: {
                "content-type": "application/json",
                "user-agent": "ovanite-portal-error-reporter",
              },
              body: JSON.stringify(event),
              signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS),
            }),
          )
          .catch(() => {
            // Delivery failures are intentionally swallowed: losing a report is
            // preferable to failing the request that produced it.
          });
      }

      return event;
    },

    recent() {
      return recent.map((event) => ({ ...event }));
    },
  };
}
