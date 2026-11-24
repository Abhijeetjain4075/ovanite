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

  it("links each event to the previous hash", async () => {
    const inserted: Record<string, unknown>[] = [];
    let tailHash: string | null = null;
    const executor = {
      select: () => ({ from: () => ({ orderBy: () => ({ limit: () => ({
        for: async () => (tailHash === null ? [] : [{ hash: tailHash }]),
      }) }) }) }),
      insert: () => ({ values: async (row: Record<string, unknown>) => { inserted.push(row); } }),
    } as unknown as AuditExecutor;

    const first = await appendAuditEvent(executor, base);
    expect(inserted[0]).toMatchObject({ prevHash: null, hash: first });
    tailHash = first;

    const second = await appendAuditEvent(executor, { ...base, eventType: "submission_published" });
    expect(inserted[1]).toMatchObject({ prevHash: first, hash: second });
    expect(second).toBe(computeAuditHash(first, { ...base, eventType: "submission_published" }));
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
