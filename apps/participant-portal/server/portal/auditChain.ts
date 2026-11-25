import { createHash } from "node:crypto";
import { eq } from "drizzle-orm";
import { portalAuditChainState, portalAuditEvents } from "../../drizzle/schema";
import type { getDb } from "../db";

type Database = NonNullable<Awaited<ReturnType<typeof getDb>>>;

/**
 * Either the pooled database or a transaction opened on it. Callers must pass
 * the transaction that writes the state change so the audit append commits atomically.
 */
export type AuditExecutor = Pick<Database, "select" | "insert" | "update">;

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
  /** Missing values are treated as v1 for historical rows and test fixtures. */
  hashVersion?: number | null;
  createdAt?: Date | string | null;
};

const GENESIS = "genesis";
const CURRENT_HASH_VERSION = 2;

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

function canonicalTimestamp(value: Date | string | null | undefined): string {
  const date = value instanceof Date
    ? new Date(value.getTime())
    : new Date(value ?? Number.NaN);
  if (!Number.isFinite(date.getTime())) {
    throw new Error("A valid createdAt timestamp is required for audit hash version 2.");
  }
  // MySQL TIMESTAMP without fractional precision persists to whole seconds.
  // Normalize a copy before hashing so caller-owned Date values are not mutated.
  date.setMilliseconds(0);
  return date.toISOString();
}

/**
 * V1 is retained byte-for-byte for existing audit history. V2 additionally
 * commits to createdAt, preventing silent edits to event chronology.
 */
export function canonicalAuditPayload(
  values: AuditEventValues,
  version = 1,
  createdAt?: Date | string | null,
): string {
  const payload: unknown[] = [
    values.submissionId ?? null,
    values.actorId ?? null,
    values.actorRole,
    values.eventType,
    values.fromStatus ?? null,
    values.toStatus ?? null,
    canonicalValue(values.details ?? null),
  ];
  if (version === 2) payload.push(canonicalTimestamp(createdAt));
  else if (version !== 1) throw new Error(`Unsupported audit hash version: ${version}`);
  return JSON.stringify(payload);
}

export function computeAuditHash(
  prevHash: string | null,
  values: AuditEventValues,
  version = 1,
  createdAt?: Date | string | null,
): string {
  return createHash("sha256")
    .update(`${prevHash ?? GENESIS}\n${canonicalAuditPayload(values, version, createdAt)}`)
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
 * Appends one event. The caller must pass its existing DB transaction so the
 * state change and audit row commit atomically. New V2 hashes include createdAt;
 * old V1 events remain verifiable during the migration.
 */
export async function appendAuditEvent(
  executor: AuditExecutor,
  values: AuditEventValues,
): Promise<string> {
  const [state] = await executor
    .select({ tipHash: portalAuditChainState.tipHash })
    .from(portalAuditChainState)
    .where(eq(portalAuditChainState.id, 1))
    .limit(1)
    .for("update");

  if (!state) {
    throw new Error("Audit chain state row is missing; apply the portal audit-chain migration.");
  }

  const prevHash = state.tipHash ?? null;
  const createdAt = new Date();
  createdAt.setMilliseconds(0);
  const hash = computeAuditHash(prevHash, values, CURRENT_HASH_VERSION, createdAt);

  await executor.insert(portalAuditEvents).values({
    ...normalize(values),
    createdAt,
    hashVersion: CURRENT_HASH_VERSION,
    prevHash,
    hash,
  });
  await executor.update(portalAuditChainState)
    .set({ tipHash: hash, updatedAt: new Date() })
    .where(eq(portalAuditChainState.id, 1));
  return hash;
}

export type AuditChainVerification =
  | { valid: true; hashedEvents: number; legacyEvents: number }
  | {
      valid: false;
      brokenAtId: number;
      reason: "missing_predecessor" | "hash_mismatch" | "unhashed_after_chain_started" | "unsupported_hash_version";
    };

/**
 * Legacy unhashed rows are accepted only as a prefix. Once a hashed event has
 * started the chain, a null-hash row is corruption and cannot reset genesis.
 * V1 and V2 are independently verifiable for backward-compatible migrations.
 */
export function verifyAuditChain(rows: AuditEventRecord[]): AuditChainVerification {
  let expectedPrevHash: string | null = null;
  let hashedEvents = 0;
  let legacyEvents = 0;

  for (const row of rows) {
    if (row.hash == null) {
      if (hashedEvents > 0) {
        return { valid: false, brokenAtId: row.id, reason: "unhashed_after_chain_started" };
      }
      if (row.prevHash != null) {
        return { valid: false, brokenAtId: row.id, reason: "missing_predecessor" };
      }
      legacyEvents += 1;
      continue;
    }
    if ((row.prevHash ?? null) !== expectedPrevHash) {
      return { valid: false, brokenAtId: row.id, reason: "missing_predecessor" };
    }

    const version = row.hashVersion ?? 1;
    let expectedHash: string;
    try {
      expectedHash = computeAuditHash(expectedPrevHash, row, version, row.createdAt);
    } catch {
      return {
        valid: false,
        brokenAtId: row.id,
        reason: version === 1 || version === 2 ? "hash_mismatch" : "unsupported_hash_version",
      };
    }
    if (expectedHash !== row.hash) {
      return { valid: false, brokenAtId: row.id, reason: "hash_mismatch" };
    }
    expectedPrevHash = row.hash;
    hashedEvents += 1;
  }

  return { valid: true, hashedEvents, legacyEvents };
}
