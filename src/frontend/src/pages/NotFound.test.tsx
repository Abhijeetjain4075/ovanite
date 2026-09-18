import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderWithProviders } from "@/test/utils";

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
