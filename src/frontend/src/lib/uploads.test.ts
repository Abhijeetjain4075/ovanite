import { describe, expect, it } from "vitest";

import {
  ACCEPT_ATTRIBUTE,
  MAX_FILES,
  MAX_FILE_BYTES,
  MAX_TOTAL_BYTES,
  extensionOf,
  formatBytes,
  validateAttachment,
  validateAttachmentSet,
} from "./uploads";

describe("attachment extensions", () => {
  it("recognises archives, code and multi-part names", () => {
    expect(extensionOf("release.zip")).toBe(".zip");
    expect(extensionOf("release.tar.gz")).toBe(".tar.gz");
    expect(extensionOf("SRC/Main.TSX")).toBe(".tsx");
    expect(extensionOf("README")).toBe("");
    expect(extensionOf(".env")).toBe("");
  });

  it("advertises the accepted types to the file picker", () => {
    expect(ACCEPT_ATTRIBUTE).toContain(".zip");
    expect(ACCEPT_ATTRIBUTE).toContain(".tar.gz");
    expect(ACCEPT_ATTRIBUTE).toContain(".ts");
    expect(ACCEPT_ATTRIBUTE).not.toContain(".exe");
  });
});

describe("attachment validation", () => {
  it("accepts archives and source files within the limits", () => {
    expect(validateAttachment("release.zip", 1024)).toBeUndefined();
    expect(validateAttachment("main.py", 2048)).toBeUndefined();
    expect(validateAttachment("notes.md", 12)).toBeUndefined();
  });

  it("rejects empty, oversized, unknown and extension-less files", () => {
    expect(validateAttachment("empty.zip", 0)).toBeDefined();
    expect(validateAttachment("huge.zip", MAX_FILE_BYTES + 1)).toBeDefined();
    expect(validateAttachment("installer.exe", 10)).toBeDefined();
    expect(validateAttachment("Makefile", 10)).toBeDefined();
  });

  it("rejects a selection that exceeds the count or the total size", () => {
    expect(
      validateAttachmentSet(
        Array.from({ length: MAX_FILES + 1 }, (_, index) => ({
          name: `bundle-${index}.zip`,
          size: 10,
        })),
      ),
    ).toBeDefined();

    expect(
      validateAttachmentSet([
        { name: "a.zip", size: MAX_TOTAL_BYTES },
        { name: "b.zip", size: 1024 },
      ]),
    ).toBeDefined();

    expect(
      validateAttachmentSet([
        { name: "a.zip", size: 1024 },
        { name: "b.py", size: 2048 },
      ]),
    ).toBeUndefined();
  });

  it("formats sizes for the file list", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(2048)).toBe("2.0 KB");
    expect(formatBytes(3 * 1024 * 1024)).toBe("3.0 MB");
  });
});
