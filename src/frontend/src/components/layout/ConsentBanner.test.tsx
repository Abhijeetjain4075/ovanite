import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CONSENT_STORAGE_KEY } from "@/lib/consent";

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

import { ConsentBanner } from "@/components/layout/ConsentBanner";
import { Footer } from "@/components/layout/Footer";

function renderBanner() {
  return render(<ConsentBanner />);
}

describe("ConsentBanner", () => {
  beforeEach(() => {
    window.localStorage.clear();
    useActorMock.mockReset();
  });

  it("appears on a first visit when no choice is stored", () => {
    renderBanner();

    expect(screen.getByTestId("consent.banner")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Accept" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Decline" })).toBeInTheDocument();
  });

  it("does not appear when a choice is already stored", () => {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, "accepted");

    renderBanner();

    expect(screen.queryByTestId("consent.banner")).not.toBeInTheDocument();
  });

  it("persists acceptance and dismisses the banner", async () => {
    const user = userEvent.setup();
    renderBanner();

    await user.click(screen.getByRole("button", { name: "Accept" }));

    expect(window.localStorage.getItem(CONSENT_STORAGE_KEY)).toBe("accepted");
    expect(screen.queryByTestId("consent.banner")).not.toBeInTheDocument();
  });

  it("persists a decline and dismisses the banner", async () => {
    const user = userEvent.setup();
    renderBanner();

    await user.click(screen.getByRole("button", { name: "Decline" }));

    expect(window.localStorage.getItem(CONSENT_STORAGE_KEY)).toBe("declined");
    expect(screen.queryByTestId("consent.banner")).not.toBeInTheDocument();
  });

  it("reopens from the footer Cookie preferences link after a choice was made", async () => {
    const user = userEvent.setup();
    const actor = createMockActor();
    actor.getSiteContent.mockResolvedValue({ updatedAt: 0n });
    useActorMock.mockReturnValue(actorResult(actor));

    window.localStorage.setItem(CONSENT_STORAGE_KEY, "accepted");

    renderWithProviders(
      <>
        <Footer />
        <ConsentBanner />
      </>,
    );

    expect(screen.queryByTestId("consent.banner")).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Cookie preferences" }),
    );

    expect(window.localStorage.getItem(CONSENT_STORAGE_KEY)).toBeNull();
    expect(screen.getByTestId("consent.banner")).toBeInTheDocument();
  });
});
