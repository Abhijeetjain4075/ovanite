import type { Backend } from "@/backend";
import { useQuery } from "@tanstack/react-query";

export const backendHealthQueryKey = ["backend", "health"] as const;

/**
 * A canister actor object alone does not prove that the configured canister is
 * reachable. Public forms stay closed until a real read round-trip succeeds.
 */
export function useBackendHealth(
  actor: Backend | null | undefined,
  actorFetching: boolean,
) {
  const query = useQuery<boolean>({
    queryKey: backendHealthQueryKey,
    queryFn: async () => {
      if (!actor) throw new Error("Backend actor is unavailable.");
      await actor.getSiteContent();
      return true;
    },
    enabled: Boolean(actor) && !actorFetching,
    retry: false,
    staleTime: 15_000,
    refetchOnWindowFocus: false,
  });

  return {
    isHealthy: query.isSuccess,
    isChecking: actorFetching || query.isLoading,
  };
}
