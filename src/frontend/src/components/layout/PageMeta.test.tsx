import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { PageMeta } from "@/components/layout/PageMeta";

function metaContent(selector: string): string | null {
  return (
    document.head
      .querySelector<HTMLMetaElement>(selector)
      ?.getAttribute("content") ?? null
  );
}

afterEach(() => {
  cleanup();
  for (const element of document.head.querySelectorAll(
    'meta[property="og:image"], meta[property="og:image:alt"], meta[name="twitter:image"]',
  )) {
    element.remove();
  }
});

describe("PageMeta", () => {
  it("sets a unique document title and description for the route", () => {
    render(<PageMeta title="Products" description="Explore our products." />);

    expect(document.title).toBe("Products — Ovanite");
    expect(metaContent('meta[name="description"]')).toBe(
      "Explore our products.",
    );
  });

  it("does not use a third-party template image when none is supplied", () => {
    render(<PageMeta title="About" description="About Ovanite." />);

    expect(metaContent('meta[property="og:title"]')).toBe("About — Ovanite");
    expect(metaContent('meta[property="og:description"]')).toBe(
      "About Ovanite.",
    );
    expect(metaContent('meta[property="og:image"]')).toBeNull();
    expect(metaContent('meta[property="og:image:alt"]')).toBeNull();
    expect(metaContent('meta[name="twitter:image"]')).toBeNull();
    expect(metaContent('meta[name="twitter:card"]')).toBe("summary");
  });

  it("sets an explicitly supplied first-party social image", () => {
    render(
      <PageMeta
        title="About"
        description="About Ovanite."
        image="https://ovanite.vercel.app/assets/ovanite-social.png"
      />,
    );

    expect(metaContent('meta[property="og:image"]')).toBe(
      "https://ovanite.vercel.app/assets/ovanite-social.png",
    );
    expect(metaContent('meta[property="og:image:alt"]')).toBe(
      "About — Ovanite — About Ovanite.",
    );
    expect(metaContent('meta[name="twitter:image"]')).toBe(
      "https://ovanite.vercel.app/assets/ovanite-social.png",
    );
    expect(metaContent('meta[name="twitter:card"]')).toBe(
      "summary_large_image",
    );
  });

  it("removes a previously set social image when the next route has none", () => {
    const { rerender } = render(
      <PageMeta
        title="About"
        description="About Ovanite."
        image="https://ovanite.vercel.app/assets/ovanite-social.png"
      />,
    );

    rerender(
      <PageMeta title="Contact" description="Contact intake is closed." />,
    );

    expect(metaContent('meta[property="og:image"]')).toBeNull();
    expect(metaContent('meta[name="twitter:image"]')).toBeNull();
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
