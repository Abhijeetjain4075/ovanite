import { a as useActor, b as useQuery, q as useQueryClient, k as useMutation, d as createActor } from "./index-nAhl1N96.js";
const adminSubmissionsQueryKey = ["admin", "submissions"];
function useAdminSubmissions(filter) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: [
      ...adminSubmissionsQueryKey,
      filter.kind ?? "all",
      filter.status ?? "all"
    ],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listSubmissions(filter);
    },
    enabled: !!actor && !isFetching
  });
}
function useSetSubmissionStatus() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status
    }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.setSubmissionStatus(id, status);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: adminSubmissionsQueryKey
      });
    }
  });
}
function useDeleteSubmission() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.deleteSubmission(id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: adminSubmissionsQueryKey
      });
    }
  });
}
export {
  useSetSubmissionStatus as a,
  useDeleteSubmission as b,
  useAdminSubmissions as u
};
