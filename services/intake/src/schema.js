/**
 * Idempotent schema bootstrap.
 *
 * D1 has no migration runner in this deployment path, so the Worker applies the
 * same `CREATE ... IF NOT EXISTS` statements in `schema.sql` once per isolate.
 * They are additive only: this code never drops, alters or truncates an existing
 * table, so a redeploy cannot destroy stored submissions.
 */
export const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS intake (
    id TEXT PRIMARY KEY,
    kind TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT,
    note TEXT,
    project TEXT,
    stack TEXT,
    repository TEXT,
    status TEXT,
    dedupe_hash TEXT NOT NULL,
    created_at TEXT NOT NULL,
    source_origin TEXT,
    ip_hash TEXT NOT NULL,
    request_id TEXT
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS intake_dedupe
    ON intake (kind, dedupe_hash)`,
  `CREATE INDEX IF NOT EXISTS intake_created
    ON intake (created_at DESC)`,
  `CREATE TABLE IF NOT EXISTS intake_rate (
    bucket TEXT PRIMARY KEY,
    window_start INTEGER NOT NULL,
    count INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS intake_rate_window
    ON intake_rate (window_start)`,
  `CREATE TABLE IF NOT EXISTS intake_file (
    id TEXT PRIMARY KEY,
    submission_id TEXT NOT NULL REFERENCES intake(id),
    object_key TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    size INTEGER NOT NULL,
    content_type TEXT NOT NULL,
    digest TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS intake_file_submission
    ON intake_file (submission_id)`,
];

let ready = false;

export async function ensureSchema(db) {
  if (ready) return;
  for (const statement of SCHEMA_STATEMENTS) {
    await db.prepare(statement).run();
  }
  ready = true;
}
