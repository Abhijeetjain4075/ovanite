/**
 * Visitor analytics consent. Collection is deliberately disabled until the
 * production backend and a bounded analytics policy are independently verified.
 * Keep this client release switch aligned with the server-side Motoko gate.
 */

export const ANALYTICS_COLLECTION_ENABLED = false;

export const CONSENT_STORAGE_KEY = "ovanite.analytics-consent";

/** Dispatched on `window` whenever the stored choice changes. */
export const CONSENT_CHANGE_EVENT = "ovanite:consent-change";

export type ConsentChoice = "accepted" | "declined";

function isConsentChoice(value: string | null): value is ConsentChoice {
  return value === "accepted" || value === "declined";
}

/** Reads the stored choice, or `null` when the visitor has not decided yet. */
export function readConsent(): ConsentChoice | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    return isConsentChoice(stored) ? stored : null;
  } catch {
    return null;
  }
}

/** Stores the visitor's choice and notifies listeners. */
export function writeConsent(choice: ConsentChoice): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, choice);
  } catch {
    // Storage can be unavailable (private mode, blocked cookies). The banner
    // still closes for this session; the choice simply is not persisted.
  }
  window.dispatchEvent(new Event(CONSENT_CHANGE_EVENT));
}

/** Removes the stored choice so the banner can be shown again. */
export function clearConsent(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(CONSENT_STORAGE_KEY);
  } catch {
    // See writeConsent.
  }
  window.dispatchEvent(new Event(CONSENT_CHANGE_EVENT));
}

/** True only when the visitor has explicitly accepted analytics. */
export function hasAnalyticsConsent(): boolean {
  return ANALYTICS_COLLECTION_ENABLED && readConsent() === "accepted";
}
