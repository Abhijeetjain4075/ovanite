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

  it("never records a page view when analytics collection is disabled", async () => {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, "accepted");
    const actor = createMockActor();
    actor.recordPageView.mockResolvedValue({ ignored: null });

    renderAt("/products", actor);

    await waitFor(() => expect(useActorMock).toHaveBeenCalled());
    expect(actor.recordPageView).not.toHaveBeenCalled();
  });

  it("never records page views from declined or missing legacy consent", async () => {
    const actor = createMockActor();
    actor.recordPageView.mockResolvedValue({ ignored: null });

    renderAt("/products", actor);
    await waitFor(() => expect(useActorMock).toHaveBeenCalled());
    expect(actor.recordPageView).not.toHaveBeenCalled();

    window.localStorage.setItem(CONSENT_STORAGE_KEY, "declined");
    const secondActor = createMockActor();
    secondActor.recordPageView.mockResolvedValue({ ignored: null });
    renderAt("/about", secondActor);

    await waitFor(() => expect(useActorMock).toHaveBeenCalled());
    expect(secondActor.recordPageView).not.toHaveBeenCalled();
  });

  it("never attempts analytics updates on admin routes", async () => {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, "accepted");
    const actor = createMockActor();
    actor.recordPageView.mockResolvedValue({ ignored: null });

    renderAt("/admin/faqs", actor);
    await waitFor(() => expect(useActorMock).toHaveBeenCalled());
    expect(actor.recordPageView).not.toHaveBeenCalled();
  });
});
