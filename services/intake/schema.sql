-- Ovanite intake store.
--
-- Personal data is limited to what the published privacy notice describes and
-- is retained under the retention window documented in
-- docs/operations/backup-and-retention.md. The raw client address is never
-- stored: `ip_hash` is a salted digest used only for rate limiting.

CREATE TABLE IF NOT EXISTS intake (
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
);

CREATE UNIQUE INDEX IF NOT EXISTS intake_dedupe
  ON intake (kind, dedupe_hash);

CREATE INDEX IF NOT EXISTS intake_created
  ON intake (created_at DESC);

CREATE TABLE IF NOT EXISTS intake_rate (
  bucket TEXT PRIMARY KEY,
  window_start INTEGER NOT NULL,
  count INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS intake_rate_window
  ON intake_rate (window_start);

-- Attachments for a submission. Objects live in the R2 binding `FILES` under a
-- generated key; this table is the only index to them, and the key is never
-- derived from a visitor-supplied name.
CREATE TABLE IF NOT EXISTS intake_file (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL REFERENCES intake(id),
  object_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  size INTEGER NOT NULL,
  content_type TEXT NOT NULL,
  digest TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS intake_file_submission
  ON intake_file (submission_id);
