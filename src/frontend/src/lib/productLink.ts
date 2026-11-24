/**
 * Resolve a stored product link into a value that is safe to render as an
 * external anchor, or `null`.
 *
 * The canister rejects non-HTTPS product links on write, but a record created
 * before that validation existed must still never become an active
 * `javascript:`/`data:` link, so the render path re-checks the same policy.
 */
export function safeProductLink(
  value: string | null | undefined,
): string | null {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    if (
      url.protocol !== "https:" ||
      !url.hostname ||
      url.username.length > 0 ||
      url.password.length > 0
    ) {
      return null;
    }
    return trimmed;
  } catch {
    return null;
  }
}
