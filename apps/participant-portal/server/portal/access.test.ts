import { afterEach, describe, expect, it, vi } from "vitest";
import { resolvePortalRole } from "./access";

afterEach(() => vi.unstubAllEnvs());

describe("portal role policy", () => {
  it("grants owner privileges only to the configured provider identity", () => {
    vi.stubEnv("OWNER_OPEN_ID", "owner-open-id");
    expect(resolvePortalRole({ openId: "owner-open-id", role: "user", portalRole: "participant" })).toBe("owner");
    expect(resolvePortalRole({ openId: "other-open-id", role: "user", portalRole: "participant" })).toBe("participant");
  });

  it("does not turn a legacy project-admin flag into portal editor access", () => {
    vi.stubEnv("OWNER_OPEN_ID", "owner-open-id");
    expect(resolvePortalRole({ openId: "legacy-admin", role: "admin", portalRole: "participant" })).toBe("participant");
  });

  it("fails closed for stale persisted owner roles when identity is not configured", () => {
    vi.stubEnv("OWNER_OPEN_ID", "");
    expect(resolvePortalRole({ openId: "legacy-admin", role: "admin", portalRole: "owner" })).toBe("participant");
    expect(resolvePortalRole({ openId: "stale-owner", role: "user", portalRole: "owner" })).toBe("participant");
  });

  it("preserves explicit viewer and editor assignments irrespective of legacy role", () => {
    vi.stubEnv("OWNER_OPEN_ID", "owner-open-id");
    expect(resolvePortalRole({ openId: "reviewer", role: "admin", portalRole: "viewer" })).toBe("viewer");
    expect(resolvePortalRole({ openId: "editor", role: "admin", portalRole: "editor" })).toBe("editor");
    expect(resolvePortalRole({ openId: "user", role: "user", portalRole: "editor" })).toBe("editor");
  });
});
