import { screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Product } from "@/types/content";

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

import Products from "@/pages/Products";

function product(overrides: Partial<Product> = {}): Product {
  return {
    id: 1n,
    name: "Ledger",
    description: "A precise product.",
    sortOrder: 0n,
    createdAt: 0n,
    updatedAt: 0n,
    state: "published" as Product["state"],
    ...overrides,
  };
}

describe("Products page", () => {
  beforeEach(() => {
    useActorMock.mockReset();
  });

  it("shows the 'Products in development' empty state when nothing is published", async () => {
    const actor = createMockActor();
    actor.listPublishedProducts.mockResolvedValue([]);
    useActorMock.mockReturnValue(actorResult(actor));

    renderWithProviders(<Products />);

    expect(
      await screen.findByTestId("products.empty_state"),
    ).toBeInTheDocument();
    expect(screen.getByText("Products in development")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Join the waitlist" }),
    ).toHaveAttribute("href", "/waitlist");
  });

  it("lists published products in the order the backend returns them", async () => {
    const actor = createMockActor();
    actor.listPublishedProducts.mockResolvedValue([
      product({ id: 1n, name: "Ledger", sortOrder: 0n }),
      product({ id: 2n, name: "Atlas", sortOrder: 1n }),
    ]);
    useActorMock.mockReturnValue(actorResult(actor));

    renderWithProviders(<Products />);

    const items = await screen.findAllByTestId(/^products\.item\./);
    expect(items).toHaveLength(2);
    expect(within(items[0]).getByText("Ledger")).toBeInTheDocument();
    expect(within(items[1]).getByText("Atlas")).toBeInTheDocument();
  });

  it("renders breadcrumbs reflecting the page hierarchy", async () => {
    const actor = createMockActor();
    actor.listPublishedProducts.mockResolvedValue([]);
    useActorMock.mockReturnValue(actorResult(actor));

    renderWithProviders(<Products />);

    const breadcrumbs = await screen.findByRole("navigation", {
      name: "Breadcrumb",
    });
    expect(
      within(breadcrumbs).getByRole("link", { name: "Home" }),
    ).toHaveAttribute("href", "/");
    expect(within(breadcrumbs).getByText("Products")).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("shows an error state with a retry action when the read fails", async () => {
    const actor = createMockActor();
    actor.listPublishedProducts.mockRejectedValue(new Error("boom"));
    useActorMock.mockReturnValue(actorResult(actor));

    renderWithProviders(<Products />);

    expect(
      await screen.findByTestId("products.error_state"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Try again" }),
    ).toBeInTheDocument();
  });
});
