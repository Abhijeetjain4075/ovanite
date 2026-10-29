import { describe, expect, it, vi } from "vitest";

import {
  checkPortalReadiness,
  missingPortalRuntimeConfig,
  type PortalRuntimeEnv,
} from "./readiness";

const validEnv: PortalRuntimeEnv = {
  MANUS_PROJECT_ID: "ovanite-portal",
  MANUS_JWT_SECRET: "test-only-signing-secret-with-at-least-32-characters",
  MANUS_OAUTH_API_URL: "https://oauth.example.invalid",
  DATABASE_URL: "mysql://portal:test@db.example.invalid/portal",
  OWNER_OPEN_ID: "verified-owner-id",
};

describe("participant portal readiness", () => {
  it("accepts only the critical runtime settings needed for production", () => {
    expect(missingPortalRuntimeConfig(validEnv)).toEqual([]);
  });

  it("rejects missing owner configuration rather than promoting the first login", () => {
    const env = { ...validEnv, OWNER_OPEN_ID: "" };
    expect(missingPortalRuntimeConfig(env)).toContain("OWNER_OPEN_ID");
  });

  it("rejects weak signing secrets", () => {
    const env = { ...validEnv, MANUS_JWT_SECRET: "short-secret" };
    expect(missingPortalRuntimeConfig(env)).toContain(
      "MANUS_JWT_SECRET (must be at least 32 characters)",
    );
  });

  it("rejects non-HTTPS OAuth endpoints and non-MySQL database URLs", () => {
    expect(
      missingPortalRuntimeConfig({
        ...validEnv,
        MANUS_OAUTH_API_URL: "http://oauth.example.invalid",
      }),
    ).toContain("MANUS_OAUTH_API_URL (must be an absolute HTTPS URL)");
    expect(
      missingPortalRuntimeConfig({
        ...validEnv,
        DATABASE_URL: "postgres://db.example.invalid/portal",
      }),
    ).toContain("DATABASE_URL (must be a valid MySQL connection URL)");
  });

  it("does not probe a database when required settings are missing", async () => {
    const probe = vi.fn(async () => {});
    const result = await checkPortalReadiness(
      { ...validEnv, DATABASE_URL: "" },
      probe,
    );
    expect(result.ready).toBe(false);
    expect(result.missing).toContain(
      "DATABASE_URL (must be a valid MySQL connection URL)",
    );
    expect(probe).not.toHaveBeenCalled();
  });

  it("returns ready only after the database and core tables pass a probe", async () => {
    const probe = vi.fn(async () => {});
    await expect(checkPortalReadiness(validEnv, probe)).resolves.toEqual({
      ready: true,
      missing: [],
    });
    expect(probe).toHaveBeenCalledOnce();
  });

  it("fails closed without exposing database errors", async () => {
    const probe = vi.fn(async () => {
      throw new Error("mysql://secret-user:secret-password@db/private");
    });
    await expect(checkPortalReadiness(validEnv, probe)).resolves.toEqual({
      ready: false,
      missing: ["DATABASE_CONNECTIVITY_OR_SCHEMA"],
    });
  });
});
