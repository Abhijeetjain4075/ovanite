import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
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

import { WaitlistForm } from "@/components/forms/WaitlistForm";
import ThankYou from "@/pages/ThankYou";

function renderForm() {
  return renderWithProviders(
    <Routes>
      <Route path="/waitlist" element={<WaitlistForm />} />
      <Route path="/thank-you" element={<h1>Thank you page</h1>} />
    </Routes>,
    { route: "/waitlist" },
  );
}

describe("WaitlistForm", () => {
  beforeEach(() => {
    useActorMock.mockReset();
  });

  it("shows inline validation errors for invalid input", async () => {
    const user = userEvent.setup();
    const actor = createMockActor();
    actor.submitWaitlist.mockResolvedValue({});
    useActorMock.mockReturnValue(actorResult(actor));

    renderForm();

    await user.click(screen.getByRole("button", { name: "Join the waitlist" }));

    expect(
      await screen.findByText("Please enter your name."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Please enter your email address."),
    ).toBeInTheDocument();
    expect(actor.submitWaitlist).not.toHaveBeenCalled();
  });

  it("submits valid input with an optional note and routes to Thank You", async () => {
    const user = userEvent.setup();
    const actor = createMockActor();
    actor.submitWaitlist.mockResolvedValue({});
    useActorMock.mockReturnValue(actorResult(actor));

    renderForm();

    await user.type(screen.getByLabelText("Name"), "Grace Hopper");
    await user.type(screen.getByLabelText("Email"), "grace@example.com");
    await user.type(
      screen.getByLabelText(/Note/),
      "Interested in early access.",
    );
    await user.click(screen.getByRole("button", { name: "Join the waitlist" }));

    await waitFor(() => {
      expect(actor.submitWaitlist).toHaveBeenCalledWith({
        name: "Grace Hopper",
        email: "grace@example.com",
        note: "Interested in early access.",
      });
    });
    expect(
      await screen.findByRole("heading", { name: "Thank you page" }),
    ).toBeInTheDocument();
  });

  it("omits an empty note from the submission payload", async () => {
    const user = userEvent.setup();
    const actor = createMockActor();
    actor.submitWaitlist.mockResolvedValue({});
    useActorMock.mockReturnValue(actorResult(actor));

    renderForm();

    await user.type(screen.getByLabelText("Name"), "Grace Hopper");
    await user.type(screen.getByLabelText("Email"), "grace@example.com");
    await user.click(screen.getByRole("button", { name: "Join the waitlist" }));

    await waitFor(() => {
      expect(actor.submitWaitlist).toHaveBeenCalledWith({
        name: "Grace Hopper",
        email: "grace@example.com",
      });
    });
  });

  it("routes a valid submission to the waitlist confirmation heading", async () => {
    const user = userEvent.setup();
    const actor = createMockActor();
    actor.submitWaitlist.mockResolvedValue({});
    useActorMock.mockReturnValue(actorResult(actor));

    renderWithProviders(
      <Routes>
        <Route path="/waitlist" element={<WaitlistForm />} />
        <Route path="/thank-you" element={<ThankYou />} />
      </Routes>,
      { route: "/waitlist" },
    );

    await user.type(screen.getByLabelText("Name"), "Grace Hopper");
    await user.type(screen.getByLabelText("Email"), "grace@example.com");
    await user.click(screen.getByRole("button", { name: "Join the waitlist" }));

    expect(
      await screen.findByRole("heading", { name: "You're on the list." }),
    ).toBeInTheDocument();
  });

  it("shows the 'Already received' message and does not route when the backend reports a duplicate", async () => {
    const user = userEvent.setup();
    const actor = createMockActor();
    actor.submitWaitlist.mockResolvedValue({
      __kind__: "duplicate",
      duplicate: {
        id: 1n,
        kind: { waitlist: null },
        name: "Grace Hopper",
        email: "grace@example.com",
        message: "Interested in early access.",
        status: { new: null },
        createdAt: 0n,
        updatedAt: 0n,
      },
    });
    useActorMock.mockReturnValue(actorResult(actor));

    renderForm();

    await user.type(screen.getByLabelText("Name"), "Grace Hopper");
    await user.type(screen.getByLabelText("Email"), "grace@example.com");
    await user.type(
      screen.getByLabelText(/Note/),
      "Interested in early access.",
    );
    await user.click(screen.getByRole("button", { name: "Join the waitlist" }));

    expect(
      await screen.findByTestId("waitlist.already_received_state"),
    ).toBeInTheDocument();
    expect(screen.getByText(/Already received/)).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Thank you page" }),
    ).not.toBeInTheDocument();
  });

  it("shows an error state when the backend rejects the submission", async () => {
    const user = userEvent.setup();
    const actor = createMockActor();
    actor.submitWaitlist.mockRejectedValue(new Error("backend down"));
    useActorMock.mockReturnValue(actorResult(actor));

    renderForm();

    await user.type(screen.getByLabelText("Name"), "Grace Hopper");
    await user.type(screen.getByLabelText("Email"), "grace@example.com");
    await user.click(screen.getByRole("button", { name: "Join the waitlist" }));

    expect(
      await screen.findByTestId("waitlist.error_state"),
    ).toBeInTheDocument();
  });

  it("disables the submit button and shows a loading label while the submission is in flight", async () => {
    const user = userEvent.setup();
    const actor = createMockActor();
    let resolveSubmit: (() => void) | undefined;
    actor.submitWaitlist.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveSubmit = resolve;
        }),
    );
    useActorMock.mockReturnValue(actorResult(actor));

    renderForm();

    await user.type(screen.getByLabelText("Name"), "Grace Hopper");
    await user.type(screen.getByLabelText("Email"), "grace@example.com");
    await user.click(screen.getByRole("button", { name: "Join the waitlist" }));

    const pending = await screen.findByRole("button", { name: "Joining…" });
    expect(pending).toBeDisabled();

    resolveSubmit?.();

    expect(
      await screen.findByRole("heading", { name: "Thank you page" }),
    ).toBeInTheDocument();
  });
});
