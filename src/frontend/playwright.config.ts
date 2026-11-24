import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end smoke lane for the exported static frontend.
 *
 * Runs against `vite preview`, which serves the real production build with the
 * SPA rewrites the hosting provider applies. It deliberately needs no backend:
 * these checks catch a broken bundle, broken routing, and a runtime config that
 * fails before rendering.
 */
const port = Number(process.env.E2E_PORT ?? 4173);
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // Invoked through the package's own Vite binary so the lane does not depend
    // on a pnpm shim being on PATH in every environment that runs it.
    command: `node ./node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port ${port} --strictPort`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
