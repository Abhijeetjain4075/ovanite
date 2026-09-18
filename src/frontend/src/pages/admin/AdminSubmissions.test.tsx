import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Submission } from "@/types/content";

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

import AdminSubmissions from "@/pages/admin/AdminSubmissions";

function submission(overrides: Partial<Submission> = {}): Submission {
  return {
    id: 1n,
    kind: "contact" as Submission["kind"],
    status: "new" as Submission["status"],
    name: "Ada Lovelace",
    email: "ada@example.com",
    message: "Hello there.",
    createdAt: 1_000_000_000n,
    updatedAt: 1_000_000_000n,
    ...overrides,
  };
}

describe("AdminSubmissions inbox", () => {
  beforeEach(() => {
    useActorMock.mockReset();
  });

  it("lists submissions newest-first and shows the unread count", async () => {
    const actor = createMockActor();
    actor.listSubmissions.mockResolvedValue([
      submission({ id: 2n, name: "Newest", createdAt: 2_000_000_000n }),
      submission({ id: 1n, name: "Oldest", createdAt: 1_000_000_000n }),
    ]);
    useActorMock.mockReturnValue(actorResult(actor));

    renderWithProviders(<AdminSubmissions />);

    const list = await screen.findByTestId("admin.submissions.list");
    const items = within(list).getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(within(items[0]).getByText("Newest")).toBeInTheDocument();
    expect(within(items[1]).getByText("Oldest")).toBeInTheDocument();
    expect(
      screen.getByTestId("admin.submissions.unread_badge"),
    ).toHaveTextContent("2 unread");
  });

  it("shows submission details when an entry is selected", async () => {
    const user = userEvent.setup();
    const actor = createMockActor();
    actor.listSubmissions.mockResolvedValue([
      submission({
        id: 1n,
        name: "Ada Lovelace",
        email: "ada@example.com",
        message: "A detailed message.",
      }),
    ]);
    useActorMock.mockReturnValue(actorResult(actor));

    renderWithProviders(<AdminSubmissions />);

    const list = await screen.findByTestId("admin.submissions.list");
    await user.click(within(list).getByRole("button"));

    const detail = await screen.findByTestId("admin.submission_detail.panel");
    expect(within(detail).getByText("A detailed message.")).toBeInTheDocument();
    expect(within(detail).getByText("ada@example.com")).toBeInTheDocument();
  });

  it("filters by kind when the Contact tab is selected", async () => {
    const user = userEvent.setup();
    const actor = createMockActor();
    actor.listSubmissions.mockImplementation(
      async (filter: { kind?: string }) => {
        const all = [
          submission({ id: 1n, kind: "contact" as Submission["kind"] }),
          submission({ id: 2n, kind: "waitlist" as Submission["kind"] }),
        ];
        return filter.kind
          ? all.filter((item) => item.kind === filter.kind)
          : all;
      },
    );
    useActorMock.mockReturnValue(actorResult(actor));

    renderWithProviders(<AdminSubmissions />);

    await screen.findByTestId("admin.submissions.list");
    await user.click(screen.getByTestId("admin.submissions.kind.contact"));

    await waitFor(() => {
      expect(actor.listSubmissions).toHaveBeenCalledWith(
        expect.objectContaining({ kind: "contact" }),
      );
    });
  });

  it("marks a submission as read and persists the status through the backend", async () => {
    const user = userEvent.setup();
    const actor = createMockActor();
    actor.listSubmissions.mockResolvedValue([
      submission({ id: 1n, status: "new" as Submission["status"] }),
    ]);
    actor.setSubmissionStatus.mockResolvedValue(
      submission({ id: 1n, status: "read" as Submission["status"] }),
    );
    useActorMock.mockReturnValue(actorResult(actor));

    renderWithProviders(<AdminSubmissions />);

    const list = await screen.findByTestId("admin.submissions.list");
    await user.click(within(list).getByRole("button"));

    const detail = await screen.findByTestId("admin.submission_detail.panel");
    await user.click(
      within(detail).getByTestId("admin.submission_detail.mark_read_button"),
    );

    await waitFor(() => {
      expect(actor.setSubmissionStatus).toHaveBeenCalledWith(1n, "read");
    });
  });

  it("marks a submission as handled and persists the status through the backend", async () => {
    const user = userEvent.setup();
    const actor = createMockActor();
    actor.listSubmissions.mockResolvedValue([
      submission({ id: 1n, status: "new" as Submission["status"] }),
    ]);
    actor.setSubmissionStatus.mockResolvedValue(
      submission({ id: 1n, status: "handled" as Submission["status"] }),
    );
    useActorMock.mockReturnValue(actorResult(actor));

    renderWithProviders(<AdminSubmissions />);

    const list = await screen.findByTestId("admin.submissions.list");
    await user.click(within(list).getByRole("button"));

    const detail = await screen.findByTestId("admin.submission_detail.panel");
    await user.click(
      within(detail).getByTestId("admin.submission_detail.mark_handled_button"),
    );

    await waitFor(() => {
      expect(actor.setSubmissionStatus).toHaveBeenCalledWith(1n, "handled");
    });
  });

  it("shows an empty state when no submissions match", async () => {
    const actor = createMockActor();
    actor.listSubmissions.mockResolvedValue([]);
    useActorMock.mockReturnValue(actorResult(actor));

    renderWithProviders(<AdminSubmissions />);

    expect(
      await screen.findByTestId("admin.submissions.empty_state"),
    ).toBeInTheDocument();
  });

  it("shows an error state with a retry action when the inbox fails to load", async () => {
    const actor = createMockActor();
    actor.listSubmissions.mockRejectedValue(new Error("boom"));
    useActorMock.mockReturnValue(actorResult(actor));

    renderWithProviders(<AdminSubmissions />);

    expect(
      await screen.findByTestId("admin.submissions.error_state"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Retry/ })).toBeInTheDocument();
  });
});
