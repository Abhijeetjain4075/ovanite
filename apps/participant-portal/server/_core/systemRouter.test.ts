import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { notifyOwnerMock } = vi.hoisted(() => ({
  notifyOwnerMock: vi.fn(async () => true),
}));

vi.mock("./notification", () => ({
  notifyOwner: notifyOwnerMock,
}));

const { systemRouter } = await import("./systemRouter");

afterEach(() => vi.unstubAllEnvs());

function callerFor(user: Record<string, unknown>) {
  return systemRouter.createCaller({
    user,
    req: {} as never,
    res: {} as never,
  } as never);
}

describe("owner-only system notifications", () => {
  beforeEach(() => {
    vi.stubEnv("OWNER_OPEN_ID", "configured-owner-open-id");
    notifyOwnerMock.mockClear();
  });

  it("rejects a legacy DB administrator whose portal role is participant", async () => {
    const caller = callerFor({
      id: 7,
      openId: "legacy-admin-open-id",
      role: "admin",
      portalRole: "participant",
    });
    await expect(caller.notifyOwner({ title: "test", content: "test" }))
      .rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(notifyOwnerMock).not.toHaveBeenCalled();
  });

  it("allows only the exact configured owner identity", async () => {
    const caller = callerFor({
      id: 1,
      openId: "configured-owner-open-id",
      role: "user",
      portalRole: "participant",
    });
    await expect(caller.notifyOwner({ title: "test", content: "test" })).resolves.toBe(true);
    expect(notifyOwnerMock).toHaveBeenCalledTimes(1);
  });

  it("does not promote a stale persisted owner when owner configuration is blank", async () => {
    vi.stubEnv("OWNER_OPEN_ID", "");
    const caller = callerFor({
      id: 8,
      openId: "stale-owner-open-id",
      role: "admin",
      portalRole: "owner",
    });
    await expect(caller.notifyOwner({ title: "test", content: "test" }))
      .rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(notifyOwnerMock).not.toHaveBeenCalled();
  });
});
