import { a as useActor, b as useQuery, k as useMutation, q as useQueryClient, d as createActor } from "./index-nAhl1N96.js";
const adminProductsQueryKey = ["admin", "products"];
function useAdminProducts() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: adminProductsQueryKey,
    queryFn: async () => {
      if (!actor) return [];
      return actor.listAllProducts();
    },
    enabled: !!actor && !isFetching
  });
}
function useInvalidateProducts() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: adminProductsQueryKey });
    void queryClient.invalidateQueries({ queryKey: ["products", "published"] });
  };
}
function useCreateProduct() {
  const { actor } = useActor(createActor);
  const invalidate = useInvalidateProducts();
  return useMutation({
    mutationFn: async (input) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.createProduct(input);
    },
    onSuccess: () => {
      invalidate();
    }
  });
}
function useUpdateProduct() {
  const { actor } = useActor(createActor);
  const invalidate = useInvalidateProducts();
  return useMutation({
    mutationFn: async ({ id, patch }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.updateProduct(id, patch);
    },
    onSuccess: () => {
      invalidate();
    }
  });
}
function useSetProductState() {
  const { actor } = useActor(createActor);
  const invalidate = useInvalidateProducts();
  return useMutation({
    mutationFn: async ({ id, state }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.setProductState(id, state);
    },
    onSuccess: () => {
      invalidate();
    }
  });
}
function useDeleteProduct() {
  const { actor } = useActor(createActor);
  const invalidate = useInvalidateProducts();
  return useMutation({
    mutationFn: async (id) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.deleteProduct(id);
    },
    onSuccess: () => {
      invalidate();
    }
  });
}
export {
  useCreateProduct as a,
  useUpdateProduct as b,
  useSetProductState as c,
  useDeleteProduct as d,
  useAdminProducts as u
};
