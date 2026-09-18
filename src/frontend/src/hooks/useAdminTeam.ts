import { createActor } from "@/backend";
import type { AdminRole } from "@/types/content";
import type { Admin } from "@/types/content";
import { useActor } from "@caffeineai/core-infrastructure";
import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const adminTeamQueryKey = ["admin", "team"] as const;
export const ownerClaimedQueryKey = ["admin", "owner-claimed"] as const;

/** Every admin. Admin only. */
export function useAdminTeam() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<Admin[]>({
    queryKey: adminTeamQueryKey,
    queryFn: async () => {
      if (!actor) return [];
      return actor.listAdmins();
    },
    enabled: !!actor && !isFetching,
  });
}

/**
 * Whether the one-time owner bootstrap has already happened. While this is
 * `false`, a signed-in visitor may claim ownership with the configured email.
 */
export function useIsOwnerClaimed() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<boolean>({
    queryKey: ownerClaimedQueryKey,
    queryFn: async () => {
      if (!actor) return false;
      return actor.isOwnerClaimed();
    },
    enabled: !!actor && !isFetching,
  });
}

/**
 * One-time ownership claim. Succeeds only while no owner exists and `email`
 * matches the configured owner address; the backend traps otherwise.
 */
export function useClaimOwner() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (email: string) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.claimOwner(email);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ownerClaimedQueryKey });
      void queryClient.invalidateQueries({ queryKey: adminTeamQueryKey });
      void queryClient.invalidateQueries({ queryKey: ["admin", "caller"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "is-owner"] });
    },
  });
}

export function useAddAdmin() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      principal,
      role,
    }: {
      principal: Principal;
      role: AdminRole;
    }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.addAdmin(principal, role);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminTeamQueryKey });
    },
  });
}

/** Changes a non-owner admin's role. Owner only. */
export function useSetAdminRole() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      principal,
      role,
    }: {
      principal: Principal;
      role: AdminRole;
    }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.setAdminRole(principal, role);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminTeamQueryKey });
    },
  });
}

export function useRemoveAdmin() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (principal: Principal) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.removeAdmin(principal);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminTeamQueryKey });
    },
  });
}
