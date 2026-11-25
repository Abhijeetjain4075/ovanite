/**
 * D1 implementation of the intake store contract.
 *
 * Every statement is parameterized; no SQL is assembled from request data. The
 * duplicate path relies on the unique index rather than a read-then-write
 * check, so two simultaneous identical submissions can never both be stored.
 */

export function createD1Store(db) {
  return {
    async findByDedupe(kind, dedupeHash) {
      const row = await db
        .prepare("SELECT id FROM intake WHERE kind = ? AND dedupe_hash = ?")
        .bind(kind, dedupeHash)
        .first();
      return row?.id ?? null;
    },

    async insert(record) {
      try {
        await db
          .prepare(
            `INSERT INTO intake
               (id, kind, name, email, message, note, project, stack, repository,
                status, dedupe_hash, created_at, source_origin, ip_hash, request_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          )
          .bind(
            record.id,
            record.kind,
            record.name,
            record.email,
            record.message ?? null,
            record.note ?? null,
            record.project ?? null,
            record.stack ?? null,
            record.repository ?? null,
            record.status ?? null,
            record.dedupeHash,
            record.createdAt,
            record.sourceOrigin,
            record.ipHash,
            record.requestId ?? null,
          )
          .run();
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (/UNIQUE constraint failed/i.test(message)) {
          const duplicate = new Error("duplicate submission");
          duplicate.code = "DUPLICATE";
          throw duplicate;
        }
        throw error;
      }
    },

    async takeRateToken(bucket, windowStart) {
      const row = await db
        .prepare(
          `INSERT INTO intake_rate (bucket, window_start, count)
           VALUES (?, ?, 1)
           ON CONFLICT(bucket) DO UPDATE SET count = count + 1
           RETURNING count`,
        )
        .bind(bucket, windowStart)
        .first();
      return Number(row?.count ?? 1);
    },

    async list(limit) {
      const result = await db
        .prepare(
          `SELECT id, kind, name, email, message, note, project, stack,
                  repository, status, created_at, source_origin
           FROM intake ORDER BY created_at DESC LIMIT ?`,
        )
        .bind(limit)
        .all();
      return result.results ?? [];
    },

    async ping() {
      await db.prepare("SELECT 1").first();
      return true;
    },
  };
}
