import { useEffect } from "react";

type PageMetaProps = {
  title: string;
  description: string;
  /** Absolute or root-relative URL for og:image. */
  image?: string;
};

const DEFAULT_IMAGE = "/og-image.svg";

function setMeta(selector: string, attr: "name" | "property", key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attr, key);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

export function PageMeta({ title, description, image }: PageMetaProps) {
  useEffect(() => {
    const fullTitle = `${title} — Ovanite`;
    document.title = fullTitle;
    setMeta('meta[name="description"]', "name", "description", description);
    setMeta('meta[property="og:title"]', "property", "og:title", fullTitle);
    setMeta('meta[property="og:description"]', "property", "og:description", description);
    setMeta('meta[property="og:type"]', "property", "og:type", "website");
    setMeta('meta[property="og:site_name"]', "property", "og:site_name", "Ovanite");
    setMeta('meta[property="og:image"]', "property", "og:image", image ?? DEFAULT_IMAGE);
    setMeta('meta[property="og:image:alt"]', "property", "og:image:alt", `${fullTitle} — ${description}`);
    setMeta('meta[name="twitter:card"]', "name", "twitter:card", "summary_large_image");
    setMeta('meta[name="twitter:title"]', "name", "twitter:title", fullTitle);
    setMeta('meta[name="twitter:description"]', "name", "twitter:description", description);
    setMeta('meta[name="twitter:image"]', "name", "twitter:image", image ?? DEFAULT_IMAGE);
  }, [title, description, image]);
  return null;
}
