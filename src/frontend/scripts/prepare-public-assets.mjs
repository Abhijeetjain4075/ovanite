import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const FRONTEND_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_PUBLIC_ORIGIN = "https://ovanite.vercel.app";
const ORIGIN_TOKEN = "__PUBLIC_ORIGIN__";
const PUBLIC_FILES = ["robots.txt", "sitemap.xml"];

/**
 * Resolve the canonical public origin used in the generated robots and sitemap files.
 * Only an HTTPS origin is accepted: path segments, credentials, query strings, and
 * fragments are rejected so that generated URLs cannot silently point at the wrong host.
 */
export function resolvePublicOrigin(value) {
  const configured = value === undefined ? DEFAULT_PUBLIC_ORIGIN : value.trim();

  if (!configured) {
    throw new Error("PUBLIC_ORIGIN is empty; provide an HTTPS origin.");
  }

  let parsed;
  try {
    parsed = new URL(configured);
  } catch {
    throw new Error("PUBLIC_ORIGIN must be a valid absolute HTTPS origin.");
  }

  const normalizedInput = configured.endsWith("/") ? configured.slice(0, -1) : configured;
  if (
    parsed.protocol !== "https:" ||
    !parsed.hostname ||
    parsed.username ||
    parsed.password ||
    parsed.pathname !== "/" ||
    parsed.search ||
    parsed.hash ||
    parsed.origin !== normalizedInput
  ) {
    throw new Error(
      "PUBLIC_ORIGIN must be an HTTPS origin only (for example, https://ovanite.vercel.app), without a path, credentials, query, or fragment.",
    );
  }

  return parsed.origin;
}

/** Replace every deployment token and fail rather than publishing a broken URL. */
export function replacePublicOrigin(content, origin) {
  const replaced = content.replaceAll(ORIGIN_TOKEN, origin);
  if (replaced.includes(ORIGIN_TOKEN)) {
    throw new Error("An unresolved public-origin token remains in a generated asset.");
  }
  return replaced;
}

/** Fail the build if the generated files are not safe to publish as canonical metadata. */
export function validatePublicAssets(robots, sitemap, origin) {
  if (robots.includes(ORIGIN_TOKEN) || sitemap.includes(ORIGIN_TOKEN)) {
    throw new Error("Generated public metadata contains an unresolved origin token.");
  }

  const sitemapDirective = robots.match(/^Sitemap:\s*(\S+)\s*$/m)?.[1];
  if (sitemapDirective !== `${origin}/sitemap.xml`) {
    throw new Error("robots.txt must point to the generated sitemap on the canonical public origin.");
  }

  if (!sitemap.includes("<urlset") || !sitemap.includes("</urlset>")) {
    throw new Error("sitemap.xml is missing a complete urlset.");
  }

  const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1].trim());
  if (locations.length === 0) {
    throw new Error("sitemap.xml must contain at least one <loc> URL.");
  }

  for (const location of locations) {
    let parsed;
    try {
      parsed = new URL(location);
    } catch {
      throw new Error(`sitemap.xml contains an invalid URL: ${location}`);
    }
    if (parsed.protocol !== "https:" || parsed.origin !== origin) {
      throw new Error(`sitemap.xml contains a non-canonical URL: ${location}`);
    }
  }
}

/**
 * Materialize generated assets after Vite has copied public/ into dist/.
 * PUBLIC_ORIGIN is a non-secret build setting; it defaults to the current production site.
 */
export async function preparePublicAssets({
  distDir = path.resolve(FRONTEND_DIR, "dist"),
  publicOrigin = process.env.PUBLIC_ORIGIN,
} = {}) {
  const origin = resolvePublicOrigin(publicOrigin);
  const contents = await Promise.all(
    PUBLIC_FILES.map((file) => readFile(path.join(distDir, file), "utf8")),
  );
  const generated = contents.map((content) => replacePublicOrigin(content, origin));
  validatePublicAssets(generated[0], generated[1], origin);
  await Promise.all(
    PUBLIC_FILES.map((file, index) => writeFile(path.join(distDir, file), generated[index], "utf8")),
  );

  console.log(`Prepared robots.txt and sitemap.xml for ${origin}`);
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : null;
if (invokedPath === import.meta.url) {
  preparePublicAssets().catch((error) => {
    console.error(`Public metadata generation failed: ${error.message}`);
    process.exitCode = 1;
  });
}
