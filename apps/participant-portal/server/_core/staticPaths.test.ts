import path from "node:path";
import { describe, expect, it } from "vitest";
import { resolveStaticAssetDirectory } from "./staticPaths";

describe("resolveStaticAssetDirectory", () => {
  it("resolves production assets beside the compiled server bundle", () => {
    const bundleDirectory = path.resolve("/repo/apps/participant-portal/dist");

    expect(resolveStaticAssetDirectory(bundleDirectory, "production")).toBe(
      path.join(bundleDirectory, "public"),
    );
  });

  it("resolves development output from the source server directory", () => {
    const sourceDirectory = path.resolve(
      "/repo/apps/participant-portal/server/_core",
    );

    expect(resolveStaticAssetDirectory(sourceDirectory, "development")).toBe(
      path.resolve(sourceDirectory, "../..", "dist", "public"),
    );
  });

  it.each(["test", "staging", undefined])(
    "uses the compiled output layout outside development (%s)",
    (nodeEnv) => {
      const bundleDirectory = path.resolve("/repo/apps/participant-portal/dist");

      expect(resolveStaticAssetDirectory(bundleDirectory, nodeEnv)).toBe(
        path.join(bundleDirectory, "public"),
      );
    },
  );
});
