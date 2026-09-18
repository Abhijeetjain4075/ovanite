import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Admin } from "@/types/content";

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

import AdminTeam from "@/pages/admin/AdminTeam";

const OWNER = "aaaaa-aa";
const EDITOR = "2vxsx-fae";

function admin(overrides: Partial<Admin> = {}): Admin {
  return {
    principal: { toText: () => OWNER } as Admin["principal"],
    role: "owner" as Admin["role"],
    isOwner: true,
    addedAt: 0n,
    ...overrides,
  };
}

describe("AdminTeam", () => {
  beforeEach(() => {
    useActorMock.mockReset();
  });

  it("lets the owner add an admin by principal and role", async () => {
    const user = userEvent.setup();
    const actor = createMockActor();
    actor.isCallerOwner.mockResolvedValue(true);
    actor.isOwnerClaimed.mockResolvedValue(true);
    actor.listAdmins.mockResolvedValue([admin()]);
    actor.addAdmin.mockResolvedValue(true);
    useActorMock.mockReturnValue(actorResult(actor));

    renderWithProviders(<AdminTeam />);

    await screen.findByTestId("admin.team.list");
    await user.type(screen.getByTestId("admin.team.principal_input"), EDITOR);
    await user.click(screen.getByTestId("admin.team.add_button"));

    await waitFor(() => {
      expect(actor.addAdmin).toHaveBeenCalledTimes(1);
    });
    const [principal, role] = actor.addAdmin.mock.calls[0];
    expect(principal.toText()).toBe(EDITOR);
    expect(role).toBe("editor");
  });

  it("lets the owner remove a non-owner admin", async () => {
    const user = userEvent.setup();
    const actor = createMockActor();
    actor.isCallerOwner.mockResolvedValue(true);
    actor.isOwnerClaimed.mockResolvedValue(true);
    actor.listAdmins.mockResolvedValue([
      admin(),
      admin({
        principal: { toText: () => EDITOR } as Admin["principal"],
        role: "editor" as Admin["role"],
        isOwner: false,
      }),
    ]);
    actor.removeAdmin.mockResolvedValue(true);
    useActorMock.mockReturnValue(actorResult(actor));

    renderWithProviders(<AdminTeam />);

    const list = await screen.findByTestId("admin.team.list");
    await user.click(within(list).getByTestId("admin.team.remove_button.2"));

    await waitFor(() => {
      expect(actor.removeAdmin).toHaveBeenCalledTimes(1);
    });
    expect(actor.removeAdmin.mock.calls[0][0].toText()).toBe(EDITOR);
  });

  it("hides management controls from a non-owner admin", async () => {
    const actor = createMockActor();
    actor.isCallerOwner.mockResolvedValue(false);
    actor.isOwnerClaimed.mockResolvedValue(true);
    actor.listAdmins.mockResolvedValue([
      admin({
        principal: { toText: () => EDITOR } as Admin["principal"],
        role: "editor" as Admin["role"],
        isOwner: false,
      }),
    ]);
    useActorMock.mockReturnValue(actorResult(actor));

    renderWithProviders(<AdminTeam />);

    await screen.findByTestId("admin.team.list");
    expect(
      screen.getByTestId("admin.team.owner_only_state"),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("admin.team.add_button"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("admin.team.remove_button.1"),
    ).not.toBeInTheDocument();
  });

  it("shows an empty state when there are no admins", async () => {
    const actor = createMockActor();
    actor.isCallerOwner.mockResolvedValue(true);
    actor.isOwnerClaimed.mockResolvedValue(true);
    actor.listAdmins.mockResolvedValue([]);
    useActorMock.mockReturnValue(actorResult(actor));

    renderWithProviders(<AdminTeam />);

    expect(
      await screen.findByTestId("admin.team.empty_state"),
    ).toBeInTheDocument();
  });
});
