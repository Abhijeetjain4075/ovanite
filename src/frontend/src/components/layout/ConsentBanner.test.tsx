import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { ConsentBanner } from "@/components/layout/ConsentBanner";
import { CONSENT_STORAGE_KEY } from "@/lib/consent";

describe("ConsentBanner", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("does not request consent for a feature that is disabled", () => {
    render(<ConsentBanner />);

    expect(screen.queryByTestId("consent.banner")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Accept" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Decline" }),
    ).not.toBeInTheDocument();
  });

  it("does not display or reuse a legacy consent choice while analytics are disabled", () => {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, "accepted");

    render(<ConsentBanner />);

    expect(screen.queryByTestId("consent.banner")).not.toBeInTheDocument();
  });
});
