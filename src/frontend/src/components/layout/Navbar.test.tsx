import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

import { Navbar } from "@/components/layout/Navbar";

describe("Navbar", () => {
  beforeEach(() => {
    useActorMock.mockReset();
  });

  it("links to Products, About, Contact, and Waitlist and shows the Explore products CTA", () => {
    const actor = createMockActor();
    actor.getCallerAdmin.mockResolvedValue(null);
    useActorMock.mockReturnValue(actorResult(actor));

    renderWithProviders(<Navbar />);

    const primary = screen.getByRole("navigation", { name: "Primary" });
    expect(
      within(primary).getByRole("link", { name: "Products" }),
    ).toHaveAttribute("href", "/products");
    expect(
      within(primary).getByRole("link", { name: "About" }),
    ).toHaveAttribute("href", "/about");
    expect(
      within(primary).getByRole("link", { name: "Contact" }),
    ).toHaveAttribute("href", "/contact");
    expect(
      within(primary).getByRole("link", { name: "Waitlist" }),
    ).toHaveAttribute("href", "/waitlist");

    expect(
      screen.getByRole("link", { name: "Explore products" }),
    ).toHaveAttribute("href", "/products");
  });

  it("opens the mobile menu, exposes its links, and closes on navigation", async () => {
    const user = userEvent.setup();
    const actor = createMockActor();
    actor.getCallerAdmin.mockResolvedValue(null);
    useActorMock.mockReturnValue(actorResult(actor));

    renderWithProviders(<Navbar />);

    const toggle = screen.getByRole("button", { name: "Open menu" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    await user.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "true");
    const mobile = screen.getByRole("navigation", { name: "Mobile" });
    const productsLink = within(mobile).getByRole("link", {
      name: "Products",
    });
    expect(productsLink).toHaveAttribute("href", "/products");
    expect(
      within(mobile).getByRole("link", { name: "Waitlist" }),
    ).toHaveAttribute("href", "/waitlist");

    await user.click(productsLink);

    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  it("closes the mobile menu on Escape", async () => {
    const user = userEvent.setup();
    const actor = createMockActor();
    actor.getCallerAdmin.mockResolvedValue(null);
    useActorMock.mockReturnValue(actorResult(actor));

    renderWithProviders(<Navbar />);

    const toggle = screen.getByRole("button", { name: "Open menu" });
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");

    await user.keyboard("{Escape}");

    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  it("shows the Admin link only for an admin caller", async () => {
    const actor = createMockActor();
    actor.getCallerAdmin.mockResolvedValue({
      principal: { toText: () => "aaaaa-aa" },
      role: "owner",
      isOwner: true,
      addedAt: 0n,
    });
    useActorMock.mockReturnValue(actorResult(actor));

    renderWithProviders(<Navbar />);

    const primary = screen.getByRole("navigation", { name: "Primary" });
    expect(
      await within(primary).findByRole("link", { name: "Admin" }),
    ).toHaveAttribute("href", "/admin");
  });
});
