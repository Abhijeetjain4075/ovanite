import { screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/utils";

// The shared provider tree reads the Caffeine actor; this page never needs one.
vi.mock("@caffeineai/core-infrastructure", () => ({
  useActor: () => ({ actor: null, isFetching: false }),
  useInternetIdentity: () => ({
    isAuthenticated: false,
    login: vi.fn(),
    isLoggingIn: false,
  }),
}));

import NotFound from "@/pages/NotFound";

describe("NotFound page", () => {
  it("renders clear messaging and links back to Home and Products", () => {
    renderWithProviders(<NotFound />);

    expect(
      screen.getByRole("heading", { name: "This page doesn’t exist." }),
    ).toBeInTheDocument();
    expect(screen.getByText("Error 404")).toBeInTheDocument();

    expect(screen.getByRole("link", { name: "Back to home" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(
      screen.getByRole("link", { name: "Explore products" }),
    ).toHaveAttribute("href", "/products");
  });

  it("renders breadcrumbs for the not-found route", () => {
    renderWithProviders(<NotFound />);

    const breadcrumbs = screen.getByRole("navigation", {
      name: "Breadcrumb",
    });
    expect(
      within(breadcrumbs).getByRole("link", { name: "Home" }),
    ).toHaveAttribute("href", "/");
    expect(within(breadcrumbs).getByText("Not found")).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});
