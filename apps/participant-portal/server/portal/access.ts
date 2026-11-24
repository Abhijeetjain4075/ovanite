import type { User } from "../../drizzle/schema";
import { ENV } from "../_core/env";

export type PortalRole = "participant" | "owner" | "editor" | "viewer";
export type StaffRole = Exclude<PortalRole, "participant">;

/**
 * Portal authority has one source: the verified provider identity explicitly
 * configured as OWNER_OPEN_ID. Legacy project-admin flags never promote a
 * participant or create staff membership. Stale persisted owner values fail
 * closed to participant unless the identity matches the configured owner.
 */
export function resolvePortalRole(user: Pick<User, "openId" | "portalRole" | "role">): PortalRole {
  if (ENV.ownerOpenId && user.openId === ENV.ownerOpenId) return "owner";
  if (user.portalRole === "owner") return "participant";
  return user.portalRole;
}

export function isStaffRole(role: PortalRole): role is StaffRole {
  return role === "owner" || role === "editor" || role === "viewer";
}

export function canReview(role: PortalRole): boolean {
  return role === "owner" || role === "editor";
}
