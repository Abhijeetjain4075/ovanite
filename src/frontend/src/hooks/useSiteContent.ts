import { createActor } from "@/backend";
import type { SiteContent } from "@/types/content";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";

export const siteContentQueryKey = ["site-content"] as const;

/**
 * Editable site copy from the backend. Components read copy through this hook
 * and fall back to sensible defaults when a field is unset.
 */
export function useSiteContent() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<SiteContent>({
    queryKey: siteContentQueryKey,
    queryFn: async () => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.getSiteContent();
    },
    enabled: !!actor && !isFetching,
  });
}
