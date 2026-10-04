import { afterEach, describe, expect, it, vi } from "vitest";
import { resolvePortalRole } from "./access";

afterEach(() => vi.unstubAllEnvs());

describe("portal role policy", () => {
  it("gives owner privileges only to the configured project owner", () => {
    vi.stubEnv("OWNER_OPEN_ID", "owner-open-id");
    expect(resolvePortalRole({ openId: "owner-open-id", role: "user", portalRole: "participant" })).toBe("owner");
    expect(resolvePortalRole({ openId: "other-open-id", role: "user", portalRole: "participant" })).toBe("participant");
  });

  it("maps an existing project admin to editor, not owner", () => {
    vi.stubEnv("OWNER_OPEN_ID", "owner-open-id");
    expect(resolvePortalRole({ openId: "legacy-admin", role: "admin", portalRole: "participant" })).toBe("editor");
  });

  it("uses a trusted legacy project admin as owner only when no configured owner exists", () => {
    vi.stubEnv("OWNER_OPEN_ID", "");
    expect(resolvePortalRole({ openId: "legacy-admin", role: "admin", portalRole: "participant" })).toBe("owner");
  });

  it("preserves explicit least-privilege viewer and editor assignments", () => {
    expect(resolvePortalRole({ openId: "reviewer", role: "admin", portalRole: "viewer" })).toBe("viewer");
    expect(resolvePortalRole({ openId: "editor", role: "user", portalRole: "editor" })).toBe("editor");
  });
});
