import type { PortalRole } from "./access";

/**
 * Staff provisioning policy.
 *
 * Owner authority is derived only from the configured provider identity.
 * Assignable roles never include owner. A role change also removes the separate
 * legacy project-admin bit so older admin-only procedures cannot override the
 * portal's explicit least-privilege assignment.
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

  if (input.ownerOpenId && target === input.ownerOpenId) {
    return { allowed: false, reason: "owner_identity_immutable" };
  }

  if (target === input.actorOpenId) return { allowed: false, reason: "self_change" };
  return { allowed: true, nextRole: input.nextRole };
}

export type RoleAssignmentState = {
  portalRole: PortalRole;
  legacyRole: "user" | "admin";
};

export type RoleAssignmentPlan = {
  changed: boolean;
  values: {
    portalRole: AssignableStaffRole;
    role: "user";
  };
};

/**
 * Produce one canonical DB transition. Even when the portal role is unchanged,
 * a legacy admin flag must be cleared; otherwise old admin-only procedures
 * remain reachable after an apparent revocation/demotion.
 */
export function planRoleAssignment(
  current: RoleAssignmentState,
  nextRole: AssignableStaffRole,
): RoleAssignmentPlan {
  return {
    changed: current.portalRole !== nextRole || current.legacyRole !== "user",
    values: {
      portalRole: nextRole,
      role: "user",
    },
  };
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
