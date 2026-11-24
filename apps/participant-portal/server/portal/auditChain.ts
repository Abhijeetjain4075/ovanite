import { createHash } from "node:crypto";
import { desc } from "drizzle-orm";
import { portalAuditEvents } from "../../drizzle/schema";
import type { getDb } from "../db";

type Database = NonNullable<Awaited<ReturnType<typeof getDb>>>;

/**
 * Either the pooled database or a transaction opened on it. The audit chain is
 * only correct when the caller passes the same executor that writes the state
 * change, so both are accepted explicitly.
 */
export type AuditExecutor = Pick<Database, "select" | "insert">;

export type AuditEventValues = {
  submissionId?: string | null;
  actorId?: number | null;
  actorRole: string;
  eventType: string;
  fromStatus?: string | null;
  toStatus?: string | null;
  details?: Record<string, unknown> | null;
};

export type AuditEventRecord = AuditEventValues & {
  id: number;
  prevHash: string | null;
  hash: string | null;
};

/** Sentinel used for the first link so a null predecessor can never be spoofed. */
const GENESIS = "genesis";

function canonicalValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalValue);
  if (value && typeof value === "object") {
    const source = value as Record<string, unknown>;
    return Object.keys(source).sort().reduce<Record<string, unknown>>((acc, key) => {
      acc[key] = canonicalValue(source[key]);
      return acc;
    }, {});
  }
  return value;
}

/**
 * Stable serialization of the fields covered by the chain. Object keys are
 * sorted so a JSON column round-tripped by MySQL hashes identically, and the
 * field order is fixed so a reordered insert cannot collide with a real one.
 */
export function canonicalAuditPayload(values: AuditEventValues): string {
  return JSON.stringify([
    values.submissionId ?? null,
    values.actorId ?? null,
    values.actorRole,
    values.eventType,
    values.fromStatus ?? null,
    values.toStatus ?? null,
    canonicalValue(values.details ?? null),
  ]);
}

export function computeAuditHash(prevHash: string | null, values: AuditEventValues): string {
  return createHash("sha256")
    .update(`${prevHash ?? GENESIS}\n${canonicalAuditPayload(values)}`)
    .digest("hex");
}

function normalize(values: AuditEventValues) {
  return {
    submissionId: values.submissionId ?? null,
    actorId: values.actorId ?? null,
    actorRole: values.actorRole,
    eventType: values.eventType,
    fromStatus: values.fromStatus ?? null,
    toStatus: values.toStatus ?? null,
    details: values.details ?? null,
  };
}

/**
 * Appends one event and returns its hash.
 *
 * The predecessor row is read with `FOR UPDATE` inside the caller's
 * transaction, so two concurrent appends serialize on the current tail instead
 * of both linking to the same predecessor and forking the chain. Call this with
 * the transaction that performs the audited change; inserting outside a
 * transaction weakens the guarantee and is reported by `verifyAuditChain` if it
 * ever produces a fork.
 */
export async function appendAuditEvent(
  executor: AuditExecutor,
  values: AuditEventValues,
): Promise<string> {
  const [tail] = await executor
    .select({ hash: portalAuditEvents.hash })
    .from(portalAuditEvents)
    .orderBy(desc(portalAuditEvents.id))
    .limit(1)
    .for("update");

  const prevHash = tail?.hash ?? null;
  const hash = computeAuditHash(prevHash, values);

  await executor.insert(portalAuditEvents).values({ ...normalize(values), prevHash, hash });
  return hash;
}

export type AuditChainVerification =
  | { valid: true; hashedEvents: number; legacyEvents: number }
  | { valid: false; brokenAtId: number; reason: "missing_predecessor" | "hash_mismatch" };

/**
 * Recomputes the chain over rows ordered by id.
 *
 * Rows written before this chain existed have a null hash and are counted as
 * legacy: they cannot be verified retroactively, and the chain restarts after
 * them. A deleted or edited hashed row breaks the link at the next hashed row,
 * which is exactly the tamper signal this exists to produce.
 */
export function verifyAuditChain(rows: AuditEventRecord[]): AuditChainVerification {
  let expectedPrevHash: string | null = null;
  let hashedEvents = 0;
  let legacyEvents = 0;

  for (const row of rows) {
    if (row.hash == null) {
      legacyEvents += 1;
      expectedPrevHash = null;
      continue;
    }
    if ((row.prevHash ?? null) !== expectedPrevHash) {
      return { valid: false, brokenAtId: row.id, reason: "missing_predecessor" };
    }
    if (computeAuditHash(expectedPrevHash, row) !== row.hash) {
      return { valid: false, brokenAtId: row.id, reason: "hash_mismatch" };
    }
    expectedPrevHash = row.hash;
    hashedEvents += 1;
  }

  return { valid: true, hashedEvents, legacyEvents };
}
