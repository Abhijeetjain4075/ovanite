import { describe, expect, it } from "vitest";

import { isAbsoluteUrl, resolveSiteCopy, safeHref } from "@/lib/siteCopy";
import type { SiteContent } from "@/types/content";

describe("resolveSiteCopy", () => {
  it("falls back to the Ovanite defaults when no content is stored", () => {
    const copy = resolveSiteCopy(undefined);

    expect(copy.heroHeadline).toBe("Software, built to matter.");
    expect(copy.primaryCtaLabel).toBe("Explore products");
    expect(copy.primaryCtaHref).toBe("/products");
    expect(copy.secondaryCtaLabel).toBe("About Ovanite");
    expect(copy.secondaryCtaHref).toBe("/about");
    expect(copy.philosophyTitle).toBe("Built with purpose.");
    expect(copy.approachTitle).toBe("From idea to impact.");
    expect(copy.footerText).toContain("Ovanite builds software products");
    expect(copy.contactTitle).toBe("Contact intake is currently closed.");
    expect(copy.waitlistTitle).toBe(
      "Waitlist registration is currently closed.",
    );
    expect(copy.contactBody).toContain("currently closed");
    expect(copy.waitlistBody).toContain("no details are collected");
    expect(copy.privacyBody).toContain("Page-view analytics is also disabled");
    expect(copy.privacyBody).not.toContain("We also count page views");
  });

  it("prefers stored values over the defaults", () => {
    const content: SiteContent = {
      updatedAt: 0n,
      heroHeadline: "Custom headline",
      primaryCtaLabel: "See the work",
      primaryCtaHref: "https://example.com",
      footerText: "Custom footer",
    };

    const copy = resolveSiteCopy(content);

    expect(copy.heroHeadline).toBe("Custom headline");
    expect(copy.primaryCtaLabel).toBe("See the work");
    expect(copy.primaryCtaHref).toBe("https://example.com");
    expect(copy.footerText).toBe("Custom footer");
    // Unset fields still fall back.
    expect(copy.philosophyTitle).toBe("Built with purpose.");
  });

  it("treats a blank stored value as unset so clearing a field resets it", () => {
    const content: SiteContent = {
      updatedAt: 0n,
      heroHeadline: "   ",
      footerText: "",
    };

    const copy = resolveSiteCopy(content);

    expect(copy.heroHeadline).toBe("Software, built to matter.");
    expect(copy.footerText).toContain("Ovanite builds software products");
  });
});

describe("safeHref", () => {
  it("keeps absolute http(s) URLs and same-origin paths", () => {
    expect(safeHref("https://example.com/pricing", "/products")).toBe(
      "https://example.com/pricing",
    );
    expect(safeHref("http://example.com", "/products")).toBe(
      "http://example.com",
    );
    expect(safeHref("/waitlist", "/products")).toBe("/waitlist");
  });

  it("falls back for blank, scheme-relative and script URLs", () => {
    expect(safeHref(undefined, "/products")).toBe("/products");
    expect(safeHref("   ", "/products")).toBe("/products");
    expect(safeHref("//evil.example", "/products")).toBe("/products");
    expect(safeHref("javascript:alert(1)", "/products")).toBe("/products");
    expect(safeHref("JAVASCRIPT:alert(1)", "/products")).toBe("/products");
    expect(safeHref("data:text/html,<script>", "/products")).toBe("/products");
    expect(safeHref("/\\evil.example", "/products")).toBe("/products");
    expect(safeHref("products", "/products")).toBe("/products");
  });

  it("sanitises stored site copy that predates backend validation", () => {
    const copy = resolveSiteCopy({
      updatedAt: 0n,
      primaryCtaHref: "javascript:alert(1)",
      secondaryCtaHref: "//evil.example",
    });

    expect(copy.primaryCtaHref).toBe("/products");
    expect(copy.secondaryCtaHref).toBe("/about");
  });
});

describe("isAbsoluteUrl", () => {
  it("recognises http and https URLs and rejects internal paths", () => {
    expect(isAbsoluteUrl("https://example.com")).toBe(true);
    expect(isAbsoluteUrl("http://example.com")).toBe(true);
    expect(isAbsoluteUrl("/products")).toBe(false);
    expect(isAbsoluteUrl("products")).toBe(false);
  });
});
