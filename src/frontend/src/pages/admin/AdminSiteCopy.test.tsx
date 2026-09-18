import { screen, waitFor } from "@testing-library/react";
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
    isAuthenticated: true,
    login: vi.fn(),
    isLoggingIn: false,
  }),
}));

vi.mock("@/backend", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/backend")>();
  return { ...actual, createActor: vi.fn() };
});

import AdminSiteCopy from "@/pages/admin/AdminSiteCopy";

describe("AdminSiteCopy", () => {
  beforeEach(() => {
    useActorMock.mockReset();
  });

  it("saves only the fields the admin changed", async () => {
    const user = userEvent.setup();
    const actor = createMockActor();
    actor.getSiteContent.mockResolvedValue({
      updatedAt: 0n,
      heroHeadline: "Software, built to matter.",
    });
    actor.updateSiteContent.mockResolvedValue({ updatedAt: 1n });
    useActorMock.mockReturnValue(actorResult(actor));

    renderWithProviders(<AdminSiteCopy />);

    const headline = await screen.findByTestId(
      "admin.site_copy.heroHeadline_input",
    );
    await user.clear(headline);
    await user.type(headline, "Software that endures.");
    await user.click(screen.getByTestId("admin.site_copy.submit_button"));

    await waitFor(() => {
      expect(actor.updateSiteContent).toHaveBeenCalledWith({
        heroHeadline: "Software that endures.",
      });
    });
  });

  it("saves philosophy, approach, about, and footer copy in one patch", async () => {
    const user = userEvent.setup();
    const actor = createMockActor();
    actor.getSiteContent.mockResolvedValue({ updatedAt: 0n });
    actor.updateSiteContent.mockResolvedValue({ updatedAt: 1n });
    useActorMock.mockReturnValue(actorResult(actor));

    renderWithProviders(<AdminSiteCopy />);

    const philosophyTitle = await screen.findByTestId(
      "admin.site_copy.philosophyTitle_input",
    );
    await user.type(philosophyTitle, "Built with intent.");

    const approachTitle = screen.getByTestId(
      "admin.site_copy.approachTitle_input",
    );
    await user.type(approachTitle, "From idea to outcome.");

    const aboutBody = screen.getByTestId("admin.site_copy.aboutBody_textarea");
    await user.type(aboutBody, "We build software products.");

    const footerText = screen.getByTestId(
      "admin.site_copy.footerText_textarea",
    );
    await user.type(footerText, "Editable footer line.");

    await user.click(screen.getByTestId("admin.site_copy.submit_button"));

    await waitFor(() => {
      expect(actor.updateSiteContent).toHaveBeenCalledWith({
        philosophyTitle: "Built with intent.",
        approachTitle: "From idea to outcome.",
        aboutBody: "We build software products.",
        footerText: "Editable footer line.",
      });
    });
  });

  it("shows an error state with a retry action when the copy fails to load", async () => {
    const actor = createMockActor();
    actor.getSiteContent.mockRejectedValue(new Error("boom"));
    useActorMock.mockReturnValue(actorResult(actor));

    renderWithProviders(<AdminSiteCopy />);

    expect(
      await screen.findByTestId("admin.site_copy.error_state"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Try again" }),
    ).toBeInTheDocument();
  });
});
