import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import {
  preparePublicAssets,
  replacePublicOrigin,
  resolvePublicOrigin,
  validatePublicAssets,
} from "../scripts/prepare-public-assets.mjs";

const temporaryDirectories = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe("public metadata origin", () => {
  it("defaults to the canonical production origin", () => {
    expect(resolvePublicOrigin(undefined)).toBe("https://ovanite.vercel.app");
  });

  it("accepts a valid HTTPS origin and normalizes a trailing slash", () => {
    expect(resolvePublicOrigin("https://www.example.com/")).toBe("https://www.example.com");
  });

  it.each([
    "http://ovanite.vercel.app",
    "https://ovanite.vercel.app/path",
    "https://user:password@ovanite.vercel.app",
    "https://ovanite.vercel.app/?debug=1",
    "not-a-url",
    "",
  ])("rejects an invalid public origin: %s", (origin) => {
    expect(() => resolvePublicOrigin(origin)).toThrow();
  });

  it("replaces every origin token", () => {
    expect(
      replacePublicOrigin("__PUBLIC_ORIGIN__/a __PUBLIC_ORIGIN__/b", "https://ovanite.vercel.app"),
    ).toBe("https://ovanite.vercel.app/a https://ovanite.vercel.app/b");
  });

  it("rejects sitemap URLs that do not use the canonical HTTPS origin", () => {
    expect(() =>
      validatePublicAssets(
        "User-agent: *\nSitemap: https://ovanite.vercel.app/sitemap.xml\n",
        '<urlset><url><loc>https://elsewhere.example/</loc></url></urlset>',
        "https://ovanite.vercel.app",
      ),
    ).toThrow(/non-canonical URL/);
  });

  it("materializes both generated assets and removes all origin tokens", async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), "ovanite-public-meta-"));
    temporaryDirectories.push(directory);

    await writeFile(
      path.join(directory, "robots.txt"),
      "User-agent: *\nAllow: /\nSitemap: __PUBLIC_ORIGIN__/sitemap.xml\n",
    );
    await writeFile(
      path.join(directory, "sitemap.xml"),
      '<?xml version="1.0"?><urlset><url><loc>__PUBLIC_ORIGIN__/</loc></url><url><loc>__PUBLIC_ORIGIN__/about</loc></url></urlset>',
    );

    await preparePublicAssets({ distDir: directory, publicOrigin: "https://ovanite.vercel.app" });

    const robots = await readFile(path.join(directory, "robots.txt"), "utf8");
    const sitemap = await readFile(path.join(directory, "sitemap.xml"), "utf8");
    expect(robots).toContain("Sitemap: https://ovanite.vercel.app/sitemap.xml");
    expect(sitemap).toContain("<loc>https://ovanite.vercel.app/</loc>");
    expect(sitemap).toContain("<loc>https://ovanite.vercel.app/about</loc>");
    expect(robots).not.toContain("__PUBLIC_ORIGIN__");
    expect(sitemap).not.toContain("__PUBLIC_ORIGIN__");
  });
});
