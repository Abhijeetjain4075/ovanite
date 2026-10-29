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

  it("accurately describes the currently disabled collection features", async () => {
    const actor = createMockActor();
    actor.getSiteContent.mockResolvedValue({ updatedAt: 0n });
    useActorMock.mockReturnValue(actorResult(actor));

    renderWithProviders(<Privacy />);

    expect(
      await screen.findByRole("heading", { name: "Privacy Policy" }),
    ).toBeInTheDocument();

    expect(
      screen.getByText(/contact and waitlist forms are currently disabled/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/page-view analytics is also disabled/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/we store a route path and a running view count/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /Cookie preferences/i }),
    ).not.toBeInTheDocument();
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
