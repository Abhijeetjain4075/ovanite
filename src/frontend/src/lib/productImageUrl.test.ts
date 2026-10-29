import { describe, expect, it } from "vitest";

import { productImageUrlError } from "./productImageUrl";

describe("productImageUrlError", () => {
  it("allows an empty URL so products can have no image", () => {
    expect(productImageUrlError("")).toBeNull();
    expect(productImageUrlError("   ")).toBeNull();
  });

  it("accepts a valid HTTPS URL and outer whitespace", () => {
    expect(
      productImageUrlError("  https://cdn.example.com/logo.webp  "),
    ).toBeNull();
  });

  it("rejects insecure and non-web schemes", () => {
    expect(productImageUrlError("http://cdn.example.com/logo.png")).toMatch(
      /HTTPS/,
    );
    expect(productImageUrlError("ftp://cdn.example.com/logo.png")).toMatch(
      /HTTPS/,
    );
    expect(productImageUrlError("data:image/svg+xml;base64,AAAA")).toMatch(
      /HTTPS/,
    );
  });

  it("rejects malformed URLs and invalid ports", () => {
    expect(productImageUrlError("https://")).not.toBeNull();
    expect(
      productImageUrlError("https://cdn.example.com:invalid/image.png"),
    ).not.toBeNull();
  });

  it("rejects URLs with embedded credentials", () => {
    expect(
      productImageUrlError("https://user:secret@cdn.example.com/logo.png"),
    ).toMatch(/credentials/);
  });

  it("enforces the 2048-character upper bound", () => {
    const longUrl = `https://cdn.example.com/${"a".repeat(2048)}`;
    expect(productImageUrlError(longUrl)).toMatch(/2048/);
  });
});
