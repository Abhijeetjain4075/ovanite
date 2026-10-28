import assert from "node:assert/strict";
import test from "node:test";
import { buildRuntimeConfig } from "./generate-runtime-config.mjs";

test("development stays fail-closed when no backend deployment is configured", () => {
  assert.deepEqual(buildRuntimeConfig({ NODE_ENV: "development" }), {
    backend_host: "undefined",
    backend_canister_id: "undefined",
    project_id: "undefined",
    ii_derivation_origin: "undefined",
    storage_gateway_url: "undefined",
  });
});

test("deployed Vercel builds default to the official ICP API host but do not invent a canister ID", () => {
  const config = buildRuntimeConfig({ VERCEL: "1", VERCEL_ENV: "production" });
  assert.equal(config.backend_host, "https://icp-api.io");
  assert.equal(config.backend_canister_id, "undefined");
  assert.equal(config.storage_gateway_url, "undefined");
});

test("configured public runtime values map to the required Caffeine template contract", () => {
  const config = buildRuntimeConfig({
    NODE_ENV: "production",
    OVANITE_BACKEND_HOST: "https://icp-api.io",
    OVANITE_BACKEND_CANISTER_ID: "ryjl3-tyaaa-aaaaa-aaaba-cai",
    OVANITE_CAFFEINE_PROJECT_ID: "public-project-id",
    OVANITE_II_DERIVATION_ORIGIN: "https://ovanite.vercel.app",
    OVANITE_STORAGE_GATEWAY_URL: "https://storage.example.test",
  });
  assert.deepEqual(config, {
    backend_host: "https://icp-api.io",
    backend_canister_id: "ryjl3-tyaaa-aaaaa-aaaba-cai",
    project_id: "public-project-id",
    ii_derivation_origin: "https://ovanite.vercel.app",
    storage_gateway_url: "https://storage.example.test",
  });
});

test("invalid backend principal is rejected instead of emitted into production config", () => {
  assert.throws(
    () => buildRuntimeConfig({
      NODE_ENV: "production",
      OVANITE_BACKEND_CANISTER_ID: "not-a-canister",
    }),
    /OVANITE_BACKEND_CANISTER_ID must be a valid canonical Internet Computer principal/,
  );
});

test("identity derivation config must be an HTTPS origin, not an arbitrary URL path", () => {
  assert.throws(
    () => buildRuntimeConfig({
      NODE_ENV: "production",
      OVANITE_II_DERIVATION_ORIGIN: "https://ovanite.vercel.app/admin",
    }),
    /must be an origin only/,
  );
});

test("production URLs reject insecure HTTP endpoints", () => {
  assert.throws(
    () => buildRuntimeConfig({
      NODE_ENV: "production",
      OVANITE_BACKEND_HOST: "http://api.example.test",
    }),
    /must use HTTPS/,
  );
  assert.throws(
    () => buildRuntimeConfig({
      NODE_ENV: "production",
      OVANITE_STORAGE_GATEWAY_URL: "http://storage.example.test",
    }),
    /must use HTTPS/,
  );
});

test("blank and literal undefined values remain disabled placeholders", () => {
  const config = buildRuntimeConfig({
    NODE_ENV: "production",
    OVANITE_BACKEND_CANISTER_ID: " undefined ",
    OVANITE_CAFFEINE_PROJECT_ID: " ",
  });
  assert.equal(config.backend_canister_id, "undefined");
  assert.equal(config.project_id, "undefined");
});
