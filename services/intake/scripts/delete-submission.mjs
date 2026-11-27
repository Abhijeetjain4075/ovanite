#!/usr/bin/env node
/**
 * Erases one stored submission and its attachments.
 *
 * The published privacy notice promises deletion on request, so this is the
 * operator half of that promise: it calls the token-protected `DELETE` route,
 * which removes the R2 objects first and then the record and its file rows.
 *
 * Deletion is irreversible and is never the default: the reference must be
 * named and `--yes` must be passed. Nothing is printed except the reference and
 * the number of attachments removed.
 */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { DEFAULT_ORIGIN, MIN_TOKEN_LENGTH } from "./export-submissions.mjs";

const REFERENCE_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Deletes one submission. Resolves with `{ reference, attachments }` on a
 * confirmed deletion; every other outcome throws.
 */
export async function deleteSubmission({
  origin = DEFAULT_ORIGIN,
  token,
  reference,
  fetcher = fetch,
} = {}) {
  if (typeof token !== "string" || token.length < MIN_TOKEN_LENGTH) {
    throw new Error(
      `An operator token of at least ${MIN_TOKEN_LENGTH} characters is required.`,
    );
  }
  if (!REFERENCE_PATTERN.test(String(reference ?? ""))) {
    throw new Error("A submission reference (UUID) is required.");
  }

  const url = `${new URL(origin).origin}/api/intake/${reference}`;
  const response = await fetcher(url, {
    method: "DELETE",
    headers: { authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (response.status === 401) {
    throw new Error(
      "The intake service rejected the operator token (401). Nothing was deleted.",
    );
  }
  if (response.status === 404) {
    throw new Error(
      `No submission with reference ${reference} exists. Nothing was deleted.`,
    );
  }
  if (!response.ok) {
    throw new Error(
      `Deleting ${reference} failed with HTTP ${response.status}. Nothing was deleted.`,
    );
  }

  const body = await response.json().catch(() => ({}));
  if (body?.status !== "deleted") {
    throw new Error(
      `The service did not confirm the deletion of ${reference} (status ${response.status}).`,
    );
  }
  return {
    reference,
    attachments: Number(body.attachments ?? 0),
  };
}

/**
 * Lists the submissions older than a retention window.
 *
 * The published notice says a submission is deleted at most 12 months after
 * review, so an operator needs to see the exact set that is due before removing
 * anything. Nothing is deleted here.
 */
export async function findExpired({
  origin = DEFAULT_ORIGIN,
  token,
  olderThanDays = 365,
  fetcher = fetch,
  limit = 200,
} = {}) {
  if (typeof token !== "string" || token.length < MIN_TOKEN_LENGTH) {
    throw new Error(
      `An operator token of at least ${MIN_TOKEN_LENGTH} characters is required.`,
    );
  }
  if (!Number.isFinite(olderThanDays) || olderThanDays <= 0) {
    throw new Error("A positive retention window in days is required.");
  }

  const url = `${new URL(origin).origin}/api/intake?limit=${encodeURIComponent(String(limit))}`;
  const response = await fetcher(url, {
    headers: { authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (response.status === 401) {
    throw new Error("The intake service rejected the operator token (401).");
  }
  if (!response.ok) {
    throw new Error(`Listing submissions failed with HTTP ${response.status}.`);
  }

  const body = await response.json().catch(() => ({}));
  const cutoff = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;
  const rows = Array.isArray(body?.rows) ? body.rows : [];
  return rows.filter((row) => {
    const createdAt = Date.parse(String(row.created_at ?? row.createdAt ?? ""));
    return Number.isFinite(createdAt) && createdAt < cutoff;
  });
}

/**
 * Deletes every submission past the retention window. A dry run is the default:
 * `confirm` must be true for anything to be removed.
 */
export async function purgeExpired({
  origin = DEFAULT_ORIGIN,
  token,
  olderThanDays = 365,
  fetcher = fetch,
  confirm = false,
  log = () => {},
} = {}) {
  const expired = await findExpired({ origin, token, olderThanDays, fetcher });
  log(`${expired.length} submission(s) are past ${olderThanDays} days.`);

  const deleted = [];
  if (!confirm) {
    for (const row of expired) {
      log(`  would delete ${row.id} (${row.kind}, ${row.created_at ?? "?"})`);
    }
    return { expired: expired.length, deleted, dryRun: true };
  }

  for (const row of expired) {
    const result = await deleteSubmission({
      reference: String(row.id),
      token,
      origin,
      fetcher,
    });
    deleted.push(result);
    log(`  deleted ${result.reference} (${result.attachments} attachment(s))`);
  }
  return { expired: expired.length, deleted, dryRun: false };
}

function argument(argv, name) {
  const index = argv.indexOf(name);
  return index === -1 ? undefined : argv[index + 1];
}

const OPTIONS_WITH_VALUES = new Set([
  "--origin",
  "--token-file",
  "--older-than-days",
]);

/** Positional arguments only, so an option value is never read as a reference. */
function positional(argv) {
  const values = [];
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (OPTIONS_WITH_VALUES.has(value)) {
      index += 1;
      continue;
    }
    if (value.startsWith("--")) continue;
    values.push(value);
  }
  return values;
}

async function main() {
  const argv = process.argv.slice(2);
  const daysArgument = argument(argv, "--older-than-days");
  const reference = positional(argv)[0];
  const origin = argument(argv, "--origin") ?? process.env.INTAKE_API_ORIGIN ?? DEFAULT_ORIGIN;
  const tokenFile = argument(argv, "--token-file");

  if (!reference && !daysArgument) {
    throw new Error(
      "Usage: delete-submission.mjs <reference> --yes [--token-file <path>]\n" +
        "       delete-submission.mjs --older-than-days 365 [--yes]",
    );
  }

  const token = tokenFile
    ? (await readFile(tokenFile, "utf8")).trim()
    : (process.env.INTAKE_ADMIN_TOKEN ?? "").trim();
  if (!token) {
    throw new Error("Set INTAKE_ADMIN_TOKEN, or pass --token-file <path>.");
  }

  if (daysArgument) {
    const olderThanDays = Number(daysArgument);
    const result = await purgeExpired({
      origin,
      token,
      olderThanDays,
      confirm: argv.includes("--yes"),
      log: (line) => console.log(line),
    });
    console.log(
      result.dryRun
        ? `Dry run: ${result.expired} submission(s) past ${olderThanDays} days. Re-run with --yes to delete them.`
        : `Deleted ${result.deleted.length} submission(s) past ${olderThanDays} days.`,
    );
    return;
  }

  if (!argv.includes("--yes")) {
    throw new Error(
      `Refusing to delete ${reference} without --yes. Deletion is permanent.`,
    );
  }

  const result = await deleteSubmission({ origin, token, reference });
  console.log(
    `Deleted ${result.reference} and ${result.attachments} attachment(s).`,
  );
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
