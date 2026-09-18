import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * The public crawl assets are static files served from the site root. They are
 * not reachable through the React router, so this reads them from disk and
 * asserts they list the public routes the acceptance criteria name. Vitest runs
 * with the frontend package as its working directory, so `public/` resolves
 * from there.
 */
const publicDir = resolve(process.cwd(), "public");

function readPublic(name: string): string {
  return readFileSync(`${publicDir}/${name}`, "utf8");
}

const PUBLIC_ROUTES = [
  "/",
  "/products",
  "/about",
  "/contact",
  "/waitlist",
  "/privacy",
  "/terms",
];

describe("sitemap.xml", () => {
  it("lists every public route", () => {
    const sitemap = readPublic("sitemap.xml");

    for (const route of PUBLIC_ROUTES) {
      expect(sitemap).toContain(`__PUBLIC_ORIGIN__${route}`);
    }
  });

  it("does not list admin routes", () => {
    expect(readPublic("sitemap.xml")).not.toContain("/admin");
  });
});

describe("robots.txt", () => {
  it("allows crawling and points at the sitemap", () => {
    const robots = readPublic("robots.txt");

    expect(robots).toContain("User-agent: *");
    expect(robots).toContain("Allow: /");
    expect(robots).toContain("Sitemap: __PUBLIC_ORIGIN__/sitemap.xml");
  });

  it("disallows the admin area", () => {
    const robots = readPublic("robots.txt");

    expect(robots).toContain("Disallow: /admin");
  });
});
