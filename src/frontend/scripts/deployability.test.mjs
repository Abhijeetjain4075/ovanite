import assert from "node:assert/strict";
import test from "node:test";
import {
  buildRuntimeConfig,
  describeDeployabilityWarnings,
  findDeployabilityProblems,
} from "./generate-runtime-config.mjs";

const deployed = {
  NODE_ENV: "production",
  OVANITE_BACKEND_HOST: "https://icp-api.io",
  OVANITE_BACKEND_CANISTER_ID: "ryjl3-tyaaa-aaaaa-aaaba-cai",
};

test("a configured production contract is deployable", () => {
  assert.deepEqual(findDeployabilityProblems(buildRuntimeConfig(deployed)), []);
});

test("placeholder configuration is refused, with one problem per missing value", () => {
  const problems = findDeployabilityProblems(buildRuntimeConfig({}));
  assert.equal(problems.length, 2);
  assert.match(problems[0], /backend_host is still the placeholder/);
  assert.match(problems[1], /backend_canister_id is still the placeholder/);
});

test("a deployed build still refuses a missing canister even though the host defaults", () => {
  const problems = findDeployabilityProblems(
    buildRuntimeConfig({ NODE_ENV: "production" }),
  );
  assert.equal(problems.length, 1);
  assert.match(problems[0], /backend_canister_id is still the placeholder/);
});

test("a placeholder canister ID is refused even when the host is configured", () => {
  const problems = findDeployabilityProblems(
    buildRuntimeConfig({ ...deployed, OVANITE_BACKEND_CANISTER_ID: " undefined " }),
  );
  assert.equal(problems.length, 1);
  assert.match(problems[0], /backend_canister_id is still the placeholder/);
});

test("optional settings are reported as warnings, never as blocking problems", () => {
  const config = buildRuntimeConfig(deployed);
  const warnings = describeDeployabilityWarnings(config);
  assert.equal(warnings.length, 3);
  assert.match(warnings.join("\n"), /ii_derivation_origin is unset/);
  assert.match(warnings.join("\n"), /storage_gateway_url is unset/);
  assert.match(warnings.join("\n"), /project_id is unset/);
});

test("a fully configured contract has no warnings", () => {
  const config = buildRuntimeConfig({
    ...deployed,
    OVANITE_CAFFEINE_PROJECT_ID: "public-project-id",
    OVANITE_II_DERIVATION_ORIGIN: "https://ovanite.vercel.app",
    OVANITE_STORAGE_GATEWAY_URL: "https://storage.example.test",
  });
  assert.deepEqual(describeDeployabilityWarnings(config), []);
  assert.deepEqual(findDeployabilityProblems(config), []);
});
