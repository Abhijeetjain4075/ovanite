/**
 * Validate a public product image URL before saving it to the backend.
 *
 * Product images are loaded directly by the visitor's browser; they are not
 * uploaded to Ovanite storage. Restricting this field to clean HTTPS URLs
 * avoids script/data URLs, credential-bearing URLs, and oversized values.
 */
export function productImageUrlError(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (trimmed.length > 2048) {
    return "Image URLs must be 2048 characters or fewer.";
  }

  try {
    const url = new URL(trimmed);
    if (
      url.protocol !== "https:" ||
      !url.hostname ||
      url.username.length > 0 ||
      url.password.length > 0
    ) {
      return "Enter a valid HTTPS image URL without embedded credentials.";
    }
    return null;
  } catch {
    return "Enter a valid HTTPS image URL.";
  }
}
