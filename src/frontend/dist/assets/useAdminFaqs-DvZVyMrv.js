import { a as useActor, b as useQuery, k as useMutation, q as useQueryClient, d as createActor } from "./index-nAhl1N96.js";
const adminFaqsQueryKey = ["admin", "faqs"];
function useAdminFaqs() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: adminFaqsQueryKey,
    queryFn: async () => {
      if (!actor) return [];
      return actor.listAllFaqs();
    },
    enabled: !!actor && !isFetching
  });
}
function useInvalidateFaqs() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: adminFaqsQueryKey });
    void queryClient.invalidateQueries({ queryKey: ["faqs", "published"] });
  };
}
function useCreateFaq() {
  const { actor } = useActor(createActor);
  const invalidate = useInvalidateFaqs();
  return useMutation({
    mutationFn: async (input) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.createFaq(input);
    },
    onSuccess: () => {
      invalidate();
    }
  });
}
function useUpdateFaq() {
  const { actor } = useActor(createActor);
  const invalidate = useInvalidateFaqs();
  return useMutation({
    mutationFn: async ({ id, patch }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.updateFaq(id, patch);
    },
    onSuccess: () => {
      invalidate();
    }
  });
}
function useSetFaqState() {
  const { actor } = useActor(createActor);
  const invalidate = useInvalidateFaqs();
  return useMutation({
    mutationFn: async ({ id, state }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.setFaqState(id, state);
    },
    onSuccess: () => {
      invalidate();
    }
  });
}
function useDeleteFaq() {
  const { actor } = useActor(createActor);
  const invalidate = useInvalidateFaqs();
  return useMutation({
    mutationFn: async (id) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.deleteFaq(id);
    },
    onSuccess: () => {
      invalidate();
    }
  });
}
export {
  useCreateFaq as a,
  useUpdateFaq as b,
  useSetFaqState as c,
  useDeleteFaq as d,
  useAdminFaqs as u
};
