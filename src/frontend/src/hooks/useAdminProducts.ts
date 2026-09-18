import { createActor } from "@/backend";
import type {
  Product,
  ProductInput,
  ProductPatch,
  PublishState,
} from "@/types/content";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const adminProductsQueryKey = ["admin", "products"] as const;

/** Every product, published or not. Admin only. */
export function useAdminProducts() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<Product[]>({
    queryKey: adminProductsQueryKey,
    queryFn: async () => {
      if (!actor) return [];
      return actor.listAllProducts();
    },
    enabled: !!actor && !isFetching,
  });
}

function useInvalidateProducts() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: adminProductsQueryKey });
    void queryClient.invalidateQueries({ queryKey: ["products", "published"] });
  };
}

export function useCreateProduct() {
  const { actor } = useActor(createActor);
  const invalidate = useInvalidateProducts();
  return useMutation({
    mutationFn: async (input: ProductInput) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.createProduct(input);
    },
    onSuccess: () => {
      invalidate();
    },
  });
}

export function useUpdateProduct() {
  const { actor } = useActor(createActor);
  const invalidate = useInvalidateProducts();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: bigint; patch: ProductPatch }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.updateProduct(id, patch);
    },
    onSuccess: () => {
      invalidate();
    },
  });
}

export function useSetProductState() {
  const { actor } = useActor(createActor);
  const invalidate = useInvalidateProducts();
  return useMutation({
    mutationFn: async ({ id, state }: { id: bigint; state: PublishState }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.setProductState(id, state);
    },
    onSuccess: () => {
      invalidate();
    },
  });
}

export function useDeleteProduct() {
  const { actor } = useActor(createActor);
  const invalidate = useInvalidateProducts();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.deleteProduct(id);
    },
    onSuccess: () => {
      invalidate();
    },
  });
}
