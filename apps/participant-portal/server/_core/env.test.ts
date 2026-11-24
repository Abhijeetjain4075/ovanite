import { afterEach, describe, expect, it, vi } from "vitest";
import { ENV } from "./env";

afterEach(() => vi.unstubAllEnvs());

describe("Bearer session fallback", () => {
  it("fails closed when NODE_ENV is missing or unknown", () => {
    vi.stubEnv("NODE_ENV", "");
    vi.stubEnv("OVANITE_ENABLE_BEARER_FALLBACK", "");
    expect(ENV.allowBearerSessionFallback).toBe(false);
    vi.stubEnv("NODE_ENV", "preview");
    expect(ENV.allowBearerSessionFallback).toBe(false);
  });
  it("is disabled by default in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("OVANITE_ENABLE_BEARER_FALLBACK", "");
    expect(ENV.allowBearerSessionFallback).toBe(false);
  });
  it("requires explicit production opt-in", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("OVANITE_ENABLE_BEARER_FALLBACK", "true");
    expect(ENV.allowBearerSessionFallback).toBe(true);
    vi.stubEnv("OVANITE_ENABLE_BEARER_FALLBACK", "false");
    expect(ENV.allowBearerSessionFallback).toBe(false);
  });
  it("permits fallback in explicit development and test environments", () => {
    vi.stubEnv("OVANITE_ENABLE_BEARER_FALLBACK", "");
    vi.stubEnv("NODE_ENV", "development");
    expect(ENV.allowBearerSessionFallback).toBe(true);
    vi.stubEnv("NODE_ENV", "test");
    expect(ENV.allowBearerSessionFallback).toBe(true);
  });
});
