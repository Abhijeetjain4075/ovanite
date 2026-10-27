import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const outputDir = join(process.cwd(), "dist");
const candidates = [
  process.env.VITE_PUBLIC_ORIGIN,
  process.env.VERCEL_PROJECT_PRODUCTION_URL,
  process.env.VERCEL_URL,
  "https://ovanite.vercel.app",
];

function toHttpsOrigin(value) {
  if (!value?.trim() || ["undefined", "null", "__PUBLIC_ORIGIN__"].includes(value.trim().toLowerCase())) return null;
  try {
    const candidate = value.trim();
    const url = new URL(candidate.includes("://") ? candidate : `https://${candidate}`);
    if (url.protocol !== "https:" || !url.hostname || url.username || url.password) {
      return null;
    }
    return url.origin;
  } catch {
    return null;
  }
}

const publicOrigin = candidates.map(toHttpsOrigin).find(Boolean);
if (!publicOrigin) {
  throw new Error("Could not determine a valid HTTPS public origin for robots.txt and sitemap.xml");
}

for (const fileName of ["robots.txt", "sitemap.xml"]) {
  const filePath = join(outputDir, fileName);
  const contents = await readFile(filePath, "utf8");
  const rendered = contents.replaceAll("__PUBLIC_ORIGIN__", publicOrigin);
  await writeFile(filePath, rendered, "utf8");
  if (rendered.includes("__PUBLIC_ORIGIN__")) {
    throw new Error(`Unresolved public-origin placeholder in ${fileName}`);
  }
}

console.log(`Finalized robots.txt and sitemap.xml for ${publicOrigin}`);
