import type { Faq } from "@/types/content";

/** A single schema.org Question node with its accepted answer. */
export type FaqJsonLdQuestion = {
  "@type": "Question";
  name: string;
  acceptedAnswer: {
    "@type": "Answer";
    text: string;
  };
};

/** A schema.org FAQPage node built from published FAQ items. */
export type FaqJsonLd = {
  "@context": "https://schema.org";
  "@type": "FAQPage";
  mainEntity: FaqJsonLdQuestion[];
};

/**
 * Build a schema.org FAQPage object from FAQ items.
 *
 * Only items that have both a non-empty question and a non-empty answer are
 * included, so the emitted structured data always matches visible content and
 * is never empty or partial. Returns `null` when no valid item exists.
 */
export function buildFaqJsonLd(faqs: readonly Faq[]): FaqJsonLd | null {
  const mainEntity: FaqJsonLdQuestion[] = [];

  for (const faq of faqs) {
    const question = faq.question?.trim();
    const answer = faq.answer?.trim();
    if (!question || !answer) continue;

    mainEntity.push({
      "@type": "Question",
      name: question,
      acceptedAnswer: {
        "@type": "Answer",
        text: answer,
      },
    });
  }

  if (mainEntity.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity,
  };
}
