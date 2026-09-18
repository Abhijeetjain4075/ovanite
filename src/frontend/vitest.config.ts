import { fileURLToPath, URL } from "url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

/**
 * Vitest configuration for the frontend suite. Mirrors the `@` alias from
 * `vite.config.js` so tests import application modules exactly as the app does.
 * The DOM environment is supplied by the `test` script (`--environment jsdom`).
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: "declarations",
        replacement: fileURLToPath(new URL("../declarations", import.meta.url)),
      },
      {
        find: "@",
        replacement: fileURLToPath(new URL("./src", import.meta.url)),
      },
    ],
    dedupe: ["@icp-sdk/core"],
  },
  test: {
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.?(c|m)[jt]s?(x)"],
    css: false,
    // The build container reports a CPU count that makes Vitest's default
    // min/max worker bounds conflict; pin a single fork so the suite runs
    // deterministically in constrained sandboxes.
    pool: "forks",
    minWorkers: 1,
    maxWorkers: 1,
  },
});
