/**
 * Object-key validation for the storage helpers and the public storage proxy.
 *
 * Keys are forwarded to the storage backend's presign endpoint as a query
 * parameter, so an unchecked key would be an object-path injection surface:
 * `../` segments, absolute paths, backslashes (which some backends normalize to
 * `/`) and control characters must never leave the process. Validation is
 * deliberately conservative — every key this application writes is built from
 * a relative path with an alphanumeric/underscore/dot suffix.
 */

export const MAX_STORAGE_KEY_LENGTH = 512;

/** One path segment: letters, digits, dot, underscore and hyphen only. */
const SAFE_SEGMENT = /^[A-Za-z0-9._-]+$/;

/**
 * Normalize and validate a client- or caller-supplied object key.
 *
 * Leading slashes are tolerated (callers historically pass `/avatars/x.png`)
 * and stripped, matching the previous behavior. Returns `null` for any key that
 * is empty, over-long, absolute after normalization, contains a `.`/`..`
 * segment, a backslash, a colon, a control character, an empty segment or a
 * segment outside the safe alphabet.
 */
export function normalizeStorageKey(raw: unknown): string | null {
  if (typeof raw !== "string") return null;

  // Trim surrounding whitespace, then strip any run of leading slashes so a
  // stored URL path (`/manus-storage/...`) can be re-submitted unchanged.
  const key = raw.trim().replace(/^\/+/, "");
  if (key.length === 0 || key.length > MAX_STORAGE_KEY_LENGTH) return null;

  // Control characters, backslashes, URL schemes and query/fragment syntax are
  // rejected outright instead of being escaped: none are legitimate in a key.
  if (/[\u0000-\u001f\u007f\\:?#*"<>|]/.test(key)) return null;

  const segments = key.split("/");
  for (const segment of segments) {
    if (segment.length === 0) return null; // rejects `a//b` and a trailing `/`
    if (segment === "." || segment === "..") return null;
    if (!SAFE_SEGMENT.test(segment)) return null;
  }

  return key;
}

/**
 * Validate a key and throw a generic error when it is unsafe. The message never
 * contains the rejected value, so it cannot leak caller input into logs.
 */
export function requireStorageKey(raw: unknown): string {
  const key = normalizeStorageKey(raw);
  if (!key) throw new Error("Invalid storage key");
  return key;
}
