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

import { ContactForm } from "@/components/forms/ContactForm";
import ThankYou from "@/pages/ThankYou";

function renderForm() {
  return renderWithProviders(
    <Routes>
      <Route path="/contact" element={<ContactForm />} />
      <Route path="/thank-you" element={<h1>Thank you page</h1>} />
    </Routes>,
    { route: "/contact" },
  );
}

describe("ContactForm", () => {
  beforeEach(() => {
    useActorMock.mockReset();
  });

  it("shows inline validation errors and does not call the backend for invalid input", async () => {
    const user = userEvent.setup();
    const actor = createMockActor();
    actor.submitContact.mockResolvedValue({});
    useActorMock.mockReturnValue(actorResult(actor));

    renderForm();

    await user.click(screen.getByRole("button", { name: "Send message" }));

    expect(
      await screen.findByText("Please enter your name."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Please enter your email address."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Please tell us how we can help."),
    ).toBeInTheDocument();
    expect(actor.submitContact).not.toHaveBeenCalled();
  });

  it("rejects a malformed email with an inline error", async () => {
    const user = userEvent.setup();
    const actor = createMockActor();
    actor.submitContact.mockResolvedValue({});
    useActorMock.mockReturnValue(actorResult(actor));

    renderForm();

    await user.type(screen.getByLabelText("Name"), "Ada Lovelace");
    await user.type(screen.getByLabelText("Email"), "not-an-email");
    await user.type(
      screen.getByLabelText("Message"),
      "I would like to learn more about your products.",
    );
    await user.click(screen.getByRole("button", { name: "Send message" }));

    expect(
      await screen.findByText("Please enter a valid email address."),
    ).toBeInTheDocument();
    expect(actor.submitContact).not.toHaveBeenCalled();
  });

  it("submits valid input, stores the submission, and routes to Thank You", async () => {
    const user = userEvent.setup();
    const actor = createMockActor();
    actor.submitContact.mockResolvedValue({});
    useActorMock.mockReturnValue(actorResult(actor));

    renderForm();

    await user.type(screen.getByLabelText("Name"), "Ada Lovelace");
    await user.type(screen.getByLabelText("Email"), "ada@example.com");
    await user.type(
      screen.getByLabelText("Message"),
      "I would like to learn more about your products.",
    );
    await user.click(screen.getByRole("button", { name: "Send message" }));

    await waitFor(() => {
      expect(actor.submitContact).toHaveBeenCalledWith({
        name: "Ada Lovelace",
        email: "ada@example.com",
        message: "I would like to learn more about your products.",
      });
    });
    expect(
      await screen.findByRole("heading", { name: "Thank you page" }),
    ).toBeInTheDocument();
  });

  it("routes a valid submission to the contact confirmation heading", async () => {
    const user = userEvent.setup();
    const actor = createMockActor();
    actor.submitContact.mockResolvedValue({});
    useActorMock.mockReturnValue(actorResult(actor));

    renderWithProviders(
      <Routes>
        <Route path="/contact" element={<ContactForm />} />
        <Route path="/thank-you" element={<ThankYou />} />
      </Routes>,
      { route: "/contact" },
    );

    await user.type(screen.getByLabelText("Name"), "Ada Lovelace");
    await user.type(screen.getByLabelText("Email"), "ada@example.com");
    await user.type(
      screen.getByLabelText("Message"),
      "I would like to learn more about your products.",
    );
    await user.click(screen.getByRole("button", { name: "Send message" }));

    expect(
      await screen.findByRole("heading", {
        name: "Thank you for reaching out.",
      }),
    ).toBeInTheDocument();
  });

  it("shows the 'Already received' message and does not route when the backend reports a duplicate", async () => {
    const user = userEvent.setup();
    const actor = createMockActor();
    actor.submitContact.mockResolvedValue({
      __kind__: "duplicate",
      duplicate: {
        id: 1n,
        kind: { contact: null },
        name: "Ada Lovelace",
        email: "ada@example.com",
        message: "I would like to learn more about your products.",
        status: { new: null },
        createdAt: 0n,
        updatedAt: 0n,
      },
    });
    useActorMock.mockReturnValue(actorResult(actor));

    renderForm();

    await user.type(screen.getByLabelText("Name"), "Ada Lovelace");
    await user.type(screen.getByLabelText("Email"), "ada@example.com");
    await user.type(
      screen.getByLabelText("Message"),
      "I would like to learn more about your products.",
    );
    await user.click(screen.getByRole("button", { name: "Send message" }));

    expect(
      await screen.findByTestId("contact.already_received_state"),
    ).toBeInTheDocument();
    expect(screen.getByText(/Already received/)).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Thank you page" }),
    ).not.toBeInTheDocument();
  });

  it("shows an error state when the backend rejects the submission", async () => {
    const user = userEvent.setup();
    const actor = createMockActor();
    actor.submitContact.mockRejectedValue(new Error("backend down"));
    useActorMock.mockReturnValue(actorResult(actor));

    renderForm();

    await user.type(screen.getByLabelText("Name"), "Ada Lovelace");
    await user.type(screen.getByLabelText("Email"), "ada@example.com");
    await user.type(
      screen.getByLabelText("Message"),
      "I would like to learn more about your products.",
    );
    await user.click(screen.getByRole("button", { name: "Send message" }));

    expect(
      await screen.findByTestId("contact.error_state"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Thank you page" }),
    ).not.toBeInTheDocument();
  });

  it("disables the submit button and shows a loading label while the submission is in flight", async () => {
    const user = userEvent.setup();
    const actor = createMockActor();
    let resolveSubmit: (() => void) | undefined;
    actor.submitContact.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveSubmit = resolve;
        }),
    );
    useActorMock.mockReturnValue(actorResult(actor));

    renderForm();

    await user.type(screen.getByLabelText("Name"), "Ada Lovelace");
    await user.type(screen.getByLabelText("Email"), "ada@example.com");
    await user.type(
      screen.getByLabelText("Message"),
      "I would like to learn more about your products.",
    );
    await user.click(screen.getByRole("button", { name: "Send message" }));

    const pending = await screen.findByRole("button", { name: "Sending…" });
    expect(pending).toBeDisabled();

    resolveSubmit?.();

    expect(
      await screen.findByRole("heading", { name: "Thank you page" }),
    ).toBeInTheDocument();
  });
});
