import { describe, expect, it } from "vitest";

import { isAbsoluteUrl, resolveSiteCopy } from "@/lib/siteCopy";
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

describe("isAbsoluteUrl", () => {
  it("recognises http and https URLs and rejects internal paths", () => {
    expect(isAbsoluteUrl("https://example.com")).toBe(true);
    expect(isAbsoluteUrl("http://example.com")).toBe(true);
    expect(isAbsoluteUrl("/products")).toBe(false);
    expect(isAbsoluteUrl("products")).toBe(false);
  });
});
