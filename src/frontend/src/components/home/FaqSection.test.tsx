import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Faq } from "@/types/content";

import {
  type MockActor,
  actorResult,
  createMockActor,
  renderWithProviders,
} from "@/test/utils";

const { useActorMock } = vi.hoisted(() => ({ useActorMock: vi.fn() }));

vi.mock("@caffeineai/core-infrastructure", () => ({
  useActor: useActorMock,
  useInternetIdentity: () => ({
    isAuthenticated: false,
    login: vi.fn(),
    isLoggingIn: false,
  }),
}));

vi.mock("@/backend", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/backend")>();
  return { ...actual, createActor: vi.fn() };
});

import { FaqSection } from "@/components/home/FaqSection";

/**
 * Characterization of the FAQ accordion interaction that must keep working
 * across the upcoming changes. These assertions deliberately observe only the
 * accessible expanded/collapsed state (`aria-expanded`) and never whether the
 * answer text is mounted: the accepted change makes answers present in the DOM
 * even while collapsed, so asserting DOM absence here would freeze behavior
 * that is intentionally changing.
 */
function faq(id: bigint, question: string, answer: string): Faq {
  return {
    id,
    question,
    answer,
    sortOrder: id,
    createdAt: 0n,
    updatedAt: 0n,
    state: "published" as Faq["state"],
  };
}

function setup(actor: MockActor) {
  useActorMock.mockReturnValue(actorResult(actor));
  return renderWithProviders(<FaqSection />);
}

function withTwoPublishedFaqs(actor: MockActor) {
  actor.listPublishedFaqs.mockResolvedValue([
    faq(1n, "What does Ovanite build?", "Software products."),
    faq(2n, "Where are you based?", "Internationally."),
  ]);
}

/**
 * The JSON-LD script is appended imperatively to `document.head`, which
 * `screen` (scoped to `document.body`) cannot see. Query the head directly.
 */
function findJsonLdScript(): HTMLScriptElement | null {
  return document.head.querySelector<HTMLScriptElement>(
    'script[data-ocid="home.faq_jsonld"]',
  );
}

describe("FaqSection accordion interaction", () => {
  beforeEach(() => {
    useActorMock.mockReset();
  });

  it("expands and collapses an item on click", async () => {
    const user = userEvent.setup();
    const actor = createMockActor();
    withTwoPublishedFaqs(actor);
    setup(actor);

    const accordion = await screen.findByTestId("home.faq_accordion");
    const trigger = within(accordion).getByRole("button", {
      name: "What does Ovanite build?",
    });

    expect(trigger).toHaveAttribute("aria-expanded", "false");

    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("toggles an item with the keyboard", async () => {
    const user = userEvent.setup();
    const actor = createMockActor();
    withTwoPublishedFaqs(actor);
    setup(actor);

    const accordion = await screen.findByTestId("home.faq_accordion");
    const trigger = within(accordion).getByRole("button", {
      name: "What does Ovanite build?",
    });

    trigger.focus();
    await user.keyboard("{Enter}");
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    await user.keyboard("{Enter}");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("keeps a single item open at a time", async () => {
    const user = userEvent.setup();
    const actor = createMockActor();
    withTwoPublishedFaqs(actor);
    setup(actor);

    const accordion = await screen.findByTestId("home.faq_accordion");
    const first = within(accordion).getByRole("button", {
      name: "What does Ovanite build?",
    });
    const second = within(accordion).getByRole("button", {
      name: "Where are you based?",
    });

    await user.click(first);
    expect(first).toHaveAttribute("aria-expanded", "true");

    await user.click(second);
    expect(second).toHaveAttribute("aria-expanded", "true");
    expect(first).toHaveAttribute("aria-expanded", "false");
  });
});

describe("FaqSection crawlable content and structured data", () => {
  beforeEach(() => {
    useActorMock.mockReset();
  });

  it("keeps every question and answer in the DOM while the accordion is collapsed", async () => {
    const actor = createMockActor();
    withTwoPublishedFaqs(actor);
    setup(actor);

    const crawlable = await screen.findByTestId("home.faq_crawlable_content");

    expect(
      within(crawlable).getByTestId("home.faq.crawlable_question.1"),
    ).toHaveTextContent("What does Ovanite build?");
    expect(
      within(crawlable).getByTestId("home.faq.crawlable_answer.1"),
    ).toHaveTextContent("Software products.");
    expect(
      within(crawlable).getByTestId("home.faq.crawlable_question.2"),
    ).toHaveTextContent("Where are you based?");
    expect(
      within(crawlable).getByTestId("home.faq.crawlable_answer.2"),
    ).toHaveTextContent("Internationally.");

    // The accordion itself is still collapsed.
    const accordion = screen.getByTestId("home.faq_accordion");
    expect(
      within(accordion).getByRole("button", {
        name: "What does Ovanite build?",
      }),
    ).toHaveAttribute("aria-expanded", "false");
  });

  it("injects a FAQPage JSON-LD script into document.head matching the visible questions and answers", async () => {
    const actor = createMockActor();
    withTwoPublishedFaqs(actor);
    setup(actor);

    // The script is created in an effect after the FAQ data resolves, so wait
    // for it to appear in the head rather than assuming it is synchronous.
    await waitFor(() => {
      expect(findJsonLdScript()).not.toBeNull();
    });

    const script = findJsonLdScript();
    expect(script).not.toBeNull();
    expect(script?.type).toBe("application/ld+json");

    const jsonLd = JSON.parse(script?.textContent ?? "{}");

    expect(jsonLd["@context"]).toBe("https://schema.org");
    expect(jsonLd["@type"]).toBe("FAQPage");
    expect(jsonLd.mainEntity).toEqual([
      {
        "@type": "Question",
        name: "What does Ovanite build?",
        acceptedAnswer: { "@type": "Answer", text: "Software products." },
      },
      {
        "@type": "Question",
        name: "Where are you based?",
        acceptedAnswer: { "@type": "Answer", text: "Internationally." },
      },
    ]);

    // The emitted questions and answers are exactly the ones the accordion
    // renders, so the structured data cannot drift from the visible content.
    const accordion = screen.getByTestId("home.faq_accordion");
    for (const question of jsonLd.mainEntity) {
      expect(
        within(accordion).getByRole("button", { name: question.name }),
      ).toBeInTheDocument();
    }
  });

  it("emits no structured data when no FAQ content is present", async () => {
    const actor = createMockActor();
    actor.listPublishedFaqs.mockResolvedValue([]);
    setup(actor);

    await screen.findByTestId("home.faq_empty_state");
    expect(findJsonLdScript()).toBeNull();
  });

  it("removes the JSON-LD script from the head when the FAQ section unmounts", async () => {
    const actor = createMockActor();
    withTwoPublishedFaqs(actor);
    const { unmount } = setup(actor);

    await waitFor(() => {
      expect(findJsonLdScript()).not.toBeNull();
    });

    unmount();

    expect(findJsonLdScript()).toBeNull();
  });
});
