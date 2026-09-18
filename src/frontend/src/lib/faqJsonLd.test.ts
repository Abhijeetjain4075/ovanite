import { describe, expect, it } from "vitest";

import { buildFaqJsonLd } from "@/lib/faqJsonLd";
import type { Faq } from "@/types/content";

function faq(overrides: Partial<Faq> = {}): Faq {
  return {
    id: 1n,
    question: "What does Ovanite build?",
    answer: "Software products.",
    sortOrder: 1n,
    createdAt: 0n,
    updatedAt: 0n,
    state: "published" as Faq["state"],
    ...overrides,
  };
}

describe("buildFaqJsonLd", () => {
  it("returns null for an empty list", () => {
    expect(buildFaqJsonLd([])).toBeNull();
  });

  it("returns null when no item has both a question and an answer", () => {
    expect(
      buildFaqJsonLd([
        faq({ id: 1n, question: "   ", answer: "Answer." }),
        faq({ id: 2n, question: "Question?", answer: "" }),
      ]),
    ).toBeNull();
  });

  it("builds a FAQPage node from valid items", () => {
    const result = buildFaqJsonLd([
      faq({ id: 1n, question: "Q1?", answer: "A1." }),
      faq({ id: 2n, question: "Q2?", answer: "A2." }),
    ]);

    expect(result).toEqual({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "Q1?",
          acceptedAnswer: { "@type": "Answer", text: "A1." },
        },
        {
          "@type": "Question",
          name: "Q2?",
          acceptedAnswer: { "@type": "Answer", text: "A2." },
        },
      ],
    });
  });

  it("skips invalid items but keeps the valid ones", () => {
    const result = buildFaqJsonLd([
      faq({ id: 1n, question: "Valid?", answer: "Yes." }),
      faq({ id: 2n, question: "", answer: "Orphan answer." }),
    ]);

    expect(result?.mainEntity).toHaveLength(1);
    expect(result?.mainEntity[0]?.name).toBe("Valid?");
  });

  it("trims surrounding whitespace from the emitted text", () => {
    const result = buildFaqJsonLd([
      faq({ id: 1n, question: "  Padded?  ", answer: "  Padded answer.  " }),
    ]);

    expect(result?.mainEntity[0]?.name).toBe("Padded?");
    expect(result?.mainEntity[0]?.acceptedAnswer.text).toBe("Padded answer.");
  });
});
