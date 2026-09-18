import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PageMeta } from "@/components/layout/PageMeta";

function metaContent(selector: string): string | null {
  return (
    document.head
      .querySelector<HTMLMetaElement>(selector)
      ?.getAttribute("content") ?? null
  );
}

describe("PageMeta", () => {
  it("sets a unique document title and description for the route", () => {
    render(<PageMeta title="Products" description="Explore our products." />);

    expect(document.title).toBe("Products — Ovanite");
    expect(metaContent('meta[name="description"]')).toBe(
      "Explore our products.",
    );
  });

  it("mirrors the title and description into Open Graph and Twitter tags", () => {
    render(<PageMeta title="About" description="About Ovanite." />);

    expect(metaContent('meta[property="og:title"]')).toBe("About — Ovanite");
    expect(metaContent('meta[property="og:description"]')).toBe(
      "About Ovanite.",
    );
    expect(metaContent('meta[name="twitter:title"]')).toBe("About — Ovanite");
    expect(metaContent('meta[name="twitter:description"]')).toBe(
      "About Ovanite.",
    );
    expect(metaContent('meta[name="twitter:card"]')).toBe(
      "summary_large_image",
    );
  });

  it("updates the title when the route changes", () => {
    const { rerender } = render(
      <PageMeta title="Products" description="Explore our products." />,
    );
    expect(document.title).toBe("Products — Ovanite");

    rerender(<PageMeta title="Contact" description="Get in touch." />);

    expect(document.title).toBe("Contact — Ovanite");
    expect(metaContent('meta[name="description"]')).toBe("Get in touch.");
  });
});
