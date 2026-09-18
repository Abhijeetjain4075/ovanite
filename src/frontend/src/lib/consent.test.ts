import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  CONSENT_CHANGE_EVENT,
  CONSENT_STORAGE_KEY,
  clearConsent,
  hasAnalyticsConsent,
  readConsent,
  writeConsent,
} from "@/lib/consent";

/**
 * The consent store is the single source of truth for whether analytics may
 * run. These are pure unit tests over `localStorage`; the banner and the
 * page-view reporter are covered separately.
 */
describe("consent storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it("reports no choice before the visitor has decided", () => {
    expect(readConsent()).toBeNull();
    expect(hasAnalyticsConsent()).toBe(false);
  });

  it("persists an accepted choice and reports consent", () => {
    writeConsent("accepted");

    expect(window.localStorage.getItem(CONSENT_STORAGE_KEY)).toBe("accepted");
    expect(readConsent()).toBe("accepted");
    expect(hasAnalyticsConsent()).toBe(true);
  });

  it("persists a declined choice without granting consent", () => {
    writeConsent("declined");

    expect(window.localStorage.getItem(CONSENT_STORAGE_KEY)).toBe("declined");
    expect(readConsent()).toBe("declined");
    expect(hasAnalyticsConsent()).toBe(false);
  });

  it("ignores an unrecognized stored value", () => {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, "maybe");

    expect(readConsent()).toBeNull();
    expect(hasAnalyticsConsent()).toBe(false);
  });

  it("clears a stored choice so the banner can be shown again", () => {
    writeConsent("accepted");
    clearConsent();

    expect(window.localStorage.getItem(CONSENT_STORAGE_KEY)).toBeNull();
    expect(readConsent()).toBeNull();
  });

  it("notifies listeners when the choice changes", () => {
    const listener = vi.fn();
    window.addEventListener(CONSENT_CHANGE_EVENT, listener);

    writeConsent("accepted");
    clearConsent();

    expect(listener).toHaveBeenCalledTimes(2);
    window.removeEventListener(CONSENT_CHANGE_EVENT, listener);
  });
});
