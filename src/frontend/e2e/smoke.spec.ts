import { expect, test } from "@playwright/test";

const RUNTIME_CONFIG_KEYS = [
  "backend_host",
  "backend_canister_id",
  "project_id",
  "ii_derivation_origin",
  "storage_gateway_url",
  "intake_api_origin",
];

test("serves the runtime configuration contract as JSON", async ({ request }) => {
  const response = await request.get("/env.json");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("application/json");

  const config = (await response.json()) as Record<string, unknown>;
  for (const key of RUNTIME_CONFIG_KEYS) {
    expect(config, `env.json must keep the "${key}" key`).toHaveProperty(key);
    expect(typeof config[key]).toBe("string");
  }
});

test("home page renders the application instead of a configuration failure", async ({
  page,
}) => {
  // Uncaught exceptions are always a failure. Console errors are checked
  // separately: an unconfigured local build legitimately reports the missing
  // Caffeine actor id, and the smoke lane deliberately runs without a backend.
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(String(error)));
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  await page.goto("/");
  await expect(page.locator("main").first()).toBeVisible();
  await expect(
    page.locator("[data-ocid='runtime-config-error']"),
  ).toHaveCount(0);
  await expect(page).toHaveTitle(/\S/);

  expect(pageErrors, pageErrors.join("\n")).toEqual([]);

  const unexpected = consoleErrors.filter(
    (message) =>
      !message.includes("CANISTER_ID_BACKEND") &&
      !message.startsWith("[runtime-config]"),
  );
  expect(unexpected, unexpected.join("\n")).toEqual([]);
});

test("client-side navigation reaches the products page", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /products/i }).first().click();

  await expect(page).toHaveURL(/\/products$/);
  await expect(
    page.getByRole("heading", { name: "Products in the field." }),
  ).toBeVisible();
});

test("a deep link is served the SPA shell", async ({ page }) => {
  const response = await page.goto("/privacy");
  expect(response?.status()).toBe(200);
  await expect(
    page.getByRole("heading", { name: "Privacy Policy" }),
  ).toBeVisible();
});

test("an unknown route renders the 404 page, not a blank screen", async ({
  page,
}) => {
  await page.goto("/this-route-does-not-exist");
  await expect(
    page.getByRole("heading", { name: /exist/i }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /back to home/i })).toBeVisible();
});
