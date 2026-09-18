import { screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
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

import { Footer } from "@/components/layout/Footer";

describe("Footer", () => {
  beforeEach(() => {
    useActorMock.mockReset();
  });

  it("renders navigation and legal links", () => {
    const actor = createMockActor();
    actor.getSiteContent.mockResolvedValue({ updatedAt: 0n });
    useActorMock.mockReturnValue(actorResult(actor));

    renderWithProviders(<Footer />);

    const nav = screen.getByRole("navigation", { name: "Footer" });
    expect(within(nav).getByRole("link", { name: "Products" })).toHaveAttribute(
      "href",
      "/products",
    );
    expect(within(nav).getByRole("link", { name: "About" })).toHaveAttribute(
      "href",
      "/about",
    );
    expect(within(nav).getByRole("link", { name: "Contact" })).toHaveAttribute(
      "href",
      "/contact",
    );

    const legal = screen.getByRole("navigation", { name: "Legal" });
    expect(
      within(legal).getByRole("link", { name: "Privacy" }),
    ).toHaveAttribute("href", "/privacy");
    expect(within(legal).getByRole("link", { name: "Terms" })).toHaveAttribute(
      "href",
      "/terms",
    );
  });

  it("renders the default brand tagline when no footer text is stored", () => {
    const actor = createMockActor();
    actor.getSiteContent.mockResolvedValue({ updatedAt: 0n });
    useActorMock.mockReturnValue(actorResult(actor));

    renderWithProviders(<Footer />);

    expect(
      screen.getByText(/Ovanite builds software products designed to matter/),
    ).toBeInTheDocument();
  });

  it("renders editable footer text from the backend", async () => {
    const actor = createMockActor();
    actor.getSiteContent.mockResolvedValue({
      updatedAt: 0n,
      footerText: "Editable footer line.",
    });
    useActorMock.mockReturnValue(actorResult(actor));

    renderWithProviders(<Footer />);

    expect(
      await screen.findByText("Editable footer line."),
    ).toBeInTheDocument();
  });
});
