import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Faq, Product } from "@/types/content";

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

import Home from "@/pages/Home";

function product(overrides: Partial<Product> = {}): Product {
  return {
    id: 1n,
    name: "Ledger",
    description: "A product description.",
    sortOrder: 0n,
    createdAt: 0n,
    updatedAt: 0n,
    state: "published" as Product["state"],
    ...overrides,
  };
}

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
  return renderWithProviders(<Home />);
}

describe("Home page", () => {
  beforeEach(() => {
    useActorMock.mockReset();
  });

  it("renders the hero headline, supporting text, and both CTAs", async () => {
    const actor = createMockActor();
    actor.getSiteContent.mockResolvedValue({ updatedAt: 0n });
    actor.listPublishedProducts.mockResolvedValue([]);
    actor.listPublishedFaqs.mockResolvedValue([]);

    setup(actor);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Software, built to matter.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Ovanite builds thoughtful digital products designed to solve meaningful problems.",
      ),
    ).toBeInTheDocument();

    const primary = screen.getByRole("link", { name: /Explore products/ });
    expect(primary).toHaveAttribute("href", "/products");
    const secondary = screen.getByRole("link", { name: "About Ovanite" });
    expect(secondary).toHaveAttribute("href", "/about");
  });

  it("renders the philosophy, approach, about, and contact sections", async () => {
    const actor = createMockActor();
    actor.getSiteContent.mockResolvedValue({ updatedAt: 0n });
    actor.listPublishedProducts.mockResolvedValue([]);
    actor.listPublishedFaqs.mockResolvedValue([]);

    setup(actor);

    expect(
      screen.getByRole("heading", { level: 2, name: "Built with purpose." }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "From idea to impact." }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "A software company, not a service.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Let’s build something that matters.",
      }),
    ).toBeInTheDocument();
  });

  it("renders published FAQs in an accessible accordion and reveals an answer", async () => {
    const user = userEvent.setup();
    const actor = createMockActor();
    actor.getSiteContent.mockResolvedValue({ updatedAt: 0n });
    actor.listPublishedProducts.mockResolvedValue([]);
    actor.listPublishedFaqs.mockResolvedValue([
      faq(1n, "What does Ovanite build?", "Software products."),
      faq(2n, "Where are you based?", "Internationally."),
    ]);

    setup(actor);

    const accordion = await screen.findByTestId("home.faq_accordion");
    const trigger = within(accordion).getByRole("button", {
      name: "What does Ovanite build?",
    });
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    await user.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    // The answer is intentionally present twice once expanded: once in the
    // accordion panel and once in the always-mounted crawlable copy. Scope the
    // assertion to the accordion so it still proves the panel revealed it.
    expect(
      within(accordion).getByText("Software products."),
    ).toBeInTheDocument();
  });

  it("requests at most five published FAQs and renders every one returned", async () => {
    const actor = createMockActor();
    actor.getSiteContent.mockResolvedValue({ updatedAt: 0n });
    actor.listPublishedProducts.mockResolvedValue([]);
    actor.listPublishedFaqs.mockResolvedValue([
      faq(1n, "Question one?", "Answer one."),
      faq(2n, "Question two?", "Answer two."),
      faq(3n, "Question three?", "Answer three."),
      faq(4n, "Question four?", "Answer four."),
      faq(5n, "Question five?", "Answer five."),
    ]);

    setup(actor);

    const accordion = await screen.findByTestId("home.faq_accordion");
    expect(actor.listPublishedFaqs).toHaveBeenCalledWith(5n);
    for (const question of [
      "Question one?",
      "Question two?",
      "Question three?",
      "Question four?",
      "Question five?",
    ]) {
      expect(
        within(accordion).getByRole("button", { name: question }),
      ).toBeInTheDocument();
    }
    expect(
      screen.queryByTestId("home.faq_empty_state"),
    ).not.toBeInTheDocument();
  });

  it("shows the FAQ empty state when no FAQs are published", async () => {
    const actor = createMockActor();
    actor.getSiteContent.mockResolvedValue({ updatedAt: 0n });
    actor.listPublishedProducts.mockResolvedValue([]);
    actor.listPublishedFaqs.mockResolvedValue([]);

    setup(actor);

    expect(
      await screen.findByTestId("home.faq_empty_state"),
    ).toBeInTheDocument();
  });

  it("renders published products in the home preview", async () => {
    const actor = createMockActor();
    actor.getSiteContent.mockResolvedValue({ updatedAt: 0n });
    actor.listPublishedProducts.mockResolvedValue([
      product({ id: 1n, name: "Ledger" }),
      product({ id: 2n, name: "Atlas" }),
    ]);
    actor.listPublishedFaqs.mockResolvedValue([]);

    setup(actor);

    expect(await screen.findByText("Ledger")).toBeInTheDocument();
    expect(screen.getByText("Atlas")).toBeInTheDocument();
  });

  it("shows the products-in-development empty state when nothing is published", async () => {
    const actor = createMockActor();
    actor.getSiteContent.mockResolvedValue({ updatedAt: 0n });
    actor.listPublishedProducts.mockResolvedValue([]);
    actor.listPublishedFaqs.mockResolvedValue([]);

    setup(actor);

    await waitFor(() => {
      expect(
        screen.getByTestId("home.products_empty_state"),
      ).toBeInTheDocument();
    });
    expect(screen.getByText("Products in development.")).toBeInTheDocument();
  });
});
