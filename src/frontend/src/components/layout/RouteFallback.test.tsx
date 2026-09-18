import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RouteFallback } from "@/components/layout/RouteFallback";

/**
 * The route-level Suspense fallback. It is what a visitor sees while a lazily
 * imported page chunk downloads, so it must be a real, announced loading state
 * rather than a blank screen.
 */
describe("RouteFallback", () => {
  it("renders an announced loading state instead of a blank screen", () => {
    render(<RouteFallback />);

    const status = screen.getByTestId("route.loading_state");
    expect(status).toBeInTheDocument();
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(screen.getByText("Loading page…")).toBeInTheDocument();
  });
});
