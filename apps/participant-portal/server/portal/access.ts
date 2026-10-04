import type { User } from "../../drizzle/schema";
import { ENV } from "../_core/env";

export type PortalRole = "participant" | "owner" | "editor" | "viewer";
export type StaffRole = Exclude<PortalRole, "participant">;

/** Prefer the configured owner. A trusted legacy project admin is the fallback owner only when none is configured. */
export function resolvePortalRole(user: Pick<User, "openId" | "portalRole" | "role">): PortalRole {
  if (ENV.ownerOpenId && user.openId === ENV.ownerOpenId) return "owner";
  if (user.portalRole === "participant" && user.role === "admin") return ENV.ownerOpenId ? "editor" : "owner";
  return user.portalRole;
}

export function isStaffRole(role: PortalRole): role is StaffRole {
  return role === "owner" || role === "editor" || role === "viewer";
}

export function canReview(role: PortalRole): boolean {
  return role === "owner" || role === "editor";
}
