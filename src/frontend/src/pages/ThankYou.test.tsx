import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";

import ThankYou from "@/pages/ThankYou";

function renderThankYou(state: { kind?: "contact" | "waitlist" } | null) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[{ pathname: "/thank-you", state }]}>
        <Routes>
          <Route path="/thank-you" element={<ThankYou />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("ThankYou page", () => {
  it("shows contact confirmation messaging and onward links", () => {
    renderThankYou({ kind: "contact" });

    expect(
      screen.getByRole("heading", { name: "Thank you for reaching out." }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Explore products/ }),
    ).toHaveAttribute("href", "/products");
    expect(screen.getByRole("link", { name: "Back to home" })).toHaveAttribute(
      "href",
      "/",
    );
  });

  it("shows waitlist confirmation messaging when routed from the waitlist", () => {
    renderThankYou({ kind: "waitlist" });

    expect(
      screen.getByRole("heading", { name: "You're on the list." }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Explore products/ }),
    ).toHaveAttribute("href", "/products");
  });

  it("falls back to contact confirmation messaging when no state is present", () => {
    renderThankYou(null);

    expect(
      screen.getByRole("heading", { name: "Thank you for reaching out." }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "You're on the list." }),
    ).not.toBeInTheDocument();
  });
});
