import { screen } from "@testing-library/react";
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

import Privacy from "@/pages/Privacy";

describe("Privacy Policy", () => {
  beforeEach(() => {
    useActorMock.mockReset();
  });

  it("describes the aggregate counter, what is stored, and consent", async () => {
    const actor = createMockActor();
    actor.getSiteContent.mockResolvedValue({ updatedAt: 0n });
    useActorMock.mockReturnValue(actorResult(actor));

    renderWithProviders(<Privacy />);

    expect(
      await screen.findByRole("heading", { name: "Privacy Policy" }),
    ).toBeInTheDocument();

    // The counter is described as aggregate and stored in the app's own backend.
    expect(
      screen.getByText(/we store a route path and a running view count/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/no third-party analytics service is involved/i),
    ).toBeInTheDocument();

    // Consent is granted on first visit and can be withdrawn from the footer.
    expect(
      screen.getByText(/only happens after you accept the consent banner/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/change or withdraw your consent at any time/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Cookie preferences/i)).toBeInTheDocument();
  });

  it("renders admin-edited privacy copy instead of the default", async () => {
    const actor = createMockActor();
    actor.getSiteContent.mockResolvedValue({
      updatedAt: 0n,
      privacyBody: "Custom privacy paragraph.",
    });
    useActorMock.mockReturnValue(actorResult(actor));

    renderWithProviders(<Privacy />);

    expect(
      await screen.findByText("Custom privacy paragraph."),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/we store a route path and a running view count/i),
    ).not.toBeInTheDocument();
  });
});
