/**
 * D1 implementation of the intake store contract.
 *
 * Every statement is parameterized; no SQL is assembled from request data. The
 * duplicate path relies on the unique index rather than a read-then-write
 * check, so two simultaneous identical submissions can never both be stored.
 */

const INSERT_SUBMISSION = `INSERT INTO intake
   (id, kind, name, email, message, note, project, stack, repository,
    status, dedupe_hash, created_at, source_origin, ip_hash, request_id)
 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

const INSERT_FILE = `INSERT INTO intake_file
   (id, submission_id, object_key, name, size, content_type, digest, created_at)
 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

function submissionStatement(db, record) {
  return db.prepare(INSERT_SUBMISSION).bind(
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
  );
}

function fileStatement(db, row) {
  return db.prepare(INSERT_FILE).bind(
    row.id,
    row.submissionId,
    row.objectKey,
    row.name,
    row.size,
    row.contentType,
    row.digest,
    row.createdAt,
  );
}

function asDuplicateError(error) {
  const message = error instanceof Error ? error.message : String(error);
  if (/UNIQUE constraint failed/i.test(message)) {
    const duplicate = new Error("duplicate submission");
    duplicate.code = "DUPLICATE";
    return duplicate;
  }
  return null;
}

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
        await submissionStatement(db, record).run();
      } catch (error) {
        const duplicate = asDuplicateError(error);
        if (duplicate) throw duplicate;
        throw error;
      }
    },

    /**
     * The submission and its attachment rows land in one batch: D1 applies the
     * batch as a transaction, so a submission can never point at a file row that
     * was rolled back, and vice versa.
     */
    async insertWithFiles(record, files) {
      const statements = [
        submissionStatement(db, record),
        ...files.map((row) => fileStatement(db, row)),
      ];
      try {
        await db.batch(statements);
      } catch (error) {
        const duplicate = asDuplicateError(error);
        if (duplicate) throw duplicate;
        throw error;
      }
    },

    async insertFiles(files) {
      await db.batch(files.map((row) => fileStatement(db, row)));
    },

    async listFiles(submissionId) {
      const result = await db
        .prepare(
          `SELECT id, submission_id, object_key, name, size, content_type,
                  digest, created_at
             FROM intake_file
            WHERE submission_id = ?
            ORDER BY created_at ASC`,
        )
        .bind(submissionId)
        .all();
      return (result.results ?? []).map((row) => ({
        id: row.id,
        submissionId: row.submission_id,
        objectKey: row.object_key,
        name: row.name,
        size: Number(row.size),
        contentType: row.content_type,
        digest: row.digest,
        createdAt: row.created_at,
      }));
    },

    async findFile(fileId) {
      const row = await db
        .prepare(
          `SELECT id, submission_id, object_key, name, size, content_type,
                  digest, created_at
             FROM intake_file
            WHERE id = ?`,
        )
        .bind(fileId)
        .first();
      if (!row) return null;
      return {
        id: row.id,
        submissionId: row.submission_id,
        objectKey: row.object_key,
        name: row.name,
        size: Number(row.size),
        contentType: row.content_type,
        digest: row.digest,
        createdAt: row.created_at,
      };
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

    /**
     * Removes a submission and its file rows in one batch, so neither can
     * outlive the other. Returns false when the record did not exist.
     */
    async deleteSubmission(submissionId) {
      const results = await db.batch([
        db
          .prepare("DELETE FROM intake_file WHERE submission_id = ?")
          .bind(submissionId),
        db.prepare("DELETE FROM intake WHERE id = ?").bind(submissionId),
      ]);
      return Number(results?.[1]?.meta?.changes ?? 0) > 0;
    },

    /** Reads a counter without consuming it, so a lockout can be checked first. */
    async readRateToken(bucket) {
      const row = await db
        .prepare("SELECT count FROM intake_rate WHERE bucket = ?")
        .bind(bucket)
        .first();
      return Number(row?.count ?? 0);
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
