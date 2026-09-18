import { createActor } from "@/backend";
import type { Admin } from "@/types/content";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";

export const callerAdminQueryKey = ["admin", "caller"] as const;

/**
 * The caller's admin record, or `null` when the caller is not an admin.
 * Drives the admin nav entry point and admin route gating.
 */
export function useAdmin() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<Admin | null>({
    queryKey: callerAdminQueryKey,
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

/** Whether the caller is the owner (highest privilege). */
export function useIsOwner() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<boolean>({
    queryKey: ["admin", "is-owner"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerOwner();
    },
    enabled: !!actor && !isFetching,
  });
}
