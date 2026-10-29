import type { User } from "../../drizzle/schema";
import { ENV } from "../_core/env";

export type PortalRole = "participant" | "owner" | "editor" | "viewer";
export type StaffRole = Exclude<PortalRole, "participant">;

/**
 * A configured identity is the sole source of owner authority.
 * Legacy project admins may retain editor access, but a missing owner setting
 * must never promote one of them (or a stale persisted owner role) to owner.
 */
export function resolvePortalRole(user: Pick<User, "openId" | "portalRole" | "role">): PortalRole {
  if (ENV.ownerOpenId && user.openId === ENV.ownerOpenId) return "owner";

  // poka-yoke: block a stale database owner role from bypassing the configured
  // owner identity, and never auto-elect a legacy admin when config is absent [control].
  if (user.portalRole === "owner") {
    return user.role === "admin" ? "editor" : "participant";
  }

  if (user.portalRole === "participant" && user.role === "admin") return "editor";
  return user.portalRole;
}

export function isStaffRole(role: PortalRole): role is StaffRole {
  return role === "owner" || role === "editor" || role === "viewer";
}

export function canReview(role: PortalRole): boolean {
  return role === "owner" || role === "editor";
}
