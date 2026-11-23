import type { PortalRole } from "./access";

/**
 * Staff provisioning policy.
 *
 * Owner authority is derived from the configured identity, never from a stored
 * role, so `owner` is not assignable and the configured owner identity cannot be
 * retargeted through the database. Every other staff transition is explicit,
 * least-privilege and auditable.
 */

export const ASSIGNABLE_STAFF_ROLES = ["editor", "viewer", "participant"] as const;
export type AssignableStaffRole = (typeof ASSIGNABLE_STAFF_ROLES)[number];

export type RoleAssignmentRefusal =
  | "not_owner"
  | "owner_identity_immutable"
  | "self_change";

export type RoleAssignmentDecision =
  | { allowed: true; nextRole: AssignableStaffRole }
  | { allowed: false; reason: RoleAssignmentRefusal };

export function evaluateRoleAssignment(input: {
  actorRole: PortalRole;
  actorOpenId: string;
  targetOpenId: string;
  ownerOpenId: string;
  nextRole: AssignableStaffRole;
}): RoleAssignmentDecision {
  if (input.actorRole !== "owner") return { allowed: false, reason: "not_owner" };

  const target = input.targetOpenId.trim();
  if (!target) return { allowed: false, reason: "owner_identity_immutable" };

  // The configured owner identity is authoritative at request time. Writing a
  // database role for it would be misleading and could mask configuration drift.
  if (input.ownerOpenId && target === input.ownerOpenId) {
    return { allowed: false, reason: "owner_identity_immutable" };
  }

  // An owner may not demote their own identity, and no actor may rewrite their
  // own role: that would remove the only accountable approver from the audit.
  if (target === input.actorOpenId) return { allowed: false, reason: "self_change" };

  return { allowed: true, nextRole: input.nextRole };
}

export function describeRoleAssignmentRefusal(reason: RoleAssignmentRefusal): string {
  switch (reason) {
    case "not_owner":
      return "Owner access is required to change staff roles.";
    case "owner_identity_immutable":
      return "The configured owner identity cannot be assigned or changed through the portal. Update OWNER_OPEN_ID in protected runtime settings instead.";
    case "self_change":
      return "You cannot change your own portal role. Ask the configured owner to make the change.";
  }
}
