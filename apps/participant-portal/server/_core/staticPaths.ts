import path from "node:path";

/**
 * Resolves static assets for the portal's source-based dev server and compiled
 * production server. In production, the server bundle lives in dist/index.js,
 * so its sibling public directory is dist/public.
 */
export function resolveStaticAssetDirectory(
  runtimeDirectory: string,
  nodeEnv: string | undefined,
): string {
  if (nodeEnv === "development") {
    return path.resolve(runtimeDirectory, "../..", "dist", "public");
  }

  // poka-yoke: prevent the compiled dist/index.js server from looking outside
  // dist/public when import.meta.dirname points to the compiled bundle [control].
  return path.resolve(runtimeDirectory, "public");
}
