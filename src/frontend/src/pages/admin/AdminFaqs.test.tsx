import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Faq } from "@/types/content";

import {
  actorResult,
  createMockActor,
  renderWithProviders,
} from "@/test/utils";

const { useActorMock } = vi.hoisted(() => ({ useActorMock: vi.fn() }));

vi.mock("@caffeineai/core-infrastructure", () => ({
  useActor: useActorMock,
  useInternetIdentity: () => ({
    isAuthenticated: true,
    login: vi.fn(),
    isLoggingIn: false,
  }),
}));

vi.mock("@/backend", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/backend")>();
  return { ...actual, createActor: vi.fn() };
});

import AdminFaqs from "@/pages/admin/AdminFaqs";

function faq(overrides: Partial<Faq> = {}): Faq {
  return {
    id: 1n,
    question: "What does Ovanite build?",
    answer: "Software products.",
    sortOrder: 0n,
    createdAt: 0n,
    updatedAt: 0n,
    state: "draft" as Faq["state"],
    ...overrides,
  };
}

describe("AdminFaqs", () => {
  beforeEach(() => {
    useActorMock.mockReset();
  });

  it("shows the empty state when no FAQs exist", async () => {
    const actor = createMockActor();
    actor.listAllFaqs.mockResolvedValue([]);
    useActorMock.mockReturnValue(actorResult(actor));

    renderWithProviders(<AdminFaqs />);

    expect(
      await screen.findByTestId("admin.faqs.empty_state"),
    ).toBeInTheDocument();
  });

  it("creates an FAQ through the form and calls the backend with the input", async () => {
    const user = userEvent.setup();
    const actor = createMockActor();
    actor.listAllFaqs.mockResolvedValue([]);
    actor.createFaq.mockResolvedValue(faq());
    useActorMock.mockReturnValue(actorResult(actor));

    renderWithProviders(<AdminFaqs />);

    await screen.findByTestId("admin.faqs.empty_state");
    await user.click(screen.getByTestId("admin.faqs.empty_create_button"));

    await user.type(
      screen.getByLabelText("Question"),
      "What does Ovanite build?",
    );
    await user.type(screen.getByLabelText("Answer"), "Software products.");
    await user.click(screen.getByRole("button", { name: "Create FAQ" }));

    await waitFor(() => {
      expect(actor.createFaq).toHaveBeenCalledWith(
        expect.objectContaining({
          question: "What does Ovanite build?",
          answer: "Software products.",
          sortOrder: 0n,
        }),
      );
    });
  });

  it("publishes a draft FAQ via the publish toggle", async () => {
    const user = userEvent.setup();
    const actor = createMockActor();
    actor.listAllFaqs.mockResolvedValue([
      faq({ state: "draft" as Faq["state"] }),
    ]);
    actor.setFaqState.mockResolvedValue(
      faq({ state: "published" as Faq["state"] }),
    );
    useActorMock.mockReturnValue(actorResult(actor));

    renderWithProviders(<AdminFaqs />);

    const list = await screen.findByTestId("admin.faqs.list");
    await user.click(within(list).getByTestId("admin.faqs.publish_toggle.1"));

    await waitFor(() => {
      expect(actor.setFaqState).toHaveBeenCalledWith(1n, "published");
    });
  });

  it("shows an error state with a retry action when the list fails to load", async () => {
    const actor = createMockActor();
    actor.listAllFaqs.mockRejectedValue(new Error("boom"));
    useActorMock.mockReturnValue(actorResult(actor));

    renderWithProviders(<AdminFaqs />);

    expect(
      await screen.findByTestId("admin.faqs.error_state"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Try again" }),
    ).toBeInTheDocument();
  });
});
