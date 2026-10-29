import { afterEach, describe, expect, it, vi } from "vitest";
import { resolvePortalRole } from "./access";

afterEach(() => vi.unstubAllEnvs());

describe("portal role policy", () => {
  it("gives owner privileges only to the configured project owner", () => {
    vi.stubEnv("OWNER_OPEN_ID", "owner-open-id");
    expect(resolvePortalRole({ openId: "owner-open-id", role: "user", portalRole: "participant" })).toBe("owner");
    expect(resolvePortalRole({ openId: "other-open-id", role: "user", portalRole: "participant" })).toBe("participant");
    expect(resolvePortalRole({ openId: "other-open-id", role: "user", portalRole: "owner" })).toBe("participant");
    expect(resolvePortalRole({ openId: "legacy-admin", role: "admin", portalRole: "owner" })).toBe("editor");
  });

  it("maps an existing project admin to editor, not owner", () => {
    vi.stubEnv("OWNER_OPEN_ID", "owner-open-id");
    expect(resolvePortalRole({ openId: "legacy-admin", role: "admin", portalRole: "participant" })).toBe("editor");
  });

  it("never elects a fallback owner when owner identity is not configured", () => {
    vi.stubEnv("OWNER_OPEN_ID", "");
    expect(resolvePortalRole({ openId: "legacy-admin", role: "admin", portalRole: "participant" })).toBe("editor");
    expect(resolvePortalRole({ openId: "legacy-admin", role: "admin", portalRole: "owner" })).toBe("editor");
    expect(resolvePortalRole({ openId: "stale-owner", role: "user", portalRole: "owner" })).toBe("participant");
  });

  it("preserves explicit least-privilege viewer and editor assignments", () => {
    vi.stubEnv("OWNER_OPEN_ID", "owner-open-id");
    expect(resolvePortalRole({ openId: "reviewer", role: "admin", portalRole: "viewer" })).toBe("viewer");
    expect(resolvePortalRole({ openId: "editor", role: "user", portalRole: "editor" })).toBe("editor");
  });
});
