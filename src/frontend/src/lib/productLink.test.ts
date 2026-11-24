import { describe, expect, it } from "vitest";

import { safeProductLink } from "./productLink";

describe("safeProductLink", () => {
  it("returns null for missing or blank links", () => {
    expect(safeProductLink(undefined)).toBeNull();
    expect(safeProductLink(null)).toBeNull();
    expect(safeProductLink("   ")).toBeNull();
  });

  it("accepts clean HTTPS links and trims outer whitespace", () => {
    expect(safeProductLink("  https://example.com/product  ")).toBe(
      "https://example.com/product",
    );
    expect(safeProductLink("https://example.com/product?ref=1#top")).toBe(
      "https://example.com/product?ref=1#top",
    );
  });

  it("rejects insecure, credentialed, and script schemes", () => {
    expect(safeProductLink("http://example.com")).toBeNull();
    expect(safeProductLink("javascript:alert(1)")).toBeNull();
    expect(safeProductLink("data:text/html,<script>")).toBeNull();
    expect(safeProductLink("https://user:pass@example.com")).toBeNull();
    expect(safeProductLink("not-a-url")).toBeNull();
  });
});
