/** Shared, dependency-free form validation used by the public forms. */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export type FieldErrors<T extends string> = Partial<Record<T, string>>;

export function isRequired(value: string): boolean {
  return value.trim().length > 0;
}

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}

export function validateName(value: string): string | undefined {
  if (!isRequired(value)) return "Please enter your name.";
  if (value.trim().length < 2) return "Name must be at least 2 characters.";
  return undefined;
}

export function validateEmail(value: string): string | undefined {
  if (!isRequired(value)) return "Please enter your email address.";
  if (!isValidEmail(value)) return "Please enter a valid email address.";
  return undefined;
}

export function validateMessage(value: string): string | undefined {
  if (!isRequired(value)) return "Please tell us how we can help.";
  if (value.trim().length < 10)
    return "Please provide at least 10 characters of detail.";
  return undefined;
}

export function validateNote(value: string): string | undefined {
  if (value.trim().length > 500)
    return "Please keep your note under 500 characters.";
  return undefined;
}

/**
 * The backend reports a repeat submission as a `SubmitResult` variant:
 * `{ __kind__: "created", created }` or `{ __kind__: "duplicate", duplicate }`.
 *
 * The check is deliberately defensive. Only an explicit `duplicate` variant is
 * treated as a duplicate; a `created` variant, an older binding that still
 * returns a bare `Submission`, or any unrecognised shape falls through to the
 * normal success path so a genuinely new submission is never misreported.
 */
export function isDuplicateResult(result: unknown): boolean {
  return (
    typeof result === "object" &&
    result !== null &&
    (result as { __kind__?: unknown }).__kind__ === "duplicate"
  );
}
