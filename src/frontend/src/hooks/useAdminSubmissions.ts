import { createActor } from "@/backend";
import type {
  Submission,
  SubmissionFilter,
  SubmissionStatus,
} from "@/types/content";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const adminSubmissionsQueryKey = ["admin", "submissions"] as const;

/** Submissions matching `filter`, newest first. Admin only. */
export function useAdminSubmissions(filter: SubmissionFilter) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<Submission[]>({
    queryKey: [
      ...adminSubmissionsQueryKey,
      filter.kind ?? "all",
      filter.status ?? "all",
    ],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listSubmissions(filter);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetSubmissionStatus() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: bigint;
      status: SubmissionStatus;
    }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.setSubmissionStatus(id, status);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: adminSubmissionsQueryKey,
      });
    },
  });
}

export function useDeleteSubmission() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.deleteSubmission(id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: adminSubmissionsQueryKey,
      });
    },
  });
}
