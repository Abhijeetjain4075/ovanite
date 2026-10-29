import assert from "node:assert/strict";
import test from "node:test";
import { buildRuntimeConfig } from "./generate-runtime-config.mjs";
import { configureBackendCanisterId, resolveBackendCanisterId } from "./backend-canister-env.mjs";
import { configurePublicFormsActivation } from "./public-forms-env.mjs";

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
    /backend canister ID must be a valid canonical Internet Computer principal/,
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

test("backend host rejects paths and is restricted to an HTTPS origin in deployed builds", () => {
  assert.throws(
    () => buildRuntimeConfig({
      NODE_ENV: "production",
      OVANITE_BACKEND_HOST: "https://icp-api.io/some-path",
    }),
    /must be an origin only/,
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

test("OVANITE_BACKEND_CANISTER_ID is also mapped to the Caffeine actor's CANISTER_ID_BACKEND", () => {
  const env = {
    OVANITE_BACKEND_CANISTER_ID: "ryjl3-tyaaa-aaaaa-aaaba-cai",
  };
  assert.equal(
    configureBackendCanisterId(env),
    "ryjl3-tyaaa-aaaaa-aaaba-cai",
  );
  assert.equal(env.CANISTER_ID_BACKEND, "ryjl3-tyaaa-aaaaa-aaaba-cai");
  const config = buildRuntimeConfig({
    ...env,
    NODE_ENV: "production",
    OVANITE_BACKEND_HOST: "https://icp-api.io",
  });
  assert.equal(config.backend_canister_id, env.CANISTER_ID_BACKEND);
});

test("the runtime config and Caffeine actor reject conflicting backend IDs", () => {
  assert.throws(
    () =>
      resolveBackendCanisterId({
        OVANITE_BACKEND_CANISTER_ID: "ryjl3-tyaaa-aaaaa-aaaba-cai",
        CANISTER_ID_BACKEND: "aaaaa-aa",
      }),
    /must match exactly/,
  );
});

test("a literal undefined SDK placeholder is treated as unconfigured", () => {
  const env = { CANISTER_ID_BACKEND: "undefined" };
  assert.equal(resolveBackendCanisterId(env), undefined);
  configureBackendCanisterId(env);
  assert.equal("CANISTER_ID_BACKEND" in env, false);
});

test("public forms default to closed when no explicit release flag exists", () => {
  const env = {};
  assert.equal(configurePublicFormsActivation(env), false);
  assert.equal(env.VITE_PUBLIC_FORMS_ENABLED, "false");
});

test("public forms enable only when the release flag is explicitly true", () => {
  const enabledEnv = { OVANITE_PUBLIC_FORMS_ENABLED: "TRUE" };
  assert.equal(configurePublicFormsActivation(enabledEnv), true);
  assert.equal(enabledEnv.VITE_PUBLIC_FORMS_ENABLED, "true");

  for (const value of ["", "false", "1", "yes", "undefined"]) {
    const env = { OVANITE_PUBLIC_FORMS_ENABLED: value };
    assert.equal(configurePublicFormsActivation(env), false, value);
    assert.equal(env.VITE_PUBLIC_FORMS_ENABLED, "false", value);
  }
});
