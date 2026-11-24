#!/usr/bin/env node
/**
 * Participant portal migration invariant gate.
 *
 * `drizzle-kit generate` cannot run in this repository (0.31.5 throws
 * `invalid_union` on `onUpdateNow()`), so migrations and snapshots are written
 * by hand. That makes drift a review-memory problem: a hand-edited snapshot can
 * silently claim a column that no migration adds.
 *
 * This gate enforces the structural invariants of the hand-maintained chain and
 * is read-only:
 *   - the journal parses, indices are contiguous and tags are unique;
 *   - every journal entry has a `.sql` file and no `.sql` file is orphaned;
 *   - every entry has a snapshot whose `prevId` links to its predecessor;
 *   - every table/column that first appears in snapshot N is named by the SQL
 *     of migration N.
 */
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const PORTAL_DIR = "apps/participant-portal";
const DRIZZLE_DIR = "drizzle";
const META_DIR = "drizzle/meta";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const drizzleDir = path.join(root, PORTAL_DIR, DRIZZLE_DIR);
const metaDir = path.join(root, PORTAL_DIR, META_DIR);

const failures = [];
const fail = message => failures.push(message);

async function readJson(filePath, label) {
  const raw = await readFile(filePath, "utf8");
  try {
    return JSON.parse(raw);
  } catch (error) {
    fail(`${label} is not valid JSON (${error instanceof Error ? error.message : "parse error"}).`);
    return null;
  }
}

const journal = await readJson(path.join(metaDir, "_journal.json"), "drizzle/meta/_journal.json");
const sqlFiles = (await readdir(drizzleDir)).filter(name => name.endsWith(".sql")).sort();

if (journal) {
  const entries = Array.isArray(journal.entries) ? journal.entries : [];
  if (entries.length === 0) fail("Migration journal has no entries.");
  if (journal.dialect !== "mysql") fail(`Migration journal dialect must be mysql, found ${String(journal.dialect)}.`);

  const tags = new Set();
  let previousId = null;

  for (const [index, entry] of entries.entries()) {
    const tag = typeof entry.tag === "string" ? entry.tag : "";
    if (!tag) {
      fail(`Journal entry ${index} has no tag.`);
      continue;
    }
    if (entry.idx !== index) fail(`Journal entry "${tag}" has idx ${String(entry.idx)}, expected ${index}.`);
    if (tags.has(tag)) fail(`Journal tag "${tag}" appears more than once.`);
    tags.add(tag);

    const sqlPath = path.join(drizzleDir, `${tag}.sql`);
    let sql = null;
    try {
      sql = await readFile(sqlPath, "utf8");
      if (sql.trim().length === 0) fail(`Migration "${tag}" is empty.`);
    } catch {
      fail(`Journal entry "${tag}" has no matching ${DRIZZLE_DIR}/${tag}.sql.`);
    }

    const snapshotName = `${tag.slice(0, 4)}_snapshot.json`;
    const snapshot = await readJson(path.join(metaDir, snapshotName), `drizzle/meta/${snapshotName}`);
    if (!snapshot) continue;

    if (previousId !== null && snapshot.prevId !== previousId) {
      fail(
        `Snapshot "${snapshotName}" prevId ${String(snapshot.prevId)} does not link to the previous snapshot id ${String(previousId)}.`,
      );
    }
    previousId = snapshot.id;

    if (!sql) continue;

    // Compare with the previous snapshot: anything new here must be created by
    // this migration's SQL, otherwise the chain claims history that never ran.
    const previousSnapshot = index === 0
      ? null
      : await readJson(path.join(metaDir, `${entries[index - 1].tag.slice(0, 4)}_snapshot.json`), "previous snapshot");
    const previousTables = previousSnapshot?.tables ?? {};

    for (const [tableName, table] of Object.entries(snapshot.tables ?? {})) {
      const existed = Object.hasOwn(previousTables, tableName);
      const escaped = tableName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const createMatch = new RegExp(`CREATE TABLE (IF NOT EXISTS )?\`${escaped}\` \\(([\\s\\S]*?)\\n\\);`).exec(sql);
      if (!existed && !createMatch) {
        fail(`Snapshot "${snapshotName}" declares table "${tableName}" that ${tag}.sql never creates.`);
      }
      for (const columnName of Object.keys(table?.columns ?? {})) {
        const existedBefore = existed && Object.hasOwn(previousTables[tableName]?.columns ?? {}, columnName);
        if (existedBefore) continue;
        // A new column must be created by this migration. A bare mention is not
        // enough: an index over the column, or a similarly named column such as
        // `prevHash`, would otherwise satisfy a substring search.
        const column = columnName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        // MySQL accepts both `ADD COLUMN \`c\`` and the `ADD \`c\`` shorthand.
        const added = new RegExp(`(ADD|MODIFY|CHANGE)( COLUMN)? \`${column}\``).test(sql);
        const insideCreate = Boolean(createMatch) && createMatch[2].includes(`\`${columnName}\``);
        if (!added && !insideCreate) {
          fail(`Snapshot "${snapshotName}" declares ${tableName}.${columnName} that ${tag}.sql never adds.`);
        }
      }
    }
  }

  const known = new Set(Array.from(tags, tag => `${tag}.sql`));
  for (const file of sqlFiles) {
    if (!known.has(file)) fail(`${DRIZZLE_DIR}/${file} is not referenced by the migration journal.`);
  }
}

if (failures.length > 0) {
  console.error("Portal migration invariant check failed:");
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(`Portal migration invariants OK (${sqlFiles.length} migrations, chain intact).`);
