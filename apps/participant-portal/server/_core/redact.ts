/**
 * Safe error descriptions for logs.
 *
 * Driver exceptions can embed SQL, hostnames, credentials and bound values.
 * Logs must carry only a stable, comparable shape: error name, whitelisted
 * code, and a coarse category. Messages are never emitted.
 */

export type DatabaseErrorCategory =
  | "authentication"
  | "connection"
  | "constraint"
  | "timeout"
  | "unavailable"
  | "unknown";

export type DatabaseErrorDescription = {
  name: string;
  code: string | null;
  category: DatabaseErrorCategory;
};

const SAFE_NAME = /^[A-Za-z][A-Za-z0-9]{0,63}$/;
const SAFE_CODE = /^[A-Z0-9_]{2,64}$/;

function readString(source: Record<string, unknown>, key: string): string | null {
  const value = source[key];
  return typeof value === "string" ? value : null;
}

export function describeDatabaseError(error: unknown): DatabaseErrorDescription {
  const source = typeof error === "object" && error !== null ? (error as Record<string, unknown>) : {};

  const rawCode = readString(source, "code") ?? readString(source, "errno");
  const normalizedCode = rawCode?.toUpperCase() ?? null;
  const code = normalizedCode && SAFE_CODE.test(normalizedCode) ? normalizedCode : null;

  const rawName = readString(source, "name");
  const name = rawName && SAFE_NAME.test(rawName) ? rawName : "Error";

  let category: DatabaseErrorCategory = "unknown";
  if (code === "ER_ACCESS_DENIED_ERROR" || code === "ER_ACCESS_DENIED_NO_PASSWORD_ERROR" || code === "ER_DBACCESS_DENIED_ERROR") {
    category = "authentication";
  } else if (code === "ER_DUP_ENTRY" || code === "ER_NO_REFERENCED_ROW_2" || code === "ER_ROW_IS_REFERENCED_2" || code === "ER_BAD_NULL_ERROR") {
    category = "constraint";
  } else if (code === "ETIMEDOUT" || code === "PROTOCOL_SEQUENCE_TIMEOUT") {
    category = "timeout";
  } else if (code === "ECONNREFUSED" || code === "ECONNRESET" || code === "PROTOCOL_CONNECTION_LOST" || code === "ENOTFOUND") {
    category = "connection";
  } else if (code === "ER_CON_COUNT_ERROR" || code === "ER_TOO_MANY_USER_CONNECTIONS") {
    category = "unavailable";
  }

  return { name, code, category };
}

/** Build a single log line that cannot contain credentials, SQL or bound values. */
export function describeDatabaseOperation(operation: string, error: unknown): string {
  const description = describeDatabaseError(error);
  const safeOperation = SAFE_NAME.test(operation) ? operation : "operation";
  return `[Database] ${safeOperation} failed (name=${description.name}, code=${description.code ?? "none"}, category=${description.category})`;
}
