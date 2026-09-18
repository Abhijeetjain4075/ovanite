import { createActor } from "@/backend";
import type { Faq, FaqInput, FaqPatch, PublishState } from "@/types/content";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const adminFaqsQueryKey = ["admin", "faqs"] as const;

/** Every FAQ, published or not. Admin only. */
export function useAdminFaqs() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<Faq[]>({
    queryKey: adminFaqsQueryKey,
    queryFn: async () => {
      if (!actor) return [];
      return actor.listAllFaqs();
    },
    enabled: !!actor && !isFetching,
  });
}

function useInvalidateFaqs() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: adminFaqsQueryKey });
    void queryClient.invalidateQueries({ queryKey: ["faqs", "published"] });
  };
}

export function useCreateFaq() {
  const { actor } = useActor(createActor);
  const invalidate = useInvalidateFaqs();
  return useMutation({
    mutationFn: async (input: FaqInput) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.createFaq(input);
    },
    onSuccess: () => {
      invalidate();
    },
  });
}

export function useUpdateFaq() {
  const { actor } = useActor(createActor);
  const invalidate = useInvalidateFaqs();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: bigint; patch: FaqPatch }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.updateFaq(id, patch);
    },
    onSuccess: () => {
      invalidate();
    },
  });
}

export function useSetFaqState() {
  const { actor } = useActor(createActor);
  const invalidate = useInvalidateFaqs();
  return useMutation({
    mutationFn: async ({ id, state }: { id: bigint; state: PublishState }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.setFaqState(id, state);
    },
    onSuccess: () => {
      invalidate();
    },
  });
}

export function useDeleteFaq() {
  const { actor } = useActor(createActor);
  const invalidate = useInvalidateFaqs();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.deleteFaq(id);
    },
    onSuccess: () => {
      invalidate();
    },
  });
}
