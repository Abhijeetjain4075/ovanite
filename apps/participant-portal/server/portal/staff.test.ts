import { describe, expect, it } from "vitest";
import { evaluateRoleAssignment } from "./staff";

const base = {
  actorRole: "owner" as const,
  actorOpenId: "owner-open-id",
  targetOpenId: "reviewer-open-id",
  ownerOpenId: "owner-open-id",
};

describe("evaluateRoleAssignment", () => {
  it("lets the owner assign editor and viewer roles", () => {
    expect(evaluateRoleAssignment({ ...base, nextRole: "editor" })).toEqual({ allowed: true, nextRole: "editor" });
    expect(evaluateRoleAssignment({ ...base, nextRole: "viewer" })).toEqual({ allowed: true, nextRole: "viewer" });
  });

  it("lets the owner revoke staff access back to participant", () => {
    expect(evaluateRoleAssignment({ ...base, nextRole: "participant" })).toEqual({ allowed: true, nextRole: "participant" });
  });

  it("refuses editors and viewers", () => {
    for (const actorRole of ["editor", "viewer", "participant"] as const) {
      expect(evaluateRoleAssignment({ ...base, actorRole, nextRole: "editor" })).toEqual({
        allowed: false,
        reason: "not_owner",
      });
    }
  });

  it("refuses to rewrite the configured owner identity", () => {
    expect(evaluateRoleAssignment({ ...base, targetOpenId: base.ownerOpenId, nextRole: "participant" })).toEqual({
      allowed: false,
      reason: "owner_identity_immutable",
    });
  });

  it("refuses self-changes even for the owner identity", () => {
    const decision = evaluateRoleAssignment({
      ...base,
      ownerOpenId: "",
      targetOpenId: base.actorOpenId,
      nextRole: "viewer",
    });
    expect(decision).toEqual({ allowed: false, reason: "self_change" });
  });

  it("refuses blank targets", () => {
    expect(evaluateRoleAssignment({ ...base, targetOpenId: "   ", nextRole: "viewer" })).toEqual({
      allowed: false,
      reason: "owner_identity_immutable",
    });
  });
});
