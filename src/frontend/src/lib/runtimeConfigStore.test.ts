import { afterEach, describe, expect, it } from "vitest";

import {
  getRuntimeConfig,
  intakeApiOrigin,
  isBackendConfigured,
  setRuntimeConfig,
} from "./runtimeConfigStore";

afterEach(() => {
  setRuntimeConfig({});
});

describe("isBackendConfigured", () => {
  it("is false for every unconfigured shape", () => {
    for (const value of [
      undefined,
      "undefined",
      "",
      "   ",
      "not-a-principal",
      "RYJL3-TYAAA-AAAAA-AAABA-CAI",
    ]) {
      setRuntimeConfig(
        value === undefined ? {} : { backend_canister_id: value },
      );
      expect(isBackendConfigured(), String(value)).toBe(false);
    }
  });

  it("is true only for a canonical canister principal", () => {
    setRuntimeConfig({ backend_canister_id: "ryjl3-tyaaa-aaaaa-aaaba-cai" });
    expect(isBackendConfigured()).toBe(true);
  });
});

describe("intakeApiOrigin", () => {
  it("returns an HTTPS origin or null", () => {
    setRuntimeConfig({
      intake_api_origin: "https://intake.example.test",
    });
    expect(intakeApiOrigin()).toBe("https://intake.example.test");

    setRuntimeConfig({ intake_api_origin: "http://intake.example.test" });
    expect(intakeApiOrigin()).toBeNull();

    setRuntimeConfig({});
    expect(intakeApiOrigin()).toBeNull();
    expect(getRuntimeConfig()).toEqual({});
  });
});
