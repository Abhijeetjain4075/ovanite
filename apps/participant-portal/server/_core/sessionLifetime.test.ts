import { afterEach, describe, expect, it, vi } from "vitest";
import { jwtVerify } from "jose";
import { SESSION_LIFETIME_MS } from "@shared/const";
import { ENV } from "./env";
import { sdk } from "./sdk";

afterEach(() => vi.unstubAllEnvs());

describe("session lifetime", () => {
  it("issues default JWT sessions with a 12-hour expiry", async () => {
    vi.stubEnv("MANUS_PROJECT_ID", "ovanite-test-project");
    vi.stubEnv("MANUS_JWT_SECRET", "test-secret-with-at-least-thirty-two-bytes");
    const token = await sdk.signSession({
      openId: "test-user",
      appId: ENV.appId,
      name: "Test User",
    });
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(ENV.cookieSecret),
      { algorithms: ["HS256"] },
    );
    expect(payload.iat).toBeTypeOf("number");
    expect(payload.exp).toBeTypeOf("number");
    expect((payload.exp as number) - (payload.iat as number)).toBe(SESSION_LIFETIME_MS / 1000);
  });
});
