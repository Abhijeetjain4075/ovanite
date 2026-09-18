/**
 * Shared formatting helpers.
 *
 * Motoko `Time.now()` values are nanosecond bigints, so every backend
 * timestamp must pass through `timestampToDate` before any JavaScript `Date`
 * operation.
 */

export function timestampToDate(timestamp: bigint): Date | null {
  const date = new Date(Number(timestamp / 1_000_000n));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(timestamp: bigint): string {
  const date = timestampToDate(timestamp);
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(timestamp: bigint): string {
  const date = timestampToDate(timestamp);
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/** Two-digit section index used by the "engineering ledger" eyebrow labels. */
export function sectionIndex(index: number): string {
  return String(index).padStart(2, "0");
}

/**
 * True when a product's stored image reference points at real bytes.
 *
 * The backend cannot express "remove the image": `mergeBlob` treats an absent
 * value as "leave untouched", so the admin form clears an image by storing a
 * zero-byte blob. That blob is truthy, so rendering it directly produces a
 * broken `<img>`. A zero-byte blob (or a blob with no bytes loaded) counts as
 * "no image" and callers render their fallback instead.
 */
export function hasProductImage(
  image: { _blob?: Uint8Array | null } | null | undefined,
): boolean {
  if (!image) return false;
  const bytes = image._blob;
  return bytes !== undefined && bytes !== null && bytes.byteLength > 0;
}
