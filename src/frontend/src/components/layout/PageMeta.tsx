import { useEffect } from "react";

type PageMetaProps = {
  title: string;
  description: string;
  /** Optional absolute URL for an Ovanite-controlled social preview image. */
  image?: string;
};

function removeMeta(selector: string) {
  for (const element of document.head.querySelectorAll(selector)) {
    element.remove();
  }
}

function setMeta(
  selector: string,
  attr: "name" | "property",
  key: string,
  content: string,
) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attr, key);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

/**
 * Sets the document title plus description / Open Graph / Twitter metadata for
 * the active route. Rendered by each page so every route has unique metadata.
 */
export function PageMeta({ title, description, image }: PageMetaProps) {
  useEffect(() => {
    const fullTitle = `${title} — Ovanite`;
    document.title = fullTitle;

    setMeta('meta[name="description"]', "name", "description", description);
    setMeta('meta[property="og:title"]', "property", "og:title", fullTitle);
    setMeta(
      'meta[property="og:description"]',
      "property",
      "og:description",
      description,
    );
    setMeta('meta[property="og:type"]', "property", "og:type", "website");
    if (image) {
      setMeta('meta[property="og:image"]', "property", "og:image", image);
      setMeta(
        'meta[property="og:image:alt"]',
        "property",
        "og:image:alt",
        `${fullTitle} — ${description}`,
      );
      setMeta('meta[name="twitter:image"]', "name", "twitter:image", image);
    } else {
      // Do not leak the template platform brand into Ovanite social previews.
      // A first-party share card can be added explicitly once one exists.
      removeMeta('meta[property="og:image"]');
      removeMeta('meta[property="og:image:alt"]');
      removeMeta('meta[name="twitter:image"]');
    }
    setMeta(
      'meta[name="twitter:card"]',
      "name",
      "twitter:card",
      image ? "summary_large_image" : "summary",
    );
    setMeta('meta[name="twitter:title"]', "name", "twitter:title", fullTitle);
    setMeta(
      'meta[name="twitter:description"]',
      "name",
      "twitter:description",
      description,
    );
  }, [title, description, image]);

  return null;
}
