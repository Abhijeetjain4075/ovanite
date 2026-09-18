import { render, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CONSENT_STORAGE_KEY } from "@/lib/consent";

import { type MockActor, actorResult, createMockActor } from "@/test/utils";

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

import { usePageViewTracking } from "@/hooks/usePageViewTracking";

/** Minimal host so the hook runs inside a real router location. */
function Tracker() {
  usePageViewTracking();
  return null;
}

function renderAt(path: string, actor: MockActor) {
  useActorMock.mockReturnValue(actorResult(actor));
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Tracker />
    </MemoryRouter>,
  );
}

describe("usePageViewTracking", () => {
  beforeEach(() => {
    window.localStorage.clear();
    useActorMock.mockReset();
  });

  it("does not record a page view before consent is granted", async () => {
    const actor = createMockActor();
    actor.recordPageView.mockResolvedValue({ ignored: null });

    renderAt("/products", actor);

    // Give the effect a chance to run; it must not have called the backend.
    await waitFor(() => {
      expect(useActorMock).toHaveBeenCalled();
    });
    expect(actor.recordPageView).not.toHaveBeenCalled();
  });

  it("does not record a page view when consent was declined", async () => {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, "declined");
    const actor = createMockActor();
    actor.recordPageView.mockResolvedValue({ ignored: null });

    renderAt("/products", actor);

    await waitFor(() => {
      expect(useActorMock).toHaveBeenCalled();
    });
    expect(actor.recordPageView).not.toHaveBeenCalled();
  });

  it("records the public route once consent is accepted", async () => {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, "accepted");
    const actor = createMockActor();
    actor.recordPageView.mockResolvedValue({ ignored: null });

    renderAt("/products", actor);

    await waitFor(() => {
      expect(actor.recordPageView).toHaveBeenCalledWith("/products");
    });
    expect(actor.recordPageView).toHaveBeenCalledTimes(1);
  });

  it("never records an admin route even with consent accepted", async () => {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, "accepted");
    const actor = createMockActor();
    actor.recordPageView.mockResolvedValue({ ignored: null });

    renderAt("/admin/faqs", actor);

    await waitFor(() => {
      expect(useActorMock).toHaveBeenCalled();
    });
    expect(actor.recordPageView).not.toHaveBeenCalled();
  });

  it("swallows a backend failure without surfacing it", async () => {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, "accepted");
    const actor = createMockActor();
    actor.recordPageView.mockRejectedValue(new Error("backend unavailable"));

    renderAt("/about", actor);

    await waitFor(() => {
      expect(actor.recordPageView).toHaveBeenCalledWith("/about");
    });
    // No unhandled rejection and no thrown error: the component still rendered.
    expect(actor.recordPageView).toHaveBeenCalledTimes(1);
  });
});
