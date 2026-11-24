/**
 * Safe, bounded operational error summaries.
 * Never return exception messages, stack traces, SQL, URLs, credentials,
 * response bodies or request values. Names and codes are explicitly allowlisted.
 */
export type DatabaseErrorCategory =
  | "authentication" | "connection" | "constraint" | "timeout" | "unavailable" | "unknown";
export type DatabaseErrorDescription = { name: string; code: string | null; category: DatabaseErrorCategory };

const SAFE_NAMES = new Set(["Error","TypeError","RangeError","SyntaxError","ReferenceError","URIError","AxiosError","DatabaseError"]);
const SAFE_CODES = new Set([
  "ER_ACCESS_DENIED_ERROR","ER_ACCESS_DENIED_NO_PASSWORD_ERROR","ER_DBACCESS_DENIED_ERROR",
  "ER_DUP_ENTRY","ER_NO_REFERENCED_ROW_2","ER_ROW_IS_REFERENCED_2","ER_BAD_NULL_ERROR",
  "ER_CON_COUNT_ERROR","ER_TOO_MANY_USER_CONNECTIONS","ER_LOCK_DEADLOCK","ER_LOCK_WAIT_TIMEOUT",
  "ER_NO_SUCH_TABLE","ER_BAD_FIELD_ERROR","ER_PARSE_ERROR","ETIMEDOUT","PROTOCOL_SEQUENCE_TIMEOUT",
  "ECONNREFUSED","ECONNRESET","EHOSTUNREACH","ENOTFOUND","EAI_AGAIN","PROTOCOL_CONNECTION_LOST",
]);

function readString(source: unknown, key: string): string | null {
  if (typeof source !== "object" || source === null) return null;
  try {
    const value = (source as Record<string, unknown>)[key];
    return typeof value === "string" ? value : null;
  } catch {
    return null;
  }
}

export function describeDatabaseError(error: unknown): DatabaseErrorDescription {
  const rawCode = readString(error, "code") ?? readString(error, "errno");
  const normalizedCode = rawCode?.toUpperCase() ?? null;
  const code = normalizedCode && SAFE_CODES.has(normalizedCode) ? normalizedCode : null;
  const rawName = readString(error, "name");
  const name = rawName && SAFE_NAMES.has(rawName) ? rawName : "Error";

  let category: DatabaseErrorCategory = "unknown";
  if (code === "ER_ACCESS_DENIED_ERROR" || code === "ER_ACCESS_DENIED_NO_PASSWORD_ERROR" || code === "ER_DBACCESS_DENIED_ERROR") category = "authentication";
  else if (code === "ER_DUP_ENTRY" || code === "ER_NO_REFERENCED_ROW_2" || code === "ER_ROW_IS_REFERENCED_2" || code === "ER_BAD_NULL_ERROR") category = "constraint";
  else if (code === "ETIMEDOUT" || code === "PROTOCOL_SEQUENCE_TIMEOUT") category = "timeout";
  else if (code === "ECONNREFUSED" || code === "ECONNRESET" || code === "EHOSTUNREACH" || code === "PROTOCOL_CONNECTION_LOST" || code === "ENOTFOUND" || code === "EAI_AGAIN") category = "connection";
  else if (code === "ER_CON_COUNT_ERROR" || code === "ER_TOO_MANY_USER_CONNECTIONS") category = "unavailable";
  return { name, code, category };
}

function safeOperationName(operation: string): string {
  return /^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(operation) ? operation : "operation";
}

export function describeDatabaseOperation(operation: string, error: unknown): string {
  const d = describeDatabaseError(error);
  return `[Database] ${safeOperationName(operation)} failed (name=${d.name}, code=${d.code ?? "none"}, category=${d.category})`;
}

export function describeOperationalFailure(operation: string, error: unknown): string {
  const d = describeDatabaseError(error);
  return `[Operation] ${safeOperationName(operation)} failed (name=${d.name}, code=${d.code ?? "none"}, category=${d.category})`;
}
