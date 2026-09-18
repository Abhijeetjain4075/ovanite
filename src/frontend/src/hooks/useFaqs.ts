import { createActor } from "@/backend";
import type { Faq } from "@/types/content";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";

export const faqsQueryKey = ["faqs", "published"] as const;

/** Published FAQs in admin-defined order. */
export function useFaqs(limit = 12) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<Faq[]>({
    queryKey: [...faqsQueryKey, limit],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listPublishedFaqs(BigInt(limit));
    },
    enabled: !!actor && !isFetching,
  });
}
