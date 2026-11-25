import { describe, expect, it } from "vitest";
import {
  appendAuditEvent,
  computeAuditHash,
  type AuditEventRecord,
  type AuditEventValues,
  type AuditExecutor,
  verifyAuditChain,
} from "./auditChain";

const base: AuditEventValues = {
  submissionId: "11111111-1111-4111-8111-111111111111",
  actorId: 7,
  actorRole: "reviewer",
  eventType: "submission_approved",
  fromStatus: "under_review",
  toStatus: "approved",
  details: { reason: "meets rubric", score: 4 },
};

function chain(events: AuditEventValues[]): AuditEventRecord[] {
  let prevHash: string | null = null;
  return events.map((event, index) => {
    const hash = computeAuditHash(prevHash, event);
    const row = { ...event, id: index + 1, prevHash, hash } as AuditEventRecord;
    prevHash = hash;
    return row;
  });
}

describe("audit hash chain", () => {
  it("produces a stable 64-character hex digest", () => {
    const hash = computeAuditHash(null, base);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(computeAuditHash(null, base)).toBe(hash);
  });

  it("changes when any covered field changes", () => {
    const original = computeAuditHash("abc", base);
    const variants: AuditEventValues[] = [
      { ...base, submissionId: null },
      { ...base, actorId: 8 },
      { ...base, actorRole: "owner" },
      { ...base, eventType: "submission_rejected" },
      { ...base, fromStatus: "submitted" },
      { ...base, toStatus: "rejected" },
      { ...base, details: { reason: "meets rubric", score: 5 } },
      { ...base, details: { reason: "meets rubric" } },
    ];
    for (const variant of variants) {
      expect(computeAuditHash("abc", variant)).not.toBe(original);
    }
    expect(computeAuditHash("def", base)).not.toBe(original);
  });

  it("ignores JSON key order so round-tripped rows still verify", () => {
    const a = computeAuditHash(null, { ...base, details: { reason: "x", score: 1 } });
    const b = computeAuditHash(null, { ...base, details: { score: 1, reason: "x" } });
    expect(a).toBe(b);
  });

  it("links each event to the persistent chain-state tip", async () => {
    const inserted: Record<string, unknown>[] = [];
    let tipHash: string | null = null;
    const executor = {
      select: () => ({ from: () => ({ where: () => ({ limit: () => ({
        for: async () => [{ tipHash }],
      }) }) }) }),
      insert: () => ({ values: async (row: Record<string, unknown>) => { inserted.push(row); } }),
      update: () => ({ set: (values: Record<string, unknown>) => ({ where: async () => {
        tipHash = values.tipHash as string;
      } }) }),
    } as unknown as AuditExecutor;

    const first = await appendAuditEvent(executor, base);
    expect(inserted[0]).toMatchObject({ prevHash: null, hash: first, hashVersion: 2 });
    expect(inserted[0].createdAt).toBeInstanceOf(Date);
    expect(tipHash).toBe(first);

    const second = await appendAuditEvent(executor, { ...base, eventType: "submission_published" });
    expect(inserted[1]).toMatchObject({ prevHash: first, hash: second, hashVersion: 2 });
    expect(tipHash).toBe(second);
    expect(second).toBe(computeAuditHash(first, { ...base, eventType: "submission_published" }, 2, inserted[1].createdAt as Date));
  });

  it("refuses to append when the singleton chain-state row is missing", async () => {
    const executor = {
      select: () => ({ from: () => ({ where: () => ({ limit: () => ({
        for: async () => [],
      }) }) }) }),
      insert: () => ({ values: async () => { throw new Error("must not insert"); } }),
      update: () => ({ set: () => ({ where: async () => {} }) }),
    } as unknown as AuditExecutor;
    await expect(appendAuditEvent(executor, base)).rejects.toThrow(/chain state row is missing/i);
  });

  it("serializes concurrent first appends through the locked state row", async () => {
    const inserted: Record<string, unknown>[] = [];
    let tipHash: string | null = null;
    let lockTail: Promise<void> = Promise.resolve();

    const transactionExecutor = (): AuditExecutor => {
      let releaseLock: (() => void) | null = null;
      return {
        select: () => ({ from: () => ({ where: () => ({ limit: () => ({
          for: async () => {
            const previous = lockTail;
            let release!: () => void;
            lockTail = new Promise<void>(resolve => { release = resolve; });
            await previous;
            releaseLock = release;
            return [{ tipHash }];
          },
        }) }) }) }),
        insert: () => ({ values: async (row: Record<string, unknown>) => {
          if ((row.prevHash ?? null) !== tipHash) throw new Error("concurrent audit fork");
          inserted.push(row);
        } }),
        update: () => ({ set: (values: Record<string, unknown>) => ({ where: async () => {
          tipHash = values.tipHash as string;
          releaseLock?.();
          releaseLock = null;
        } }) }),
      } as unknown as AuditExecutor;
    };

    const [first, second] = await Promise.all([
      appendAuditEvent(transactionExecutor(), { ...base, eventType: "concurrent_first" }),
      appendAuditEvent(transactionExecutor(), { ...base, eventType: "concurrent_second" }),
    ]);
    expect(inserted).toHaveLength(2);
    expect(inserted[0].prevHash).toBeNull();
    expect(inserted[1].prevHash).toBe(first);
    expect(tipHash).toBe(second);
    expect(verifyAuditChain([
      { ...base, ...inserted[0], id: 1 } as AuditEventRecord,
      { ...base, ...inserted[1], id: 2 } as AuditEventRecord,
    ]).valid).toBe(true);
  });

  it("verifies an intact chain", () => {
    const rows = chain([base, { ...base, eventType: "submission_published" }, { ...base, eventType: "submission_withdrawn" }]);
    expect(verifyAuditChain(rows)).toEqual({ valid: true, hashedEvents: 3, legacyEvents: 0 });
  });

  it("detects an edited event", () => {
    const rows = chain([base, { ...base, eventType: "submission_published" }, { ...base, eventType: "submission_withdrawn" }]);
    rows[1] = { ...rows[1], details: { reason: "rewritten", score: 5 } };
    expect(verifyAuditChain(rows)).toEqual({ valid: false, brokenAtId: 2, reason: "hash_mismatch" });
  });

  it("detects a deleted event", () => {
    const rows = chain([base, { ...base, eventType: "submission_published" }, { ...base, eventType: "submission_withdrawn" }]);
    const gap = [rows[0], rows[2]];
    expect(verifyAuditChain(gap)).toEqual({ valid: false, brokenAtId: 3, reason: "missing_predecessor" });
  });

  it("counts unhashed legacy rows and restarts the chain after them", () => {
    const legacy = { ...base, id: 1, prevHash: null, hash: null } as AuditEventRecord;
    const rows = [legacy, ...chain([base]).map(row => ({ ...row, id: 2 }))];
    expect(verifyAuditChain(rows)).toEqual({ valid: true, hashedEvents: 1, legacyEvents: 1 });
  });
});


describe("audit chain hardening", () => {
  it("binds version-2 event timestamps into the hash", () => {
    const createdAt = new Date("2026-11-25T09:30:00.000Z");
    const hash = computeAuditHash(null, base, 2, createdAt);
    const row = {
      ...base, id: 1, prevHash: null, hash, hashVersion: 2, createdAt,
    } as AuditEventRecord;
    expect(verifyAuditChain([row]).valid).toBe(true);
    expect(verifyAuditChain([
      { ...row, createdAt: new Date("2026-11-25T09:31:00.000Z") },
    ])).toEqual({ valid: false, brokenAtId: 1, reason: "hash_mismatch" });
  });

  it("does not allow an unhashed event to restart a chain after hashing begins", () => {
    const hashed = chain([base])[0];
    const tampered = {
      ...base, id: 2, prevHash: null, hash: null,
    } as AuditEventRecord;
    expect(verifyAuditChain([hashed, tampered])).toEqual({
      valid: false,
      brokenAtId: 2,
      reason: "unhashed_after_chain_started",
    });
  });

  it("rejects unknown audit hash versions", () => {
    const row = {
      ...base,
      id: 1,
      prevHash: null,
      hash: "0".repeat(64),
      hashVersion: 99,
      createdAt: new Date("2026-11-25T09:30:00.000Z"),
    } as AuditEventRecord;
    expect(verifyAuditChain([row])).toEqual({
      valid: false,
      brokenAtId: 1,
      reason: "unsupported_hash_version",
    });
  });
});
