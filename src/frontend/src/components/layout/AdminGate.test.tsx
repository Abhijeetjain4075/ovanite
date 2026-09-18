import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  actorResult,
  createMockActor,
  renderWithProviders,
} from "@/test/utils";

const { useActorMock, useInternetIdentityMock } = vi.hoisted(() => ({
  useActorMock: vi.fn(),
  useInternetIdentityMock: vi.fn(),
}));

vi.mock("@caffeineai/core-infrastructure", () => ({
  useActor: useActorMock,
  useInternetIdentity: useInternetIdentityMock,
}));

vi.mock("@/backend", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/backend")>();
  return { ...actual, createActor: vi.fn() };
});

import { AdminGate } from "@/components/layout/AdminGate";

function identity(overrides: Record<string, unknown> = {}) {
  return {
    isAuthenticated: false,
    login: vi.fn(),
    isLoggingIn: false,
    ...overrides,
  };
}

describe("AdminGate", () => {
  beforeEach(() => {
    useActorMock.mockReset();
    useInternetIdentityMock.mockReset();
  });

  it("invites an unauthenticated visitor to sign in and hides admin content", () => {
    useInternetIdentityMock.mockReturnValue(identity());
    const actor = createMockActor();
    actor.getCallerAdmin.mockResolvedValue(null);
    actor.isOwnerClaimed.mockResolvedValue(true);
    useActorMock.mockReturnValue(actorResult(actor));

    renderWithProviders(
      <AdminGate>
        <p>Secret admin content</p>
      </AdminGate>,
    );

    expect(
      screen.getByRole("heading", { name: "Admin access" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
    expect(screen.queryByText("Secret admin content")).not.toBeInTheDocument();
  });

  it("denies a signed-in non-admin and offers no admin content", async () => {
    useInternetIdentityMock.mockReturnValue(
      identity({ isAuthenticated: true }),
    );
    const actor = createMockActor();
    actor.getCallerAdmin.mockResolvedValue(null);
    actor.isOwnerClaimed.mockResolvedValue(true);
    useActorMock.mockReturnValue(actorResult(actor));

    renderWithProviders(
      <AdminGate>
        <p>Secret admin content</p>
      </AdminGate>,
    );

    expect(
      await screen.findByRole("heading", { name: "Not authorised" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Secret admin content")).not.toBeInTheDocument();
  });

  it("renders admin content for an authenticated admin", async () => {
    useInternetIdentityMock.mockReturnValue(
      identity({ isAuthenticated: true }),
    );
    const actor = createMockActor();
    actor.getCallerAdmin.mockResolvedValue({
      principal: { toText: () => "aaaaa-aa" },
      role: "owner",
      isOwner: true,
      addedAt: 0n,
    });
    actor.isOwnerClaimed.mockResolvedValue(true);
    useActorMock.mockReturnValue(actorResult(actor));

    renderWithProviders(
      <AdminGate>
        <p>Secret admin content</p>
      </AdminGate>,
    );

    expect(await screen.findByText("Secret admin content")).toBeInTheDocument();
  });

  it("offers the one-time owner claim while no owner exists", async () => {
    useInternetIdentityMock.mockReturnValue(
      identity({ isAuthenticated: true }),
    );
    const actor = createMockActor();
    actor.getCallerAdmin.mockResolvedValue(null);
    actor.isOwnerClaimed.mockResolvedValue(false);
    useActorMock.mockReturnValue(actorResult(actor));

    renderWithProviders(
      <AdminGate>
        <p>Secret admin content</p>
      </AdminGate>,
    );

    expect(
      await screen.findByTestId("admin.claim_owner_panel"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Claim owner access/ }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Secret admin content")).not.toBeInTheDocument();
  });

  it("submits the entered email to the one-time owner claim", async () => {
    const user = userEvent.setup();
    useInternetIdentityMock.mockReturnValue(
      identity({ isAuthenticated: true }),
    );
    const actor = createMockActor();
    actor.getCallerAdmin.mockResolvedValue(null);
    actor.isOwnerClaimed.mockResolvedValue(false);
    actor.claimOwner.mockResolvedValue(true);
    useActorMock.mockReturnValue(actorResult(actor));

    renderWithProviders(
      <AdminGate>
        <p>Secret admin content</p>
      </AdminGate>,
    );

    const email = await screen.findByTestId("admin.claim_owner.email_input");
    await user.type(email, "therealabhijeetjain@gmail.com");
    await user.click(screen.getByTestId("admin.claim_owner.submit_button"));

    await waitFor(() => {
      expect(actor.claimOwner).toHaveBeenCalledWith(
        "therealabhijeetjain@gmail.com",
      );
    });
  });

  it("requires an email before attempting the owner claim", async () => {
    const user = userEvent.setup();
    useInternetIdentityMock.mockReturnValue(
      identity({ isAuthenticated: true }),
    );
    const actor = createMockActor();
    actor.getCallerAdmin.mockResolvedValue(null);
    actor.isOwnerClaimed.mockResolvedValue(false);
    actor.claimOwner.mockResolvedValue(true);
    useActorMock.mockReturnValue(actorResult(actor));

    renderWithProviders(
      <AdminGate>
        <p>Secret admin content</p>
      </AdminGate>,
    );

    await screen.findByTestId("admin.claim_owner.email_input");
    await user.click(screen.getByTestId("admin.claim_owner.submit_button"));

    expect(
      await screen.findByTestId("admin.claim_owner.error_state"),
    ).toHaveTextContent("Enter the owner email address.");
    expect(actor.claimOwner).not.toHaveBeenCalled();
  });

  it("shows a mismatch error and grants no access when the email is not the owner", async () => {
    const user = userEvent.setup();
    useInternetIdentityMock.mockReturnValue(
      identity({ isAuthenticated: true }),
    );
    const actor = createMockActor();
    actor.getCallerAdmin.mockResolvedValue(null);
    actor.isOwnerClaimed.mockResolvedValue(false);
    actor.claimOwner.mockRejectedValue(
      new Error("email is not the configured owner"),
    );
    useActorMock.mockReturnValue(actorResult(actor));

    renderWithProviders(
      <AdminGate>
        <p>Secret admin content</p>
      </AdminGate>,
    );

    const email = await screen.findByTestId("admin.claim_owner.email_input");
    await user.type(email, "someone-else@example.com");
    await user.click(screen.getByTestId("admin.claim_owner.submit_button"));

    expect(
      await screen.findByTestId("admin.claim_owner.error_state"),
    ).toHaveTextContent(
      "That email does not match the configured owner address.",
    );
    expect(screen.queryByText("Secret admin content")).not.toBeInTheDocument();
  });
});
