import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
    isAuthenticated: true,
    login: vi.fn(),
    isLoggingIn: false,
  }),
}));

vi.mock("@/backend", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/backend")>();
  return { ...actual, createActor: vi.fn() };
});

import AdminProducts from "@/pages/admin/AdminProducts";

function product(overrides: Partial<Product> = {}): Product {
  return {
    id: 1n,
    name: "Ledger",
    description: "A precise product.",
    sortOrder: 0n,
    createdAt: 0n,
    updatedAt: 0n,
    state: "draft" as Product["state"],
    ...overrides,
  };
}

describe("AdminProducts", () => {
  beforeEach(() => {
    useActorMock.mockReset();
  });

  it("shows the empty state when no products exist", async () => {
    const actor = createMockActor();
    actor.listAllProducts.mockResolvedValue([]);
    useActorMock.mockReturnValue(actorResult(actor));

    renderWithProviders(<AdminProducts />);

    expect(
      await screen.findByTestId("admin.products.empty_state"),
    ).toBeInTheDocument();
  });

  it("creates a product through the form and calls the backend with the input", async () => {
    const user = userEvent.setup();
    const actor = createMockActor();
    actor.listAllProducts.mockResolvedValue([]);
    actor.createProduct.mockResolvedValue(product());
    useActorMock.mockReturnValue(actorResult(actor));

    renderWithProviders(<AdminProducts />);

    await screen.findByTestId("admin.products.empty_state");
    await user.click(screen.getByTestId("admin.products.empty_create_button"));

    await user.type(screen.getByLabelText("Name"), "Ledger");
    await user.type(screen.getByLabelText("Description"), "A precise product.");
    await user.click(screen.getByRole("button", { name: "Create product" }));

    await waitFor(() => {
      expect(actor.createProduct).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Ledger",
          description: "A precise product.",
          sortOrder: 0n,
        }),
      );
    });
  });

  it("publishes a draft product via the publish toggle", async () => {
    const user = userEvent.setup();
    const actor = createMockActor();
    actor.listAllProducts.mockResolvedValue([
      product({ state: "draft" as Product["state"] }),
    ]);
    actor.setProductState.mockResolvedValue(
      product({ state: "published" as Product["state"] }),
    );
    useActorMock.mockReturnValue(actorResult(actor));

    renderWithProviders(<AdminProducts />);

    const list = await screen.findByTestId("admin.products.list");
    await user.click(
      within(list).getByTestId("admin.products.publish_toggle.1"),
    );

    await waitFor(() => {
      expect(actor.setProductState).toHaveBeenCalledWith(1n, "published");
    });
  });

  it("shows an error state with a retry action when the list fails to load", async () => {
    const actor = createMockActor();
    actor.listAllProducts.mockRejectedValue(new Error("boom"));
    useActorMock.mockReturnValue(actorResult(actor));

    renderWithProviders(<AdminProducts />);

    expect(
      await screen.findByTestId("admin.products.error_state"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Try again" }),
    ).toBeInTheDocument();
  });
});
