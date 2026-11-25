import { useBackendActor } from "@/hooks/useBackendActor";
import type { Product } from "@/types/content";
import { useQuery } from "@tanstack/react-query";

export const productsQueryKey = ["products", "published"] as const;

/** Published products in admin-defined order. */
export function useProducts() {
  const { actor, isFetching } = useBackendActor();
  return useQuery<Product[]>({
    queryKey: productsQueryKey,
    queryFn: async () => {
      if (!actor) return [];
      return actor.listPublishedProducts();
    },
    enabled: !!actor && !isFetching,
  });
}
