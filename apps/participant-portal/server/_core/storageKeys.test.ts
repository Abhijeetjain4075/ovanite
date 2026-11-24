import { describe, expect, it } from "vitest";
import { MAX_STORAGE_KEY_LENGTH, normalizeStorageKey, requireStorageKey } from "./storageKeys";

describe("storage keys", () => {
  it("accepts the keys this application writes", () => {
    expect(normalizeStorageKey("avatars/abc123_1a2b3c4d.png")).toBe("avatars/abc123_1a2b3c4d.png");
    expect(normalizeStorageKey("evidence/2026/report.pdf")).toBe("evidence/2026/report.pdf");
    expect(normalizeStorageKey("single-file.json")).toBe("single-file.json");
  });

  it("strips leading slashes so a served proxy path can be resubmitted", () => {
    expect(normalizeStorageKey("/manus-storage/evidence/report.pdf")).toBe(
      "manus-storage/evidence/report.pdf",
    );
    expect(normalizeStorageKey("///evidence/report.pdf")).toBe("evidence/report.pdf");
  });

  it("rejects traversal and absolute-path forms", () => {
    expect(normalizeStorageKey("../secrets.env")).toBeNull();
    expect(normalizeStorageKey("evidence/../../etc/passwd")).toBeNull();
    expect(normalizeStorageKey("evidence/./report.pdf")).toBeNull();
    expect(normalizeStorageKey("a//b.png")).toBeNull();
    expect(normalizeStorageKey("evidence/")).toBeNull();
    expect(normalizeStorageKey("%2e%2e/secrets")).toBeNull();
  });

  it("rejects separators the backend may normalize", () => {
    expect(normalizeStorageKey("evidence\\..\\secrets.env")).toBeNull();
    expect(normalizeStorageKey("s3://bucket/key.png")).toBeNull();
    expect(normalizeStorageKey("evidence/report.pdf?x=1")).toBeNull();
    expect(normalizeStorageKey("evidence/report.pdf#frag")).toBeNull();
    expect(normalizeStorageKey("evidence/\u0000report.pdf")).toBeNull();
    expect(normalizeStorageKey("evidence/re port.pdf")).toBeNull();
  });

  it("rejects non-strings, empty keys and over-long keys", () => {
    expect(normalizeStorageKey(undefined)).toBeNull();
    expect(normalizeStorageKey(null)).toBeNull();
    expect(normalizeStorageKey(42)).toBeNull();
    expect(normalizeStorageKey("")).toBeNull();
    expect(normalizeStorageKey("   ")).toBeNull();
    expect(normalizeStorageKey(`${"a".repeat(MAX_STORAGE_KEY_LENGTH)}.png`)).toBeNull();
    expect(normalizeStorageKey(`${"a".repeat(MAX_STORAGE_KEY_LENGTH - 4)}.png`)).not.toBeNull();
  });

  it("throws without echoing the rejected value", () => {
    expect(() => requireStorageKey("../../etc/passwd")).toThrowError("Invalid storage key");
    try {
      requireStorageKey("../secret-token-value");
    } catch (error) {
      expect(String(error)).not.toContain("secret-token-value");
    }
    expect(requireStorageKey("evidence/report.pdf")).toBe("evidence/report.pdf");
  });
});
